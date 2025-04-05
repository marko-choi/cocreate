import { useEffect, useRef, useState } from "react";
import "./canvas.css";
import { Annotation, Selection } from "@/types/global";

// Configuration constants
const MAX_HEATMAP_OPACITY = 0.8; // 80% opacity

export interface CanvasProps {
  annotations: Annotation[];
  activeComment: string | null;
  canvasWidth: number;
  canvasHeight: number;
  viewMode: "selection" | "heatmap" | "flatHeatmap";
  onSelectionCreated?: (selection: Selection) => void;
  onSelectionCleared?: () => void;
  currentSelection?: Selection | null;
  onClearSelection?: () => void;
}

const Canvas = (props: CanvasProps) => {
  const {
    annotations,
    activeComment,
    canvasWidth,
    canvasHeight,
    viewMode,
    onSelectionCreated,
    onSelectionCleared,
    currentSelection: externalSelection,
    onClearSelection
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [internalSelection, setInternalSelection] = useState<Selection | null>(null);

  // Use external selection if provided, otherwise use internal state
  const currentSelection = externalSelection !== undefined ? externalSelection : internalSelection;

  // Add effect to handle external selection changes
  useEffect(() => {
    if (externalSelection === null) {
      // Clear internal selection state
      setInternalSelection(null);

      // Force canvas redraw to clear the selection
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Redraw the canvas based on the current view mode
          if (viewMode === "flatHeatmap") {
            // Redraw flat heatmap
            const imageData = ctx.createImageData(canvasWidth, canvasHeight);
            const data = imageData.data;
            const heatmap = new Uint16Array(canvasWidth * canvasHeight);

            // Fill the heatmap with overlap counts
            annotations.forEach((annotation) => {
              annotation.selections.forEach((selection) => {
                if (!selection.show) return;
                const xStart = Math.max(0, Math.floor(selection.start.x));
                const yStart = Math.max(0, Math.floor(selection.start.y));
                const xEnd = Math.min(canvasWidth, Math.ceil(selection.end.x));
                const yEnd = Math.min(canvasHeight, Math.ceil(selection.end.y));

                for (let y = yStart; y < yEnd; y++) {
                  for (let x = xStart; x < xEnd; x++) {
                    heatmap[y * canvasWidth + x]++;
                  }
                }
              });
            });

            let maxCount = 0;
            for (let i = 0; i < heatmap.length; i++) {
              if (heatmap[i] > maxCount) {
                maxCount = heatmap[i];
              }
            }

            if (maxCount === 0) return;

            // Convert heatmap values to pixel data
            for (let i = 0; i < heatmap.length; i++) {
              const count = heatmap[i];

              // Use the configurable maximum opacity
              const alpha = Math.min(255, Math.floor((count / maxCount) * 255 * MAX_HEATMAP_OPACITY));

              const index = i * 4;
              // Color: #424E64
              data[index] = 66;         // Red
              data[index + 1] = 78;       // Green
              data[index + 2] = 120;       // Blue
              data[index + 3] = alpha; // Alpha
            }

            ctx.putImageData(imageData, 0, 0);
          } else {
            // Redraw regular view
            annotations.forEach((annotation) => {
              annotation.selections.forEach((selection) => {
                if (!selection.show) return;
                const isActive = selection.uid === activeComment;

                let fillStyle = "rgba(200, 200, 200, 0.3)";
                let strokeStyle = "white";
                let lineWidth = 2;

                if (isActive) {
                  fillStyle = "rgba(250, 123, 123, 0.3)";
                  strokeStyle = "red";
                  lineWidth = 3;
                }

                const x = selection.start.x;
                const y = selection.start.y;
                const width = selection.end.x - selection.start.x;
                const height = selection.end.y - selection.start.y;
                drawSelection(ctx, x, y, width, height, fillStyle, strokeStyle, lineWidth);
              });
            });
          }
        }
      }

      // Notify parent components
      onSelectionCleared?.();
      onClearSelection?.();
    }
  }, [externalSelection, viewMode, canvasWidth, canvasHeight, annotations, activeComment]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Start creating a new selection immediately
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setSelectionEnd({ x, y });
  };

  const handleMouseUp = () => {
    if (!isSelecting || !selectionStart || !selectionEnd) return;

    // Check if the selection is just a point (click without dragging)
    const isPointSelection =
      Math.abs(selectionEnd.x - selectionStart.x) < 5 &&
      Math.abs(selectionEnd.y - selectionStart.y) < 5;

    if (isPointSelection) {
      // If it's just a point selection, clear the current selection
      setInternalSelection(null);
      onSelectionCleared?.();
    } else {
      // Otherwise, create a new selection
      const selection: Selection = {
        start: selectionStart,
        end: selectionEnd,
        functionValue: null,
        aestheticValue: null,
        comment: "",
        show: true,
        uid: Math.random().toString(36).substring(7)
      };

      setInternalSelection(selection);
      onSelectionCreated?.(selection);
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleClearSelection = () => {
    setInternalSelection(null);
    onSelectionCleared?.();
    onClearSelection?.();
  };

  const drawSelection = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fillStyle: string = "rgba(200, 200, 200, 0.3)",
    strokeStyle: string = "white",
    lineWidth: number = 2,
    radius: number = 15
  ) => {
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
  };

  const drawActiveSelection = (ctx: CanvasRenderingContext2D) => {
    // Draw the current selection being created (if any)
    if (isSelecting && selectionStart && selectionEnd) {
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);

      drawSelection(
        ctx,
        x,
        y,
        width,
        height,
        "rgba(66, 153, 225, 0.3)", // Light blue fill
        "#3182ce", // Blue stroke
        1 // Thicker line
      );
    }
  };

  const drawPersistentSelection = (ctx: CanvasRenderingContext2D) => {
    // Draw the persistent selection (if any)
    if (currentSelection) {
      const x = Math.min(currentSelection.start.x, currentSelection.end.x);
      const y = Math.min(currentSelection.start.y, currentSelection.end.y);
      const width = Math.abs(currentSelection.end.x - currentSelection.start.x);
      const height = Math.abs(currentSelection.end.y - currentSelection.start.y);

      drawSelection(
        ctx,
        x,
        y,
        width,
        height,
        "rgba(66, 153, 225, 0.3)", // Light blue fill
        "#3182ce", // Blue stroke
        1 // Thicker line
      );
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (viewMode == "flatHeatmap") {
      const imageData = ctx.createImageData(canvasWidth, canvasHeight);
      const data = imageData.data;
      const heatmap = new Uint16Array(canvasWidth * canvasHeight);

      // Fill the heatmap with overlap counts
      annotations.forEach((annotation) => {
        annotation.selections.forEach((selection) => {
          if (!selection.show) return;
          const xStart = Math.max(0, Math.floor(selection.start.x));
          const yStart = Math.max(0, Math.floor(selection.start.y));
          const xEnd = Math.min(canvasWidth, Math.ceil(selection.end.x));
          const yEnd = Math.min(canvasHeight, Math.ceil(selection.end.y));

          for (let y = yStart; y < yEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
              heatmap[y * canvasWidth + x]++;
            }
          }
        });
      });

      let maxCount = 0;
      for (let i = 0; i < heatmap.length; i++) {
        if (heatmap[i] > maxCount) {
          maxCount = heatmap[i];
        }
      }

      if (maxCount === 0) return;

      // Convert heatmap values to pixel data
      for (let i = 0; i < heatmap.length; i++) {
        const count = heatmap[i];

        // Use the configurable maximum opacity
        const alpha = Math.min(255, Math.floor((count / maxCount) * 255 * MAX_HEATMAP_OPACITY));

        const index = i * 4;
        // Color: #424E64
        data[index] = 66;         // Red
        data[index + 1] = 78;       // Green
        data[index + 2] = 120;       // Blue
        data[index + 3] = alpha; // Alpha
      }

      ctx.putImageData(imageData, 0, 0);

      // Draw active selection on top of flat heatmap
      drawActiveSelection(ctx);
      // Draw persistent selection on top of everything ONLY if it exists
      if (currentSelection) {
        drawPersistentSelection(ctx);
      }
    }
    else if (viewMode === "heatmap") {
      const imageData = ctx.createImageData(canvasWidth, canvasHeight);
      const data = imageData.data;
      const heatmap = new Uint16Array(canvasWidth * canvasHeight);

      // Fill the heatmap with overlap counts
      annotations.forEach((annotation) => {
        annotation.selections.forEach((selection) => {
          if (!selection.show) return;
          const xStart = Math.max(0, Math.floor(selection.start.x));
          const yStart = Math.max(0, Math.floor(selection.start.y));
          const xEnd = Math.min(canvasWidth, Math.ceil(selection.end.x));
          const yEnd = Math.min(canvasHeight, Math.ceil(selection.end.y));

          for (let y = yStart; y < yEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
              heatmap[y * canvasWidth + x]++;
            }
          }
        });
      });

      let maxCount = 0;
      for (let i = 0; i < heatmap.length; i++) {
        if (heatmap[i] > maxCount) {
          maxCount = heatmap[i];
        }
      }

      if (maxCount === 0) return;

      for (let i = 0; i < heatmap.length; i++) {
        const count = heatmap[i];
        const intensity = count / maxCount;

        // Map intensity to hue (60° = yellow, 300° = purple)
        const hue = 60 + intensity * (300 - 60);
        const saturation = 100;
        const lightness = 50;

        const h = hue / 360;
        const s = saturation / 100;
        const l = lightness / 100;

        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => {
          const k = (n + h * 12) % 12;
          const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
          return Math.round(255 * color);
        };

        const index = i * 4;
        // Use the configurable maximum opacity
        let dynamicAlpha = Math.min(255, Math.floor(intensity * 255 * MAX_HEATMAP_OPACITY));

        data[index] = f(0);     // Red
        data[index + 1] = f(8); // Green
        data[index + 2] = f(4); // Blue
        data[index + 3] = dynamicAlpha;
      }

      ctx.putImageData(imageData, 0, 0);

      // Draw active selection on top of heatmap
      drawActiveSelection(ctx);
      // Draw persistent selection on top of everything ONLY if it exists
      if (currentSelection) {
        drawPersistentSelection(ctx);
      }
    }
    else {
      // Default selection view

      // First, collect all selections that should be drawn
      const allSelections: { selection: any, isActive: boolean }[] = [];

      annotations.forEach((annotation) => {
        annotation.selections.forEach((selection) => {
          if (!selection.show) return;

          const isActive = selection.uid === activeComment;
          allSelections.push({ selection, isActive });
        });
      });

      // Sort selections to put active ones last (so they're drawn on top)
      allSelections.sort((a, b) => {
        if (a.isActive && !b.isActive) return 1;
        if (!a.isActive && b.isActive) return -1;
        return 0;
      });

      // Draw all selections in the sorted order
      allSelections.forEach(({ selection, isActive }) => {
        let fillStyle = "rgba(200, 200, 200, 0.3)";
        let strokeStyle = "white";
        let lineWidth = 2;

        if (isActive) {
          fillStyle = "rgba(250, 123, 123, 0.3)";
          strokeStyle = "red";
          lineWidth = 3;
        }

        const x = selection.start.x;
        const y = selection.start.y;
        const width = selection.end.x - selection.start.x;
        const height = selection.end.y - selection.start.y;
        drawSelection(ctx, x, y, width, height, fillStyle, strokeStyle, lineWidth);
      });

      // Draw the current selection being created (if any)
      drawActiveSelection(ctx);
      // Draw persistent selection on top of everything ONLY if it exists
      if (currentSelection) {
        drawPersistentSelection(ctx);
      }
    }
  }, [annotations, activeComment, viewMode, canvasWidth, canvasHeight, isSelecting, selectionStart, selectionEnd, currentSelection]);

  return (
    <div
      className="canvas-container flex justify-center items-center"
      style={{
        aspectRatio: `${canvasWidth} / ${canvasHeight}`,
        maxWidth: `${(canvasWidth / canvasHeight) * 75}vh`,
        maxHeight: '75vh',
        position: 'relative',
        justifyContent: "center",
        alignItems: "center",
        display: "inline-block",
      }}
    >
      <img
        src={annotations[0].imagePath}
        alt="Rendering"
        className="rendering-image overflow-scroll aspect-auto"
        style={{
          top: '50%',
          left: '50%',
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transform: 'translate(-50%, -50%)',
        }}
      />

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="canvas"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transform: 'translate(-50%, -50%)',
          cursor: isSelecting ? 'crosshair' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default Canvas;
