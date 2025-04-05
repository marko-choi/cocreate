import { useEffect, useRef } from "react";
import "./canvas.css";
import { Annotation } from "@/types/global";

export interface CanvasProps {
  annotations: Annotation[];
  activeComment: string | null;
  canvasWidth: number;
  canvasHeight: number;
  viewMode: "selection" | "heatmap" | "flatHeatmap";
}

const Canvas = (props: CanvasProps) => {
  const { 
    annotations, 
    activeComment,
    canvasWidth,
    canvasHeight,
    viewMode
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        const intensity = Math.min(255, Math.floor((count / maxCount) * 255));

        const index = i * 4;
        data[index] = 255;         // Red
        data[index + 1] = 0;       // Green
        data[index + 2] = 0;       // Blue
        data[index + 3] = intensity; // Alpha
      }

      ctx.putImageData(imageData, 0, 0);
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
        data[index] = f(0);     // Red
        data[index + 1] = f(8); // Green
        data[index + 2] = f(4); // Blue

        let dynamicAlpha = Math.min(255, Math.floor(intensity * 255));
        let staticAlpha = 100;

        data[index + 3] = dynamicAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    } else {
      // Default selection view
      annotations.forEach((annotation) => {
        annotation.selections.forEach((selection) => {
          if (!selection.show) return;

          let fillStyle = "rgba(200, 200, 200, 0.3)";
          let strokeStyle = "white";

          if (selection.uid === activeComment) {
            fillStyle = "rgba(250, 123, 123, 0.3)";
            strokeStyle = "red";
          }

          const x = selection.start.x;
          const y = selection.start.y;
          const width = selection.end.x - selection.start.x;
          const height = selection.end.y - selection.start.y;
          drawSelection(ctx, x, y, width, height, fillStyle, strokeStyle);
        });
      });
    }
  }, [annotations, activeComment, viewMode, canvasWidth, canvasHeight]);

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
        }}
      />
    </div>
  );
};

export default Canvas;
