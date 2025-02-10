import { Delete, Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Tooltip from "../tooltip/Tooltip";
import "./canvas.css";
import { Point } from "../../types/global";

export interface SelectionCoordinates {
  x: number;
  y: number;
}

export interface Selection {
  start: SelectionCoordinates;
  end: SelectionCoordinates;
  functionValue?: string;
  aestheticValue?: string;
  comment?: string;
}

const DEFAULT_IMAGE_SRC = "./rendering.jpg";
const MAX_IMAGE_WIDTH = 800;

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<Point | null>(null);
  const [activeSelectionIndex, setActiveSelectionIndex] = useState<number | null>(null);
  const [isEnteringFeedback, setIsEnteringFeedback] = useState(false);
  const [allowPictureSelection, setAllowPictureSelection] = useState(true);

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
    
    removeEmptyFeedback();

    if (isEnteringFeedback) {
      setActiveSelectionIndex(null);
      setIsEnteringFeedback(false);
      return;
    }

    setActiveSelectionIndex(null);
    registerSelection(e, canvas);
  };

  const registerSelection = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsSelecting(true);
  }

  const removeEmptyFeedback = () => {
    if (activeSelectionIndex !== null) {
      const selection = selections[activeSelectionIndex];
      if (
        !selection.functionValue && 
        !selection.aestheticValue &&
        !selection.comment
      ) {
        checkForPictureSelection();
        console.log("Removing empty feedback:" + activeSelectionIndex + " " + JSON.stringify(selection));
        setSelections((prev) => prev.filter((_, i) => i !== activeSelectionIndex));
        setTooltipPosition(null);
        setActiveSelectionIndex(null);
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !canvasRef.current || isEnteringFeedback) return;
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    const rect = canvas.getBoundingClientRect();
    const currentEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Update the selection
    setSelectionEnd(currentEnd);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawSelections(ctx);
  
    const x = Math.min(selectionStart.x, currentEnd.x);
    const y = Math.min(selectionStart.y, currentEnd.y);
    const width = Math.abs(currentEnd.x - selectionStart.x);
    const height = Math.abs(currentEnd.y - selectionStart.y);
      
    // Draw the current selection being created
    drawSelection(ctx, x, y, width, height);
    checkIfMouseIsInsideCanvas(e);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!isSelecting || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Determine the mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Clamp the mouse position to the canvas boundaries
    const clampedX = Math.max(0, Math.min(mouseX, canvas.width));
    const clampedY = Math.max(0, Math.min(mouseY, canvas.height));

    // Set the selection end point to the clamped position
    setSelectionEnd({ x: clampedX, y: clampedY });

    // Draw the selection rectangle
    if (selectionStart) {
      const startX = selectionStart.x;
      const startY = selectionStart.y;
      const width = clampedX - startX;
      const height = clampedY - startY;

      // Clear the canvas and redraw existing selections if necessary
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      redrawSelections(ctx);

      // Draw the new selection
      drawSelection(ctx, startX, startY, width, height);
      handleMouseUp(e);
    }

  // Reset selection state
  setSelectionStart(null);
  setSelectionEnd(null);
};

  

  const checkIfMouseIsInsideCanvas = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      handleMouseUp(e);
      return true
    }
    return false;
  }


  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !selectionEnd || !canvasRef.current) return;

    let sameXCoordinate = selectionStart.x === selectionEnd.x;
    let sameYCoordinate = selectionStart.y === selectionEnd.y;
    console.log("Same X Coordinate: " + sameXCoordinate);
    console.log("Same Y Coordinate: " + sameYCoordinate)
    console.log("Selection Start: " + JSON.stringify(selectionStart), "\nSelection End: " + JSON.stringify(selectionEnd))

    if (sameXCoordinate && sameYCoordinate) {

      // Check if a picture-wide selection can be created
      if (!isEnteringFeedback && allowPictureSelection) {
        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        const { width, height } = canvasElement.getBoundingClientRect();
        if (!canCreatePictureSelection(width, height)) {
          return;
        }
        createPictureSelection(width, height);
        setIsEnteringFeedback(true);
        setAllowPictureSelection(false);
      } else {
        openPictureSelectionFeedback(e);
        return;
      }
      
    } else {
      createNewSelection(selectionStart, selectionEnd);
      setIsEnteringFeedback(true);
    }

    const x = Math.max(selectionStart.x, selectionEnd.x);
    const y = Math.max(selectionStart.y, selectionEnd.y);

    setTooltipPosition({ 
      x: x - 100, 
      y: y - 100 
    });
    setActiveSelectionIndex(selections.length);

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const openPictureSelectionFeedback = (e: React.MouseEvent) => {
    console.log("Opening picture-wide selection feedback");
    setIsEnteringFeedback(true);
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const { width, height } = canvasElement.getBoundingClientRect();
    const pictureSelection = selections.find(selection => {
      return (
        selection.start.x === 0 && 
        selection.start.y === 0 && 
        selection.end.x === width &&
        selection.end.y === height
      );
    });
    console.log("Picture-wide selection found: " + JSON.stringify(pictureSelection));

    if (pictureSelection) {
      const pictureSelectionIndex = selections.indexOf(pictureSelection);
      const mouseCoordinates = getMouseCoordinates(e);

      console.log("Opening tooltip at: \n" + JSON.stringify(mouseCoordinates));
      
      setActiveSelectionIndex(pictureSelectionIndex);
      setTooltipPosition(mouseCoordinates);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }

  const getMouseCoordinates = (e?: React.MouseEvent) => {

    const defaultCoordinates = { x: 0, y: 0 };
    const canvas = canvasRef.current;
    if (!e || !canvas) {
      return defaultCoordinates
    }
    const x = e.clientX;
    const y = e.clientY;
    return { x, y };
  }


  const canCreatePictureSelection = (width: number, height: number) => {
    // Only creates a selection if selections array does not contain a picture-wide selection
    let pictureWideSelection = selections.filter(selection => {
      return (
        selection.start.x === 0 && 
        selection.start.y === 0 && 
        selection.end.x === width && 
        selection.end.y === height
      );
    });
    if (pictureWideSelection.length !== 0) return false;
    return true;
  }

  const createNewSelection = (
    selectionStart: SelectionCoordinates, 
    selectionEnd: SelectionCoordinates
  ) => {
    const newSelection: Selection = {
      start: selectionStart,
      end: selectionEnd,
    };
    setSelections((prev) => [...prev, newSelection]);  
  }

  const createPictureSelection = (pictureWidth: number, pictureHeight: number) => {
    const newSelection: Selection = {
      start: { x: 0, y: 0 },
      end: { x: pictureWidth, y: pictureHeight },
    }; 
    console.log("Creating picture-wide selection: \n" + JSON.stringify(newSelection));
    setSelections((prev) => [...prev, newSelection]);
  }


  const handleEdit = (index: number) => {
    setActiveSelectionIndex(index);
    setIsEnteringFeedback(true);
    const selection = selections[index];
    const x = Math.min(selection.start.x, selection.end.x);
    const y = Math.min(selection.start.y, selection.end.y);
    setTooltipPosition({ x, y });
  };

  const handleDelete = (index: number) => {

    // Check if the selection to be deleted is a picture-wide selection
    checkForPictureSelection(index);
    
    setSelections((prev) => prev.filter((_, i) => i !== index));
    setTooltipPosition(null);
    setActiveSelectionIndex(null);
    setIsEnteringFeedback(false);
  };

  const checkForPictureSelection = (index?: number) => {
    if (!allowPictureSelection) {
      const selection = selections[index ?? activeSelectionIndex ?? 0];
      const canvas = canvasRef.current;
      if (canvas) {
        const { width, height } = canvas.getBoundingClientRect();
        if (
          selection.start.x === 0 && 
          selection.start.y === 0 && 
          selection.end.x === width && 
          selection.end.y === height
        ) {
          console.log("allowing picture selection");
          setAllowPictureSelection(true);
        }
      }
    } 
  }

  // const [mouseCoordinates, setMouseCoordinates] = useState<[number, number] | null>(null);
    
  // // Continuously updates mouse coordinates
  // useEffect(() => {
  //   const handleMouseMove = (e: MouseEvent) => {
  //     setMouseCoordinates([e.clientX, e.clientY]);
  //   };
  //   window.addEventListener("mousemove", handleMouseMove);
  //   return () => window.removeEventListener("mousemove", handleMouseMove);
  // }, []);

  return (
    <>
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
          style={{
            cursor: isEnteringFeedback ? "default" : "crosshair",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
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
            index={activeSelectionIndex}
            x={tooltipPosition.x}
            y={tooltipPosition.y}
            selection={selections[activeSelectionIndex]}
            setSelections={setSelections}
            setActiveSelectionIndex={setActiveSelectionIndex}
            setTooltipPosition={setTooltipPosition}
            setIsEnteringFeedback={setIsEnteringFeedback}
            onDelete={() => handleDelete(activeSelectionIndex)}
          />
        )}
      </div>
      {/* <div>
        <span>Coordinates: {mouseCoordinates && JSON.stringify(mouseCoordinates)}</span>
        <br />
        <span>Selections: {JSON.stringify(selections)}</span>
        <br />
        <span>Active Selection Index: {activeSelectionIndex}</span>
        <br />
        <span>isEnteringFeedback: {JSON.stringify(isEnteringFeedback)}</span>
        <br />
        <span>allowPictureSelection: {JSON.stringify(allowPictureSelection)}</span>
        <br />
        <span>Tooltip Position: {JSON.stringify(tooltipPosition)}</span>
      </div> */}
    </>
  );
};

export default Canvas;