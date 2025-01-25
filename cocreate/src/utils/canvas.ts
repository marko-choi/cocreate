
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

export { drawSelection };
