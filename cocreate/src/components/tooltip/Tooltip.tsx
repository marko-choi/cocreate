import { Delete, Save, ThumbDown, ThumbUp } from "@mui/icons-material";
import { Button, Divider, IconButton } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Selection, SelectionCoordinates } from "../canvas/Canvas";

interface TooltipProps {
  index: number;
  x: number;
  y: number;
  selection: {
    functionValue?: string;
    aestheticValue?: string;
    comment?: string;
  };
  setSelections: React.Dispatch<React.SetStateAction<Selection[]>>;
  setTooltipPosition: React.Dispatch<React.SetStateAction<SelectionCoordinates | null>>;
  setActiveSelectionIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setIsEnteringFeedback: React.Dispatch<React.SetStateAction<boolean>>;
  onDelete: () => void;
  annotation?: boolean;  // New prop for read-only state
}

const Tooltip: React.FC<TooltipProps> = (props) => {
  const { index, x, y, selection, setSelections, setTooltipPosition,setIsEnteringFeedback, setActiveSelectionIndex, onDelete, annotation } = props;
  const [functionValue, setFunctionValue] = useState(selection.functionValue || "");
  const [aestheticValue, setAestheticValue] = useState(selection.aestheticValue || "");
  const [comment, setComment] = useState(selection.comment || "");
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);

  const handleFunctionValue = (value: string) => {
    if (!annotation) { // Allow changes only if not in read-only mode
      if (functionValue === value) {
        setFunctionValue("");
      } else {
        setFunctionValue(value);
      }
    }
  }

  const handleAestheticValue = (value: string) => {
    if (!annotation) { // Allow changes only if not in read-only mode
      if (aestheticValue === value) {
        setAestheticValue("");
      } else {
        setAestheticValue(value);
      }
    }
  }

  const handleComment = (value: string) => {
    setComment(value);
  }

  const saveChanges = () => {
    setSelections((prev) => {
      const newSelections = [...prev];
      newSelections[index] = {
        ...newSelections[index],
        functionValue: functionValue ?? "",
        aestheticValue: aestheticValue ?? "",
        comment: comment ?? "",
      };
      return newSelections;
    });
  }

  const handleSave = () => {
      saveChanges();
      setTooltipPosition(null);
      setActiveSelectionIndex(null);
      setIsEnteringFeedback(false);
  };

  useEffect(() => {
    setIsSaveEnabled(!!functionValue || !!aestheticValue);
  }, [functionValue, aestheticValue]);

  useEffect(() => {
    if (functionValue || aestheticValue || comment) {
      saveChanges();
    }
  }, [functionValue, aestheticValue, comment]);


  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        backgroundColor: "rgba(240, 240, 240, 0.9)",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        width: "250px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "12px" }}>
        <strong style={{ display: "block", marginBottom: "4px" }}>Provide Feedback</strong>
        <span style={{ color: "#888" }}>Rate your experience</span>
      </div>

      <Divider style={{ marginBottom: "8px" }} />

      {/* Content */}
      <div style={{ marginBottom: "8px" }}>
        {/* Functionality */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Functionality</div>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <IconButton
              onClick={() => handleFunctionValue("good")}
              disabled={annotation} // Disable if in read-only mode
              style={{
                background: functionValue === "good" ? "#4CAF50" : "#d5d5d5",
                color: "white",
                border: "none",
                borderRadius: "100%",
                width: "32px",
                height: "32px",
                cursor: annotation ? "not-allowed" : "pointer",
              }}
            >
              <ThumbUp fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => handleFunctionValue("bad")}
              disabled={annotation} // Disable if in read-only mode
              style={{
                background: functionValue === "bad" ? "#F44336" : "#d5d5d5",
                color: "white",
                border: "none",
                borderRadius: "100%",
                width: "32px",
                height: "32px",
                cursor: annotation ? "not-allowed" : "pointer",
              }}
            >
              <ThumbDown fontSize="small" />
            </IconButton>
          </div>
        </div>

        {/* Aesthetics */}
        <div style={{ marginBottom: "8px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Aesthetics</div>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <IconButton
              onClick={() => handleAestheticValue("good")}
              disabled={annotation} // Disable if in read-only mode
              style={{
                background: aestheticValue === "good" ? "#4CAF50" : "#d5d5d5",
                color: "white",
                border: "none",
                borderRadius: "100%",
                width: "32px",
                height: "32px",
                cursor: annotation ? "not-allowed" : "pointer",
              }}
            >
              <ThumbUp fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => handleAestheticValue("bad")}
              disabled={annotation} // Disable if in read-only mode
              style={{
                background: aestheticValue === "bad" ? "#F44336" : "#d5d5d5",
                color: "white",
                border: "none",
                borderRadius: "100%",
                width: "32px",
                height: "32px",
                cursor: annotation ? "not-allowed" : "pointer",
              }}
            >
              <ThumbDown fontSize="small" />
            </IconButton>
          </div>
        </div>

        {/* Additional Comments */}
        <div>
          <div>Additional Comments</div>
          <textarea
            value={comment}
            onChange={(e) => handleComment(e.target.value)}
            rows={3}
            disabled={annotation} // Disable if in read-only mode
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              resize: "none",
              fontSize: "11px",
              cursor: annotation ? "not-allowed" : "text",
            }}
          />
        </div>
      </div>

      <Divider style={{ marginBottom: "12px" }} />

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          onClick={onDelete}
          disabled={annotation} // Disable if in read-only mode
          style={{
            background: "#F44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: annotation ? "not-allowed" : "pointer",
            textTransform: "none",
            fontFamily: "inherit",
            fontSize: "11px",
          }}
          startIcon={<Delete />}
        >
          Delete
        </Button>
        <Button
          onClick={handleSave}
          disabled={annotation || !isSaveEnabled}
          style={{
            background: isSaveEnabled && !annotation ? "#4CAF50" : "rgb(76, 175, 80, 0.5)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 10px",
            cursor: annotation || !isSaveEnabled ? "not-allowed" : "pointer",
            textTransform: "none",
            fontFamily: "inherit",
            fontSize: "11px",
          }}
          startIcon={<Save />}
        >
          Save Feedback
        </Button>
      </div>
    </div>
  );
};

export default Tooltip;
