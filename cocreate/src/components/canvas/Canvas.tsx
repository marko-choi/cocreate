import { Delete, Edit, Map, MapOutlined, PanTool, RestartAlt, ZoomIn, ZoomOut, Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Tooltip from "../tooltip/Tooltip";
import "./canvas.css";
import { Point } from "../../types/global";
import { InstanceId } from "../../App";
import { isMobileDevice } from "../../utils/mobileDetection";
import MobileFeedbackModal from "../MobileFeedbackModal/MobileFeedbackModal";
import { getFeedbackConfig } from "../../utils/feedbackConfig";

export interface SelectionCoordinates {
  x: number;
  y: number;
}

export interface Selection {
  start: SelectionCoordinates;
  unscaledStart: SelectionCoordinates;
  end: SelectionCoordinates;
  unscaledEnd: SelectionCoordinates;
  functionValue?: string;
  aestheticValue?: string;
  comment?: string;
}


export interface ResizeRatio {
  prevWidthRatio: number;
  prevHeightRatio: number;
  currWidthRatio: number;
  currHeightRatio: number;
}

const DEFAULT_IMAGE_SRC = "/cocreate/rendering.jpg";
const MAX_IMAGE_WIDTH = 800;
const MAX_BACKING_SCALE = 4;

const CANVAS_SELECTIONS_KEY = "cocreate-canvasSelections";
const CANVAS_SIZE_KEY = "cocreate-canvasSize";
const QUESTION_IDS_KEY = "cocreate-questionIds";
const IMAGE_MAP_KEY = "cocreate-imageMap";

export interface CanvasProps {
  instanceId: InstanceId;
}

const Canvas: React.FC<CanvasProps> = (props) => {
  const { instanceId } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<Point | null>(null);
  const [activeSelectionIndex, setActiveSelectionIndex] = useState<number | null>(null);
  const [isEnteringFeedback, setIsEnteringFeedback] = useState(false);
  const [allowPictureSelection, setAllowPictureSelection] = useState(true);
  const [tooltipAnchoredToSelection, setTooltipAnchoredToSelection] = useState<boolean>(false);
  const [tooltipIsViewportCoords, setTooltipIsViewportCoords] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== "undefined" ? !isMobileDevice() : false));
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);

  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE_SRC);
  const [canvasWidth, setCanvasWidth] = useState<number>(MAX_IMAGE_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState<number>(534);

  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageScaleFactor, setImageScaleFactor] = useState<number>(1);

  // Removed imageOffset in favor of transform mapping

  // Zoom & Pan state
  const [scale, setScale] = useState<number>(1);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panLastRef = useRef<{ x: number; y: number } | null>(null);

  // UI
  const [toolbarVisible, setToolbarVisible] = useState<boolean>(true);
  const [minimapVisible, setMinimapVisible] = useState<boolean>(true);
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  }));
  const backingScale = useMemo(() => {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return Math.min(dpr * scale, MAX_BACKING_SCALE);
  }, [scale, viewportSize]);
  const canvasPixelWidth = Math.max(1, Math.round(canvasWidth * backingScale));
  const canvasPixelHeight = Math.max(1, Math.round(canvasHeight * backingScale));
  const [hoveredToolbarButton, setHoveredToolbarButton] = useState<string | null>(null);
  const [toolbarButtonRects, setToolbarButtonRects] = useState<{ [key: string]: DOMRect }>({});
  const modalOpenedAtRef = useRef<number>(0);
  const isTwoFingerGestureRef = useRef<boolean>(false);
  const lastPinchDistanceRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const prepareCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const targetWidth = Math.max(1, Math.round(canvasWidth * backingScale));
    const targetHeight = Math.max(1, Math.round(canvasHeight * backingScale));

    if (canvas.width !== targetWidth) {
      canvas.width = targetWidth;
    }
    if (canvas.height !== targetHeight) {
      canvas.height = targetHeight;
    }

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(backingScale, 0, 0, backingScale, 0, 0);
    return ctx;
  }, [canvasWidth, canvasHeight, backingScale]);

  // Load any saved selections for this instance on mount (rectangular only; circular/mobile selections are ignored)
  useEffect(() => {
    try {
      const savedSelectionsRaw = localStorage.getItem(CANVAS_SELECTIONS_KEY);
      if (!savedSelectionsRaw) return;
      const parsed = JSON.parse(savedSelectionsRaw);
      if (parsed && parsed[instanceId]) {
        const raw = parsed[instanceId];
        const rectangularOnly = Array.isArray(raw)
          ? raw.filter((s: unknown) => s && typeof s === 'object' && !('radius' in s))
          : [];
        setSelections(rectangularOnly);
      }
    } catch (error) {
      console.error("[Cocreate] Failed to load saved selections", error);
    }
  }, [instanceId]);

  // Ensure Qualtrics images remain hidden (for non-first questions)
  useEffect(() => {
    const hideQuestionImages = () => {
      const instanceRootContainer = getInstanceRootContainer();
      if (!instanceRootContainer || !instanceRootContainer.parentElement) return;

      // Hide all possible Qualtrics image locations
      const imageSelectors = [
        '.question-content img',
        '.question-display-wrapper img',
        '.QuestionText img'
      ];

      imageSelectors.forEach(selector => {
        const images = instanceRootContainer.parentElement!.querySelectorAll(selector);
        images.forEach(img => {
          if (img instanceof HTMLImageElement && !img.classList.contains('rendering-image')) {
            img.style.display = 'none';
            img.style.visibility = 'hidden';
          }
        });
      });
    };

    // Run immediately and set up an interval to keep checking
    hideQuestionImages();
    const intervalId = setInterval(hideQuestionImages, 100);

    // Clean up after 3 seconds (should be enough time for DOM to stabilize)
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [instanceId]);

  // Mobile detection and UI adjustments
  useEffect(() => {
    const handleMobileCheck = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      if (mobile) {
        setToolbarVisible(false);
        setMinimapVisible(false);
        setIsPanMode(false);
      } else {
        setShowMobileModal(false);
        document.body.classList.remove('modal-open');
      }
    };

    handleMobileCheck();
    window.addEventListener("resize", handleMobileCheck);
    window.addEventListener("orientationchange", handleMobileCheck);
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener("resize", handleMobileCheck);
    }

    return () => {
      window.removeEventListener("resize", handleMobileCheck);
      window.removeEventListener("orientationchange", handleMobileCheck);
      if (viewport) {
        viewport.removeEventListener("resize", handleMobileCheck);
      }
    };
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    console.log('[CoCreate] Saving to localStorage - selections count:', selections.length);
    // Save canvas size to localStorage
    const currentCocreateCanvasSize = localStorage.getItem(CANVAS_SIZE_KEY);
    const newCocreateCanvasSize = {
      [instanceId]: {
        width: canvasWidth,
        height: canvasHeight,
        imageScaleFactor: imageScaleFactor
      }
    }

    const newCocreateCanvasSizeString = currentCocreateCanvasSize
      ? JSON.stringify({
          ...JSON.parse(currentCocreateCanvasSize),
          ...newCocreateCanvasSize
        })
      : JSON.stringify(newCocreateCanvasSize);

    localStorage.setItem(CANVAS_SIZE_KEY, newCocreateCanvasSizeString);

    // CRITICAL: Dispatch custom event to notify Qualtrics loader
    const sizeEvent = new CustomEvent('localStorageUpdated', {
      detail: {
        key: CANVAS_SIZE_KEY,
        value: JSON.parse(newCocreateCanvasSizeString)
      }
    });
    window.dispatchEvent(sizeEvent);
    console.log('[CoCreate] ✅ Dispatched localStorageUpdated for canvas size');

    // Save selections to localStorage
    const currentCocreateCanvasSelections = localStorage.getItem(CANVAS_SELECTIONS_KEY);
    const newCocreateCanvasSelections = {
      [instanceId]: selections
    }

    const newCocreateCanvasSelectionsString = currentCocreateCanvasSelections
      ? JSON.stringify({
          ...JSON.parse(currentCocreateCanvasSelections),
          ...newCocreateCanvasSelections
        })
      : JSON.stringify(newCocreateCanvasSelections);

    localStorage.setItem(CANVAS_SELECTIONS_KEY, newCocreateCanvasSelectionsString);

    // Track all question ids encountered so Qualtrics can aggregate
    try {
      const mergedSelections = JSON.parse(newCocreateCanvasSelectionsString) || {};
      const mergedSizes = JSON.parse(newCocreateCanvasSizeString) || {};
      const currentQuestionIdsRaw = localStorage.getItem(QUESTION_IDS_KEY);
      const currentQuestionIds = currentQuestionIdsRaw ? JSON.parse(currentQuestionIdsRaw) : [];
      const updatedQuestionIds = Array.from(new Set([
        ...currentQuestionIds,
        ...Object.keys(mergedSelections),
        ...Object.keys(mergedSizes),
        instanceId
      ].filter(Boolean)));

      // Only persist if we actually have ids; otherwise preserve existing
      const finalQuestionIds = updatedQuestionIds.length > 0 ? updatedQuestionIds : currentQuestionIds;
      localStorage.setItem(QUESTION_IDS_KEY, JSON.stringify(finalQuestionIds));
      console.log("[CoCreate] Updated questionIds:", finalQuestionIds);
    } catch (error) {
      console.warn("[CoCreate] Failed to update questionIds", error);
    }

    // Track image src per question id for downstream extraction
    try {
      if (imageSrc) {
        const currentImageMapRaw = localStorage.getItem(IMAGE_MAP_KEY);
        const currentImageMap = currentImageMapRaw ? JSON.parse(currentImageMapRaw) : {};
        const updatedImageMap = { ...currentImageMap, [instanceId]: imageSrc };
        localStorage.setItem(IMAGE_MAP_KEY, JSON.stringify(updatedImageMap));
      }
    } catch (error) {
      console.warn("[CoCreate] Failed to update image map", error);
    }

    // CRITICAL: Dispatch custom event to notify Qualtrics loader
    const selectionsEvent = new CustomEvent('localStorageUpdated', {
      detail: {
        key: CANVAS_SELECTIONS_KEY,
        value: JSON.parse(newCocreateCanvasSelectionsString)
      }
    });
    window.dispatchEvent(selectionsEvent);
    console.log('[CoCreate] ✅ Dispatched localStorageUpdated for selections');

  }, [selections, canvasWidth, canvasHeight, imageScaleFactor, instanceId]);

  const getAvailableSize = () => {
    const shell = shellRef.current;
    const shellParent = shell?.parentElement;
    const parent = containerRef.current?.parentElement;
    const baseWidth = shell?.clientWidth ?? shellParent?.clientWidth ?? parent?.clientWidth ?? window.innerWidth;
    const baseHeight = shell?.clientHeight ?? shellParent?.clientHeight ?? parent?.clientHeight ?? window.innerHeight;

    if (shell && typeof window !== "undefined") {
      const styles = window.getComputedStyle(shell);
      const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const paddingY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      return {
        maxWidth: Math.max(0, baseWidth - paddingX),
        maxHeight: Math.max(0, baseHeight - paddingY),
      };
    }

    return { maxWidth: baseWidth, maxHeight: baseHeight };
  };

  // Set canvas size based on image dimensions
  const initCanvasDimensions = (img: HTMLImageElement) => {
    const { maxWidth, maxHeight } = getAvailableSize();
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    if (!naturalWidth || !naturalHeight) return;

    const scaleFactor = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
    const width = naturalWidth * scaleFactor;
    const height = naturalHeight * scaleFactor;

    setCanvasWidth(width);
    setCanvasHeight(height);
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
    setImageScaleFactor(scaleFactor);
    // Reset zoom/pan when initializing a new image
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const resizeCanvasDimensions = useCallback((img: HTMLImageElement) => {
    const { maxWidth, maxHeight } = getAvailableSize();
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    if (!naturalWidth || !naturalHeight) return;

    const scaleFactor = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
    const width = naturalWidth * scaleFactor;
    const height = naturalHeight * scaleFactor;

    setCanvasWidth(width);
    setCanvasHeight(height);
    setImageScaleFactor(scaleFactor);
  }, []);

  const updateImageDimensions = () => {
    const instanceRootContainer = getInstanceRootContainer();
    if (!instanceRootContainer) {
      console.log("[Cocreate] No root container found for instanceId: " + instanceId);
      return;
    }

    const waitForImage = () => {
      const loadedImage = instanceRootContainer.querySelector(".rendering-image");

      if (!loadedImage) {
        requestAnimationFrame(waitForImage);
        return;
      }

      if (loadedImage instanceof HTMLImageElement) {
        if (loadedImage.complete && loadedImage.naturalHeight !== 0) {
          console.log("[Cocreate] Image already loaded");
          resizeCanvasDimensions(loadedImage);
        } else {
          loadedImage.addEventListener("load", function() {
            console.log("[Cocreate] Image loaded");
            console.log(this);
            resizeCanvasDimensions(this);
          });
        }
      }
    };

    requestAnimationFrame(waitForImage);
  }

  const getInstanceRootContainer = (): HTMLElement | null => {
    const rootContainers = document.querySelectorAll<HTMLElement>(".cocreate-root");
    return (
      Array.from(rootContainers).find(
        (container) => container.getAttribute("data-question-id") === instanceId
      ) || null
    );
  };

  const syncRootToShellSize = useCallback(() => {
    const root = getInstanceRootContainer();
    const shell = shellRef.current;
    if (!root || !shell) return;
    const rect = shell.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);

    // Override any fixed height/width on the root so it always covers the shell.
    root.style.height = "auto";
    root.style.minHeight = `${height}px`;
    root.style.width = "100%";
    root.style.minWidth = `${width}px`;
    root.style.boxSizing = "border-box";
  }, [instanceId]);

  // imageOffset logic removed; we compute positions via stage transforms

  const initializeCanvas = () => {
    console.log("[Cocreate] Initializing canvas dimensions");
    const instanceRootContainer = getInstanceRootContainer();
    if (!instanceRootContainer) {
      console.log("[Cocreate] No root container found for instanceId: " + instanceId);
      return;
    }

    const questionBodyImage = instanceRootContainer.parentElement?.querySelector(`.question-display-wrapper img`) ||
                              instanceRootContainer.parentElement?.querySelector(`.QuestionText img`) ||
                              instanceRootContainer.parentElement?.querySelector(`.question-content img`);
    console.log("[Cocreate] Question Body Image: " + questionBodyImage);

    if (questionBodyImage && questionBodyImage instanceof HTMLImageElement) {

      console.log("[Cocreate] Scraping image from question body");
      console.log("[Cocreate] Question Body Image: " + questionBodyImage);
      console.log("[Cocreate] Question Body Image Src: " + questionBodyImage.getAttribute("src"));

      // CRITICAL FIX: Explicitly hide the original Qualtrics image to prevent duplicates
      questionBodyImage.style.display = 'none';
      questionBodyImage.style.visibility = 'hidden';

      setImageSrc(questionBodyImage.getAttribute("src") ?? DEFAULT_IMAGE_SRC);

      // Use a more reliable method to wait for the rendering image to be added to the DOM
      const waitForRenderingImage = () => {
        const loadedImage = instanceRootContainer.querySelector(".rendering-image");

        if (!loadedImage) {
          console.log("[Cocreate] Waiting for rendering image to be added to DOM");
          requestAnimationFrame(waitForRenderingImage);
          return;
        }

        // Wait for the image to load before calling initCanvasDimensions
        if (loadedImage instanceof HTMLImageElement) {
          if (loadedImage.complete && loadedImage.naturalHeight !== 0) {
            console.log("[Cocreate] Image already loaded");
            initCanvasDimensions(loadedImage);
          } else {
            // Add an event listener to handle when the image finishes loading
            loadedImage.addEventListener("load", function() {
              console.log("[Cocreate] Image loaded");
              initCanvasDimensions(this);
            });
          }
        }
      };

      // Start polling for the rendering image
      requestAnimationFrame(waitForRenderingImage);

    } else {
      const defaultImage = document.querySelector("img");
      if (defaultImage && defaultImage instanceof HTMLImageElement) {
        setImageSrc(defaultImage.getAttribute("src") ?? DEFAULT_IMAGE_SRC);
        defaultImage.onload = () => {
          initCanvasDimensions(defaultImage)
        };
      }
    }
  }

  useEffect(() => {
    const ctx = prepareCanvasContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    redrawSelections(ctx);
  }, [selections, activeSelectionIndex, canvasWidth, canvasHeight, imageScaleFactor, backingScale, prepareCanvasContext]);

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
    ctx.arcTo(x + width, y, x + width, y + height, radius);   // Top-right corner
    ctx.arcTo(x + width, y + height, x, y + height, radius);  // Bottom-right corner
    ctx.arcTo(x, y + height, x, y, radius);                   // Bottom-left corner
    ctx.arcTo(x, y, x + width, y, radius);                    // Top-left corner
    ctx.closePath();

    ctx.fill();   // Fill the rounded rectangle
    ctx.stroke(); // Stroke the rounded rectangle
  };

  /**
   * Redraws the selections on the canvas
   * @param ctx - The canvas context
   * @param resizedSelections - Optional array of selections to draw. If not provided, the current selections will be used.
   */
  const redrawSelections = (ctx: CanvasRenderingContext2D, resizedSelections?: Selection[]) => {
    const selectionsToDraw = resizedSelections ?? selections;
    selectionsToDraw.forEach((selection, index) => {
      const isActive = index === activeSelectionIndex;
      const { unscaledStart, unscaledEnd } = selection;
      const startX = unscaledStart.x * imageScaleFactor;
      const startY = unscaledStart.y * imageScaleFactor;
      const endX = unscaledEnd.x * imageScaleFactor;
      const endY = unscaledEnd.y * imageScaleFactor;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      if (isActive) {
        drawSelection(ctx, x, y, width, height, "rgba(25, 118, 210, 0.18)", "#1976d2", 3);
      } else {
        drawSelection(ctx, x, y, width, height);
      }
    });
  };

  // Coordinate transforms between stage (base) <-> screen
  const toStagePointFromEvent = (e: React.MouseEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const toStagePointFromTouch = (touch: Touch | React.Touch, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) / scale,
      y: (touch.clientY - rect.top) / scale,
    };
  };

  const stageToScreenPoint = (p: { x: number; y: number }) => {
    return { x: translate.x + scale * p.x, y: translate.y + scale * p.y };
  };

  const selectionBoundsInStage = (sel: Selection) => {
    const startX = sel.unscaledStart.x * imageScaleFactor;
    const startY = sel.unscaledStart.y * imageScaleFactor;
    const endX = sel.unscaledEnd.x * imageScaleFactor;
    const endY = sel.unscaledEnd.y * imageScaleFactor;
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    return { x, y, width, height };
  };

  // Returns true if a picture-wide selection (full canvas) exists
  // const hasPictureWideSelection = (): boolean => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return false;
  //   const width = canvas.width;
  //   const height = canvas.height;
  //   return selections.some((s) =>
  //     s.start.x === 0 && s.start.y === 0 && s.end.x === width && s.end.y === height
  //   );
  // };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pan mode drag start
    if (isPanMode) {
      setIsPanning(true);
      panLastRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

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
    const stagePoint = toStagePointFromEvent(e, canvas);
    setSelectionStart({ x: stagePoint.x, y: stagePoint.y });
    setSelectionEnd({ x: stagePoint.x, y: stagePoint.y });
    setIsSelecting(true);
  }

  const findSelectionAtPoint = (p: { x: number; y: number }) => {
    const hitPadding = 8 / Math.max(scale, 1);
    return selections.findIndex((sel) => {
      const { x, y, width, height } = selectionBoundsInStage(sel);
      return (
        p.x >= x - hitPadding &&
        p.x <= x + width + hitPadding &&
        p.y >= y - hitPadding &&
        p.y <= y + height + hitPadding
      );
    });
  };

  const clampPointToCanvas = (p: { x: number; y: number }) => {
    return {
      x: Math.max(0, Math.min(p.x, canvasWidth)),
      y: Math.max(0, Math.min(p.y, canvasHeight)),
    };
  };

  // Mobile-specific touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (showMobileModal) {
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
      return;
    }
    if (!isMobile || isEnteringFeedback) return;
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const distance = Math.hypot(dx, dy);

      isTwoFingerGestureRef.current = true;
      lastPinchDistanceRef.current = distance;
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    const stagePoint = toStagePointFromTouch(touch, canvas);
    const tappedIndex = findSelectionAtPoint(stagePoint);

    if (tappedIndex >= 0) {
      setActiveSelectionIndex(tappedIndex);
      setShowMobileModal(true);
      setIsEnteringFeedback(true);
      modalOpenedAtRef.current = Date.now();
      document.body.classList.add('modal-open');
      return;
    }

    setSelectionStart({ x: stagePoint.x, y: stagePoint.y });
    setSelectionEnd({ x: stagePoint.x, y: stagePoint.y });
    setIsSelecting(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showMobileModal) {
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
      return;
    }
    if (!isMobile) return;
    if (e.touches.length === 2 && isTwoFingerGestureRef.current) {
      e.preventDefault();
      e.stopPropagation();

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const distance = Math.hypot(dx, dy);

      if (!lastPinchDistanceRef.current) {
        lastPinchDistanceRef.current = distance;
        return;
      }

      const scaleDelta = distance / lastPinchDistanceRef.current;
      const nextScale = Math.min(5, Math.max(0.5, scale * scaleDelta));

      // Zoom around the current midpoint
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      const stageCenterX = (center.x - translate.x) / scale;
      const stageCenterY = (center.y - translate.y) / scale;
      const nextTranslate = {
        x: center.x - nextScale * stageCenterX,
        y: center.y - nextScale * stageCenterY,
      };

      setTranslate(constrainTranslate(nextTranslate, nextScale));
      setScale(nextScale);

      lastPinchDistanceRef.current = distance;
      return;
    }
    if (!isSelecting || !selectionStart || isEnteringFeedback) return;

    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvasContext();
    if (!ctx) return;
    const touch = e.touches[0];
    if (!touch) return;

    const currentEnd = toStagePointFromTouch(touch, canvas);
    setSelectionEnd(currentEnd);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    redrawSelections(ctx);

    const x = Math.min(selectionStart.x, currentEnd.x);
    const y = Math.min(selectionStart.y, currentEnd.y);
    const width = Math.abs(currentEnd.x - selectionStart.x);
    const height = Math.abs(currentEnd.y - selectionStart.y);
    drawSelection(ctx, x, y, width, height);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showMobileModal) {
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
      return;
    }
    if (!isMobile) return;
    if (isTwoFingerGestureRef.current) {
      if (e.touches.length < 2) {
        isTwoFingerGestureRef.current = false;
        lastPinchDistanceRef.current = null;
      }
      return;
    }
    if (!isSelecting || !selectionStart || !selectionEnd || !canvasRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    const dx = selectionEnd.x - selectionStart.x;
    const dy = selectionEnd.y - selectionStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const tapThreshold = 3 / Math.max(scale, 0.1);
    const defaultTapSize = 36 / Math.max(scale, 0.1);

    let start = selectionStart;
    let end = selectionEnd;

    if (distance < tapThreshold) {
      const half = defaultTapSize / 2;
      start = { x: selectionStart.x - half, y: selectionStart.y - half };
      end = { x: selectionStart.x + half, y: selectionStart.y + half };
    }

    start = clampPointToCanvas(start);
    end = clampPointToCanvas(end);

    const newIndex = selections.length;
    createNewSelection(start, end);
    setActiveSelectionIndex(newIndex);
    setShowMobileModal(true);
    setIsEnteringFeedback(true);
    modalOpenedAtRef.current = Date.now();
    document.body.classList.add('modal-open');

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const removeEmptyFeedback = () => {
    if (activeSelectionIndex !== null) {
      const selection = selections[activeSelectionIndex];
      if (!selection.functionValue && !selection.aestheticValue && !selection.comment) {
        checkForPictureSelection();
        setSelections((prev) => prev.filter((_, i) => i !== activeSelectionIndex));
        setTooltipPosition(null);
        setActiveSelectionIndex(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanMode && isPanning && panLastRef.current) {
      const dx = e.clientX - panLastRef.current.x;
      const dy = e.clientY - panLastRef.current.y;
      setTranslate((prev) => constrainTranslate({ x: prev.x + dx, y: prev.y + dy }, scale));
      panLastRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isSelecting || !selectionStart || isEnteringFeedback) return;

    const ctx = prepareCanvasContext();
    if (!ctx) return;

    const stagePoint = toStagePointFromEvent(e, canvas);
    const currentEnd = { x: stagePoint.x, y: stagePoint.y };

    // Update the selection
    setSelectionEnd(currentEnd);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
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
    if (isMobile) return;
    if (isPanMode && isPanning) {
      setIsPanning(false);
      panLastRef.current = null;
      return;
    }
    if (!isSelecting || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = prepareCanvasContext();
    if (!ctx) return;

    // Determine the mouse position relative to the canvas (stage coordinates)
    const stagePoint = toStagePointFromEvent(e, canvas);
    const mouseX = stagePoint.x;
    const mouseY = stagePoint.y;

    // Clamp the mouse position to the canvas boundaries
    const clampedX = Math.max(0, Math.min(mouseX, canvasWidth));
    const clampedY = Math.max(0, Math.min(mouseY, canvasHeight));

    // Set the selection end point to the clamped position
    setSelectionEnd({ x: clampedX, y: clampedY });

    // Draw the selection rectangle
    if (selectionStart) {
      const startX = selectionStart.x;
      const startY = selectionStart.y;
      const width = clampedX - startX;
      const height = clampedY - startY;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
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
    if (isMobile) return;
    if (isPanMode && isPanning) {
      setIsPanning(false);
      panLastRef.current = null;
      return;
    }
    if (!isSelecting || !selectionStart || !selectionEnd || !canvasRef.current) return;

    let sameXCoordinate = selectionStart.x === selectionEnd.x;
    let sameYCoordinate = selectionStart.y === selectionEnd.y;
    // console.log("Same X Coordinate: " + sameXCoordinate);
    // console.log("Same Y Coordinate: " + sameYCoordinate)
    // console.log("Selection Start: " + JSON.stringify(selectionStart), "\nSelection End: " + JSON.stringify(selectionEnd))

    if (sameXCoordinate && sameYCoordinate) {

      // Check if a picture-wide selection can be created
      if (!isEnteringFeedback && allowPictureSelection) {
        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        const width = canvasWidth;
        const height = canvasHeight;
        if (!canCreatePictureSelection(width, height)) {
          // If picture-wide already exists, open its feedback at cursor instead
          openPictureSelectionFeedback(e);
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
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

    // Place tooltip initially below selection (bottom-left)
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.max(selectionStart.y, selectionEnd.y) + 8;
    setTooltipPosition({ x, y });
    setActiveSelectionIndex(selections.length);
    setTooltipAnchoredToSelection(true);
    setTooltipIsViewportCoords(false);

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const openPictureSelectionFeedback = (e: React.MouseEvent) => {
    console.log("Opening picture-wide selection feedback");
    setIsEnteringFeedback(true);
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const width = canvasWidth;
    const height = canvasHeight;
    const pictureSelection = selections.find(selection =>
      selection.start.x === 0 &&
      selection.start.y === 0 &&
      selection.end.x === width &&
      selection.end.y === height
    );
    // console.log("Picture-wide selection found: " + JSON.stringify(pictureSelection));

    if (pictureSelection) {
      const pictureSelectionIndex = selections.indexOf(pictureSelection);
      // Place tooltip exactly at viewport mouse coords
      const mouseCoordinates = { x: e.clientX, y: e.clientY };
      setActiveSelectionIndex(pictureSelectionIndex);
      setTooltipPosition(mouseCoordinates);
      setTooltipIsViewportCoords(true);
      setTooltipAnchoredToSelection(false);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    // If it doesn't exist (e.g., was deleted earlier), create and open immediately
    createPictureSelection(width, height);
    const newIndex = selections.length; // will be the last after setSelections
    // Place tooltip exactly at viewport mouse coords
    const mouseCoordinates = { x: e.clientX, y: e.clientY };
    setActiveSelectionIndex(newIndex);
    setTooltipPosition(mouseCoordinates);
    setTooltipIsViewportCoords(true);
    setTooltipAnchoredToSelection(false);
  }

  // const getMouseCoordinates = (e?: React.MouseEvent) => {
  //   const defaultCoordinates = { x: 0, y: 0 };
  //   const canvas = canvasRef.current;
  //   if (!e || !canvas) {
  //     return defaultCoordinates
  //   }
  //   // Return stage coordinates for internal storage
  //   const stagePoint = toStagePointFromEvent(e, canvas);
  //   return { x: stagePoint.x, y: stagePoint.y };
  // }


  const canCreatePictureSelection = (width: number, height: number) => {
    const pictureWideSelection = selections.filter(selection =>
      selection.start.x === 0 &&
      selection.start.y === 0 &&
      selection.end.x === width &&
      selection.end.y === height
    );
    if (pictureWideSelection.length !== 0) return false;
    return true;
  }

  const findPictureSelectionIndex = (width: number, height: number) => {
    const pictureSelection = selections.find(selection =>
      selection.start.x === 0 &&
      selection.start.y === 0 &&
      selection.end.x === width &&
      selection.end.y === height
    );
    return pictureSelection ? selections.indexOf(pictureSelection) : -1;
  };

  const createNewSelection = (
    selectionStart: SelectionCoordinates,
    selectionEnd: SelectionCoordinates
  ) => {
    const newSelection: Selection = {
      start: selectionStart,
      unscaledStart: {
        x: selectionStart.x / imageScaleFactor,
        y: selectionStart.y / imageScaleFactor,
      },
      end: selectionEnd,
      unscaledEnd: {
        x: selectionEnd.x / imageScaleFactor,
        y: selectionEnd.y / imageScaleFactor,
      },
    };
    setSelections((prev) => {
      const next = [...prev, newSelection];
      setActiveSelectionIndex(next.length - 1);
      return next;
    });
  }

  const createPictureSelection = (pictureWidth: number, pictureHeight: number) => {
    if (!imageDimensions) return;
    const newSelection: Selection = {
      start: { x: 0, y: 0 },
      end: { x: pictureWidth, y: pictureHeight },
      unscaledStart: { x: 0, y: 0 },
      unscaledEnd: { x: imageDimensions?.width, y: imageDimensions?.height },
    };
    // console.log("Creating picture-wide selection: \n" + JSON.stringify(newSelection));
    setSelections((prev) => {
      const next = [...prev, newSelection];
      setActiveSelectionIndex(next.length - 1);
      return next;
    });
  }

  const openPictureSelectionMobile = () => {
    if (!canvasRef.current) return;
    const width = canvasWidth;
    const height = canvasHeight;

    const existingIndex = findPictureSelectionIndex(width, height);
    if (existingIndex >= 0) {
      setActiveSelectionIndex(existingIndex);
      setShowMobileModal(true);
      setIsEnteringFeedback(true);
      modalOpenedAtRef.current = Date.now();
      document.body.classList.add('modal-open');
      return;
    }

    if (!canCreatePictureSelection(width, height)) return;
    createPictureSelection(width, height);
    const newIndex = selections.length;
    setActiveSelectionIndex(newIndex);
    setShowMobileModal(true);
    setIsEnteringFeedback(true);
    setAllowPictureSelection(false);
    modalOpenedAtRef.current = Date.now();
    document.body.classList.add('modal-open');
  };


  const handleEdit = (index: number) => {
    setActiveSelectionIndex(index);
    setIsEnteringFeedback(true);
    const selection = selections[index];
    // Anchor tooltip below selection (bottom-left)
    const { x, y, width, height } = selectionBoundsInStage(selection);
    console.debug("Tooltip Position: ", { x, y: y + height + 8 }, x, y, width, height);
    setTooltipPosition({ x, y: y + height + 8 });
    setTooltipAnchoredToSelection(true);
    setTooltipIsViewportCoords(false);
  };

  const handleDelete = (index: number) => {

    // Check if the selection to be deleted is a picture-wide selection
    checkForPictureSelection(index);

    setSelections((prev) => prev.filter((_, i) => i !== index));
    setTooltipPosition(null);
    setActiveSelectionIndex(null);
    setIsEnteringFeedback(false);
  };

  const handleMobileSave = (feedback: { functionValue: string; aestheticValue: string; comment: string }) => {
    if (activeSelectionIndex === null) return;
    const feedbackConfig = getFeedbackConfig();

    setSelections((prev) => {
      const next = [...prev];
      next[activeSelectionIndex] = {
        ...next[activeSelectionIndex],
        functionValue: feedbackConfig.showFunctionValue ? feedback.functionValue : "",
        aestheticValue: feedbackConfig.showAestheticValue ? feedback.aestheticValue : "",
        comment: feedbackConfig.showComment ? feedback.comment : "",
      };
      return next;
    });

    setShowMobileModal(false);
    setActiveSelectionIndex(null);
    setIsEnteringFeedback(false);
    setTooltipPosition(null);
    document.body.classList.remove('modal-open');
  };

  const handleMobileDelete = () => {
    if (activeSelectionIndex === null) return;
    checkForPictureSelection(activeSelectionIndex);
    setSelections((prev) => prev.filter((_, i) => i !== activeSelectionIndex));
    setShowMobileModal(false);
    setActiveSelectionIndex(null);
    setIsEnteringFeedback(false);
    setTooltipPosition(null);
    document.body.classList.remove('modal-open');
  };

  const handleMobileClose = () => {
    if (Date.now() - modalOpenedAtRef.current < 250) {
      return;
    }
    if (activeSelectionIndex !== null) {
      const selection = selections[activeSelectionIndex];
      if (selection && !selection.functionValue && !selection.aestheticValue && !selection.comment) {
        setSelections((prev) => prev.filter((_, i) => i !== activeSelectionIndex));
      }
    }
    setShowMobileModal(false);
    setActiveSelectionIndex(null);
    setIsEnteringFeedback(false);
    setTooltipPosition(null);
    document.body.classList.remove('modal-open');
  };

  const checkForPictureSelection = (index?: number) => {

    if (allowPictureSelection) return

    const selection = selections[index ?? activeSelectionIndex ?? 0];
    const canvas = canvasRef.current;
    if (!canvas || !selection) return;

    const { width, height } = canvas.getBoundingClientRect();
    if (
      selection.start.x === 0 &&
      selection.start.y === 0 &&
      selection.end.x === width &&
      selection.end.y === height
    ) {
      // console.log("allowing picture selection");
      setAllowPictureSelection(true);
    }
  }

  // const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  // const [imageScaleFactor, setImageScaleFactor] = useState<number>(1);
  // const [selections, setSelections] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } }[]>([]);

  // const updateScaleFactor = (newWidth: number) => {
  //   if (imageDimensions) {
  //     const newScaleFactor = newWidth / imageDimensions.width;
  //     setImageScaleFactor(newScaleFactor);
  //   }
  // };


  // Initialize Canvas
  useEffect(() => {
    initializeCanvas();
  }, []);


  // Resize Handler
  useEffect(() => {
    const handleResize = () => {
      updateImageDimensions();
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener("resize", handleResize);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (viewport) {
        viewport.removeEventListener("resize", handleResize);
      }
    };
  }, [imageDimensions]);


  useEffect(() => {
    if (imageDimensions) {
      setSelections(prevSelections =>
        prevSelections.map(selection => ({
          ...selection,
          start: selection.start,
          end: selection.end,
        }))
      );
    }
  }, [imageScaleFactor, imageDimensions]);

  // Keep the Cocreate root sized to the rendered shell to avoid cropping.
  useEffect(() => {
    syncRootToShellSize();
  }, [canvasWidth, canvasHeight, viewportSize, toolbarVisible, minimapVisible, syncRootToShellSize]);

  // Boundary constraint helper (keeps content within container and centers when smaller)
  const constrainTranslate = (newTranslate: { x: number; y: number }, newScale: number) => {
    if (!containerRef.current) return newTranslate;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaledWidth = canvasWidth * newScale;
    const scaledHeight = canvasHeight * newScale;

    let x = newTranslate.x;
    let y = newTranslate.y;

    if (scaledWidth <= containerWidth) {
      x = (containerWidth - scaledWidth) / 2;
    } else {
      const minX = containerWidth - scaledWidth;
      const maxX = 0;
      x = Math.max(minX, Math.min(maxX, x));
    }

    if (scaledHeight <= containerHeight) {
      y = (containerHeight - scaledHeight) / 2;
    } else {
      const minY = containerHeight - scaledHeight;
      const maxY = 0;
      y = Math.max(minY, Math.min(maxY, y));
    }

    return { x, y };
  };

  // Wheel zoom handler (native event to allow passive:false)
  const handleWheelNative = (e: WheelEvent) => {
    if (!stageRef.current || !containerRef.current) return;
    e.preventDefault();
    const delta = -e.deltaY; // up to zoom in
    const zoomIntensity = 0.0015;
    const newScale = Math.min(5, Math.max(0.5, scale * (1 + delta * zoomIntensity)));
    if (newScale === scale) return;

    // Compute zoom around cursor point
    const rect = stageRef.current.getBoundingClientRect();
    const cursorStageX = (e.clientX - rect.left) / scale;
    const cursorStageY = (e.clientY - rect.top) / scale;

    setTranslate((prev) => {
      const screenX = prev.x + scale * cursorStageX;
      const screenY = prev.y + scale * cursorStageY;
      const nextX = screenX - newScale * cursorStageX;
      const nextY = screenY - newScale * cursorStageY;
      return constrainTranslate({ x: nextX, y: nextY }, newScale);
    });
    setScale(newScale);
  };

  const handleMouseUpGlobal = () => {
    if (isPanMode && isPanning) {
      setIsPanning(false);
      panLastRef.current = null;
    }
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => window.removeEventListener("mouseup", handleMouseUpGlobal);
  }, [isPanMode, isPanning]);

  // Attach wheel listener with passive:false to allow preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => handleWheelNative(ev);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as EventListener);
  }, [scale, translate]);

  // Constrain translate when sizes or scale change (and on first layout)
  useEffect(() => {
    setTranslate(prev => constrainTranslate(prev, scale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth, canvasHeight, scale]);

  // Keep active tooltip anchored to selection when dimensions/scale change
  useEffect(() => {
    if (!tooltipAnchoredToSelection) return;
    if (tooltipPosition && activeSelectionIndex !== null) {
      const sel = selections[activeSelectionIndex];
      if (!sel) return;
      const bounds = selectionBoundsInStage(sel);
      // Anchor tooltip to bottom-left of selection with small offset below
      const anchorX = bounds.x;
      const anchorY = bounds.y + bounds.height + 8;
      setTooltipPosition({ x: anchorX, y: anchorY });
    }
  }, [imageScaleFactor, canvasWidth, canvasHeight, activeSelectionIndex, selections, viewportSize, tooltipAnchoredToSelection]);

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // Minimap viewport calculation
  const minimap = useMemo(() => {
    const miniWidth = 160;
    const miniHeight = canvasHeight > 0 ? (miniWidth * canvasHeight) / canvasWidth : 0;
    const viewWidth = (containerRef.current?.clientWidth ?? canvasWidth) / scale;
    const viewHeight = (containerRef.current?.clientHeight ?? canvasHeight) / scale;
    const viewX = -translate.x / scale;
    const viewY = -translate.y / scale;
    const k = miniWidth / canvasWidth;
    return {
      width: miniWidth,
      height: miniHeight,
      rect: {
        x: Math.max(0, Math.min(viewX * k, miniWidth)),
        y: Math.max(0, Math.min(viewY * k, miniHeight)),
        w: Math.max(0, Math.min(viewWidth * k, miniWidth)),
        h: Math.max(0, Math.min(viewHeight * k, miniHeight)),
      },
    };
  }, [canvasWidth, canvasHeight, scale, translate]);

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
    <div className="canvas-shell" ref={shellRef}>
      <div
        ref={containerRef}
        className="canvas-container"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
      {/* Toolbar */}
      {!isMobile && (
      <div className="zoom-toolbar" style={{ display: toolbarVisible ? "flex" : "none" }}>
        <IconButton
          size="small"
          onClick={() => {
            const newScale = Math.min(5, scale * 1.2);
            if (newScale !== scale) {
              setTranslate(prev => constrainTranslate(prev, newScale));
              setScale(newScale);
            }
          }}
          onMouseEnter={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setHoveredToolbarButton("zoom-in");
            setToolbarButtonRects(prev => ({ ...prev, "zoom-in": rect }));
          }}
          onMouseLeave={() => setHoveredToolbarButton(null)}
        >
          <ZoomIn fontSize="small" />
        </IconButton>
        <div style={{ padding: "0 6px", fontSize: 12, alignSelf: "center" }}>{Math.round(scale * 100)}%</div>
        <IconButton
          size="small"
          onClick={() => {
            const newScale = Math.max(0.5, scale / 1.2);
            if (newScale !== scale) {
              setTranslate(prev => constrainTranslate(prev, newScale));
              setScale(newScale);
            }
          }}
          onMouseEnter={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setHoveredToolbarButton("zoom-out");
            setToolbarButtonRects(prev => ({ ...prev, "zoom-out": rect }));
          }}
          onMouseLeave={() => setHoveredToolbarButton(null)}
        >
          <ZoomOut fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={resetView}
          onMouseEnter={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setHoveredToolbarButton("reset");
            setToolbarButtonRects(prev => ({ ...prev, "reset": rect }));
          }}
          onMouseLeave={() => setHoveredToolbarButton(null)}
        >
          <RestartAlt fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setIsPanMode((v) => !v)}
          className={isPanMode ? "toolbar-btn toolbar-btn--active" : "toolbar-btn"}
          onMouseEnter={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setHoveredToolbarButton("pan");
            setToolbarButtonRects(prev => ({ ...prev, "pan": rect }));
          }}
          onMouseLeave={() => setHoveredToolbarButton(null)}
        >
          <PanTool fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setMinimapVisible(v => !v)}
          onMouseEnter={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setHoveredToolbarButton("minimap");
            setToolbarButtonRects(prev => ({ ...prev, "minimap": rect }));
          }}
          onMouseLeave={() => setHoveredToolbarButton(null)}
        >
          {minimapVisible ? <Map fontSize="small" /> : <MapOutlined fontSize="small" />}
        </IconButton>
      </div>
      )}

      {/* Toolbar tooltips via portal */}
      {!isMobile && toolbarVisible && hoveredToolbarButton && toolbarButtonRects[hoveredToolbarButton] && (() => {
        const buttonRect = toolbarButtonRects[hoveredToolbarButton];
        const tooltips = {
          "zoom-in": "Zoom in",
          "zoom-out": "Zoom out",
          "reset": "Reset zoom",
          "pan": isPanMode ? "Exit pan mode" : "Enter pan mode",
          "minimap": minimapVisible ? "Hide minimap" : "Show minimap"
        };

        return createPortal(
          <div style={{
            position: "fixed",
            top: `${buttonRect.bottom + 8}px`,
            left: `${buttonRect.left + (buttonRect.width / 2)}px`,
            transform: "translateX(-50%)",
            zIndex: 9999,
            pointerEvents: "none"
          }}>
            <div style={{
              background: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap"
            }}>
              {tooltips[hoveredToolbarButton as keyof typeof tooltips]}
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Transform stage */}
      <div
        ref={stageRef}
        className="canvas-stage"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        }}
      >
        <img
          src={imageSrc}
          alt="Rendering"
          className="rendering-image"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
        <canvas
          ref={canvasRef}
          width={canvasPixelWidth}
          height={canvasPixelHeight}
          className="canvas"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            cursor: isPanMode ? 'grab' : isEnteringFeedback ? 'default' : 'crosshair',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />
      </div>

      {/* Selection overlay controls (screen-space, not scaled) */}
      {!isMobile && selections.map((selection, index) => {
        const { x, y, width, height } = selectionBoundsInStage(selection);
        const screenTopLeft = stageToScreenPoint({ x, y });
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              top: screenTopLeft.y,
              left: screenTopLeft.x,
              width: width * scale,
              height: height * scale,
              pointerEvents: "none",
            }}
          >
            <div className="selection-tooltip-box" style={{ pointerEvents: "auto" }}>
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

      {/* Feedback UI: Mobile modal or desktop tooltip */}
      {isMobile ? (
        <MobileFeedbackModal
          visible={showMobileModal}
          selection={activeSelectionIndex !== null && selections[activeSelectionIndex]
            ? selections[activeSelectionIndex]
            : { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }}
          onSave={handleMobileSave}
          onDelete={handleMobileDelete}
          onClose={handleMobileClose}
          onOpenChange={(isOpen) => {
            if (isOpen) {
              setIsEnteringFeedback(true);
            }
          }}
          feedbackConfig={getFeedbackConfig()}
        />
      ) : (
        tooltipPosition && activeSelectionIndex !== null && (() => {
            let viewportX: number;
            let viewportY: number;
            if (tooltipIsViewportCoords) {
              viewportX = tooltipPosition.x;
              viewportY = tooltipPosition.y;
            } else {
              const screenPos = stageToScreenPoint({ x: tooltipPosition.x, y: tooltipPosition.y });
              const containerRect = containerRef.current?.getBoundingClientRect();
              viewportX = (containerRect?.left ?? 0) + screenPos.x;
              viewportY = (containerRect?.top ?? 0) + screenPos.y;
            }
            const tooltipWidth = 250; // matches Tooltip width style
            const viewportWidth = typeof window !== "undefined" ? window.innerWidth : tooltipWidth;
            const clampedX = Math.max(0, Math.min(viewportX, viewportWidth - tooltipWidth));
            const tooltipNode = (
              <Tooltip
                index={activeSelectionIndex}
                x={clampedX}
                y={viewportY}
                selection={selections[activeSelectionIndex]}
                setSelections={setSelections as React.Dispatch<React.SetStateAction<Selection[]>>}
                setActiveSelectionIndex={setActiveSelectionIndex}
                setTooltipPosition={setTooltipPosition}
                setIsEnteringFeedback={setIsEnteringFeedback}
                onDelete={() => handleDelete(activeSelectionIndex)}
              />
            );
            return createPortal(tooltipNode, document.body);
          })()
      )}

      {/* Mini-map */}
      {!isMobile && toolbarVisible && minimapVisible && (
        <div className="minimap" style={{ width: minimap.width, height: minimap.height }}>
          <img
            src={imageSrc}
            alt="Minimap"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          <div
            className="minimap-viewport"
            style={{
              left: minimap.rect.x,
              top: minimap.rect.y,
              width: minimap.rect.w,
              height: minimap.rect.h,
            }}
          />
        </div>
      )}
      </div>

      {/* External toggles outside of image container */}
      {!isMobile && (
        <div className="canvas-top-right-controls">
          <IconButton
            size="small"
            onClick={() => { setToolbarVisible(v => !v); if (toolbarVisible) setMinimapVisible(false); }}
            data-tooltip={toolbarVisible ? "Hide toolbar" : "Show toolbar"}
          >
            {toolbarVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </IconButton>
        </div>
      )}

      {isMobile && (
        <div className="mobile-picture-wide-control">
          <button
            type="button"
            className="mobile-picture-wide-button"
            onClick={openPictureSelectionMobile}
            disabled={isEnteringFeedback || isSelecting}
          >
            Annotate Full Image
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;
