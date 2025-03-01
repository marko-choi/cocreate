import { useEffect, useRef } from "react";
import "./canvas.css";

export interface CanvasProps {
  selections: any;
  canvasWidth: number;
  canvasHeight: number;
}

const Canvas = (props: CanvasProps) => {
  const { 
    selections, 
    canvasWidth,
    canvasHeight
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
    console.log("drawSelection", x, y, width, height);
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
  
    // Draw the rectangle with rounded corners
    ctx.beginPath();
    ctx.moveTo(x, y); // Move to the top-left corner
    ctx.lineTo(x + width, y); // Draw line to the top-right corner
    ctx.lineTo(x + width, y + height); // Draw line to the bottom-right corner
    ctx.lineTo(x, y + height); // Draw line to the bottom-left corner
    ctx.closePath(); // Close the path to the top-left corner
    
    ctx.fill(); // Fill the rounded rectangle
    ctx.stroke(); // Stroke the rounded rectangle
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return

    const ctx = canvas.getContext("2d");
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    selections.forEach((selection: any) => {
      const x = selection.start.x
      const y = selection.start.y
      const width = selection.end.x - selection.start.x
      const height = selection.end.y - selection.start.y
      
      drawSelection(ctx, x, y, width, height);
    });
  }
  , [selections]);

  return (
    <div 
      className="canvas-container flex justify-center items-center"
      style={{
        width: `100%`,
        height: `${canvasHeight}px`,
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
      }}
    >
      <img
          src="../rendering.jpg"
          alt="Rendering"
          className="rendering-image overflow-scroll"
          style={{ 
            // maxWidth: MAX_IMAGE_WIDTH, 
            height: `${canvasHeight}px`,
            width: `${canvasWidth}px`,
            // display: "block",
          }}
        />

     <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="canvas"
      />
    
    </div>
  );
}

export default Canvas;