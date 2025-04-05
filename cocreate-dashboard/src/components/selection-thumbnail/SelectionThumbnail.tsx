import { useEffect, useRef } from "react";
import { Annotation } from "@/types/global";
import { cn } from "@/lib/utils";

interface SelectionThumbnailProps {
  annotation: Annotation;
  width: number;
  height: number;
  onClick: () => void;
  isActive: boolean;
}

const SelectionThumbnail = ({
  annotation,
  width,
  height,
  onClick,
  isActive,
}: SelectionThumbnailProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create heatmap data
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const heatmap = new Uint16Array(width * height);

    // Fill the heatmap with overlap counts
    annotation.selections.forEach((selection) => {
      if (!selection.show) return;
      const xStart = Math.max(0, Math.floor(selection.start.x));
      const yStart = Math.max(0, Math.floor(selection.start.y));
      const xEnd = Math.min(width, Math.ceil(selection.end.x));
      const yEnd = Math.min(height, Math.ceil(selection.end.y));

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          heatmap[y * width + x]++;
        }
      }
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
      // maximum alpha = 80%
      const alpha = Math.min(255, Math.floor((count / maxCount) * 255));

      const index = i * 4;
      // Color: #424E64
      data[index] = 66;     // Red
      data[index + 1] = 78;   // Green
      data[index + 2] = 120;   // Blue
      data[index + 3] = alpha; // Alpha
    }

    ctx.putImageData(imageData, 0, 0);
  }, [annotation, width, height]);

  return (
    <div
      className={cn(
        "flex jusify-content-center items-center relative cursor-pointer",
        "hover:scale-105 transform transition duration-300 ease-in-out",
        "border-3 border-transparent bg-gray-200",
        { "border-blue-500 bg-blue-200": isActive }
      )}
      style={{
        borderColor: isActive ? '#1338BE' : '#E8E8E8',
        height: 'fit-content'
      }}
      onClick={onClick}
    >
      <div className="relative w-full max-w-80 mx-auto border aspect-[3/2]">
        <img
          src={annotation.imagePath}
          alt="rendering"
          className="w-full h-full object-contain"
        />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 w-full h-full"
        />
        {/* Overlay to show the number of annotations */}
        <div className="absolute bottom-0 left-0 w-full bg-[#696969cc] text- z-30 flex flex-wrap-reverse">
          <div className="w-full bg-[#c9c9c93e] text-white p-1 z-30 text-ellipsis overflow-hidden whitespace-nowrap">
            {annotation.imageName} - {annotation.selections.length} entries
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionThumbnail;