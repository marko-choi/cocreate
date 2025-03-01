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
        // paddingTop: `${(canvasHeight / canvasWidth) * 100}%`,  // create empty space for the canvas (aspect ratio'd)
        // maxHeight: '75vh', // Maximum height of 90% of the viewport
        aspectRatio: `${canvasWidth} / ${canvasHeight}`, // Maintain aspect ratio
        // width: "100%",
        maxWidth: `${(canvasWidth / canvasHeight) * 75}vh`, // Max width based on aspect ratio and 90vh cap
        maxHeight: '75vh', // Cap height at 90% viewport
        position: 'relative',
        justifyContent: "center",
        alignItems: "center",
        display: "inline-block",
      }}
    >
      <img
          src="../rendering.jpg"
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
}

export default Canvas;