import { Delete, Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Tooltip from "../tooltip/Tooltip";
import "./canvas.css";

interface Selection {
  start: { x: number; y: number };
  end: { x: number; y: number };
  functionValue?: string;
  aestheticValue?: string;
  comment?: string;
}

const DEFAULT_IMAGE_SRC = "./rendering.jpg";
const MAX_IMAGE_WIDTH = 800;

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeSelectionIndex, setActiveSelectionIndex] = useState<number | null>(null);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE_SRC);
  const [canvasWidth, setCanvasWidth] = useState<number>(MAX_IMAGE_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState<number>(534);

  // Clear selections from localStorage when component mounts
  useEffect(() => {
    localStorage.removeItem('cocreate-canvasSelections');
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cocreate-canvasSelections', JSON.stringify(selections));
  }, [selections]);


  // Set canvas size based on image dimensions
  const setCanvasDimensions = (img: HTMLImageElement) => {
    const maxWidth = MAX_IMAGE_WIDTH;
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    const aspectRatio = imgHeight / imgWidth;
    const width = Math.min(maxWidth, imgWidth);
    const height = Math.min(imgHeight, aspectRatio * width);

    setCanvasWidth(width);
    setCanvasHeight(height);
  };

  useEffect(() => {
    const questionBodyImage = document.querySelector(".QuestionText img");
    if (questionBodyImage && questionBodyImage instanceof HTMLImageElement) {
      
      setImageSrc(questionBodyImage.getAttribute("src") ?? DEFAULT_IMAGE_SRC);
      questionBodyImage.onload = () => setCanvasDimensions(questionBodyImage);
      setCanvasDimensions(questionBodyImage);

    } else {
      
      const defaultImage = document.querySelector("img");
      if (defaultImage && defaultImage instanceof HTMLImageElement) {
        setImageSrc(defaultImage.getAttribute("src") ?? DEFAULT_IMAGE_SRC);
        defaultImage.onload = () => setCanvasDimensions(defaultImage);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      redrawSelections(ctx);
    }
  }, [selections]);

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
  
    // Draw the rectangle with rounded corners
    ctx.beginPath();
    ctx.moveTo(x + radius, y); // Move to the top-left corner, with rounded edge
    ctx.arcTo(x + width, y, x + width, y + height, radius); // Top-right corner
    ctx.arcTo(x + width, y + height, x, y + height, radius); // Bottom-right corner
    ctx.arcTo(x, y + height, x, y, radius); // Bottom-left corner
    ctx.arcTo(x, y, x + width, y, radius); // Top-left corner
    ctx.closePath();
  
    ctx.fill(); // Fill the rounded rectangle
    ctx.stroke(); // Stroke the rounded rectangle
  };

  const redrawSelections = (ctx: CanvasRenderingContext2D) => {
    // Draw all selections without restrictions
    selections.forEach(({ start, end }) => {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      drawSelection(ctx, x, y, width, height);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !canvasRef.current) return;
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    const rect = canvas.getBoundingClientRect();
    const currentEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  
    setSelectionEnd(currentEnd);
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawSelections(ctx);
  
    const x = Math.min(selectionStart.x, currentEnd.x);
    const y = Math.min(selectionStart.y, currentEnd.y);
    const width = Math.abs(currentEnd.x - selectionStart.x);
    const height = Math.abs(currentEnd.y - selectionStart.y);
  
    // Draw the current selection being created
    drawSelection(ctx, x, y, width, height);
  };

  const handleMouseUp = () => {
    if (!isSelecting || !selectionStart || !selectionEnd || !canvasRef.current) return;

    if (selectionStart.x === selectionEnd.x && selectionStart.y === selectionEnd.y) {
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;

      const { width, height } = canvasElement.getBoundingClientRect();
      const newSelection: Selection = {
        start: { x: 0, y: 0 },
        end: { x: width, y: height },
      };
      setSelections((prev) => [...prev, newSelection]);
    } else {
      const newSelection: Selection = {
        start: selectionStart,
        end: selectionEnd,
      };
      setSelections((prev) => [...prev, newSelection]);  
    }

    const x = Math.max(selectionStart.x, selectionEnd.x);
    const y = Math.max(selectionStart.y, selectionEnd.y);

    setTooltipPosition({ x, y });
    setActiveSelectionIndex(selections.length);

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };


  const handleEdit = (index: number) => {
    setActiveSelectionIndex(index);
    const selection = selections[index];
    const x = Math.min(selection.start.x, selection.end.x);
    const y = Math.min(selection.start.y, selection.end.y);
    setTooltipPosition({ x, y });
  };

  const handleDelete = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index));
    setTooltipPosition(null);
    setActiveSelectionIndex(null);
  };

  // const [mouseCoordinates, setMouseCoordinates] = useState<[number, number] | null>(null);
    
  // Continuously updates mouse coordinates
  // useEffect(() => {
  //   const handleMouseMove = (e: MouseEvent) => {
  //     setMouseCoordinates([e.clientX, e.clientY]);
  //   };
  //   window.addEventListener("mousemove", handleMouseMove);
  //   return () => window.removeEventListener("mousemove", handleMouseMove);
  // }, []);

  return (
    <div className="canvas-container">
      <img
        src={imageSrc}
        alt="Rendering"
        className="rendering-image"
        style={{ maxWidth: MAX_IMAGE_WIDTH, width: "100%", height: "auto" }}
      />
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {/* Render selections div elements (same as original code) */}
      {selections.map((selection, index) => {
        const x = Math.min(selection.start.x, selection.end.x);
        const y = Math.min(selection.start.y, selection.end.y);
        const width = Math.abs(selection.end.x - selection.start.x);
        const height = Math.abs(selection.end.y - selection.start.y);

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              top: y,
              left: x,
              width,
              height,
            }}
          >
            <div className="selection-tooltip-box"> 
              <IconButton 
                size="small"
                className="edit-button"
                onClick={() => handleEdit(index)}
              >
                <Edit />
              </IconButton>
              <IconButton 
                size="small"
                className="delete-button"
                onClick={() => handleDelete(index)}
              >
                <Delete />
              </IconButton>
            </div>
          </div>
        );
      })}
      {tooltipPosition && activeSelectionIndex !== null && (
        <Tooltip
          x={tooltipPosition.x}
          y={tooltipPosition.y}
          selection={selections[activeSelectionIndex]}
          onSave={
            ({ functionValue, aestheticValue, comment }) => {
              setSelections((prev) => {
                const newSelections = [...prev];
                newSelections[activeSelectionIndex] = {
                  ...newSelections[activeSelectionIndex],
                  functionValue,
                  aestheticValue,
                  comment,
                };
                return newSelections;
              });
              setTooltipPosition(null);
              setActiveSelectionIndex(null);
          }}
          onDelete={() => handleDelete(activeSelectionIndex)}
        />
      )}
    </div>
  );
};

export default Canvas;