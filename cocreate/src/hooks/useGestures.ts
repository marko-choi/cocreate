/**
 * Custom React hooks for handling touch gestures
 * Provides pinch-to-zoom, pan, and double-tap functionality
 */

import { useEffect, useRef, useState, RefObject } from 'react';

export interface GestureConfig {
  enabled?: boolean;
  minScale?: number;
  maxScale?: number;
  onScaleChange?: (scale: number) => void;
  onTranslateChange?: (translate: { x: number; y: number }) => void;
}

export interface GestureState {
  scale: number;
  translate: { x: number; y: number };
}

/**
 * Hook for handling pinch-to-zoom and pan gestures
 */
export const useGestures = (
  targetRef: RefObject<HTMLElement>,
  config: GestureConfig = {}
): GestureState => {
  const {
    enabled = true,
    minScale = 0.5,
    maxScale = 4,
    onScaleChange,
    onTranslateChange,
  } = config;

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  
  const lastDistance = useRef<number | null>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const isPinching = useRef(false);

  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const element = targetRef.current;

    /**
     * Calculate distance between two touch points
     */
    const getDistance = (touches: TouchList): number => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    /**
     * Calculate center point between two touches
     */
    const getCenter = (touches: TouchList): { x: number; y: number } => {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    };

    /**
     * Handle touch start - initialize gesture tracking
     */
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Two-finger gesture (pinch)
        e.preventDefault();
        isPinching.current = true;
        lastDistance.current = getDistance(e.touches);
        lastCenter.current = getCenter(e.touches);
      } else if (e.touches.length === 1) {
        // Single-finger gesture (pan)
        lastCenter.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    /**
     * Handle touch move - update scale and translation
     */
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching.current) {
        // Pinch-to-zoom
        e.preventDefault();
        
        const currentDistance = getDistance(e.touches);
        const currentCenter = getCenter(e.touches);

        if (lastDistance.current && lastCenter.current) {
          // Calculate scale change
          const scaleChange = currentDistance / lastDistance.current;
          const newScale = Math.max(minScale, Math.min(maxScale, scale * scaleChange));
          
          // Calculate translation to zoom towards pinch center
          const scaleDiff = newScale - scale;
          const rect = element.getBoundingClientRect();
          const centerX = currentCenter.x - rect.left;
          const centerY = currentCenter.y - rect.top;
          
          const newTranslateX = translate.x - (centerX * scaleDiff);
          const newTranslateY = translate.y - (centerY * scaleDiff);

          setScale(newScale);
          setTranslate({ x: newTranslateX, y: newTranslateY });
          
          if (onScaleChange) onScaleChange(newScale);
          if (onTranslateChange) onTranslateChange({ x: newTranslateX, y: newTranslateY });
        }

        lastDistance.current = currentDistance;
        lastCenter.current = currentCenter;
      } else if (e.touches.length === 1 && !isPinching.current && scale > 1) {
        // Pan when zoomed in
        e.preventDefault();
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        if (lastCenter.current) {
          const deltaX = currentX - lastCenter.current.x;
          const deltaY = currentY - lastCenter.current.y;

          const newTranslate = {
            x: translate.x + deltaX,
            y: translate.y + deltaY,
          };

          setTranslate(newTranslate);
          if (onTranslateChange) onTranslateChange(newTranslate);
        }

        lastCenter.current = { x: currentX, y: currentY };
      }
    };

    /**
     * Handle touch end - clean up gesture state
     */
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching.current = false;
        lastDistance.current = null;
      }
      if (e.touches.length === 0) {
        lastCenter.current = null;
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, scale, translate, minScale, maxScale, onScaleChange, onTranslateChange, targetRef]);

  return { scale, translate };
};

/**
 * Hook for handling double-tap gesture
 */
export const useDoubleTap = (
  onDoubleTap: () => void,
  delay: number = 300
): (() => void) => {
  const lastTapRef = useRef<number>(0);

  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      // Double tap detected
      onDoubleTap();
      lastTapRef.current = 0; // Reset to prevent triple-tap
    } else {
      // Single tap
      lastTapRef.current = now;
    }
  };

  return handleTap;
};

/**
 * Hook for preventing default touch behaviors
 */
export const usePreventZoom = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent pinch-zoom on the entire document
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
    };
  }, [enabled]);
};

/**
 * Hook for detecting long press gesture
 */
export const useLongPress = (
  onLongPress: () => void,
  duration: number = 500
): {
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
} => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const start = () => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, duration);
  };

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
  };
};
