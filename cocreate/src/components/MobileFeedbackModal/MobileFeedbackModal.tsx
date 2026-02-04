/**
 * MobileFeedbackModal Component
 * Full-screen modal for collecting feedback on mobile devices
 * Replaces the desktop tooltip with a touch-friendly interface
 */

import React, { useState, useEffect } from 'react';
import './MobileFeedbackModal.css';
import { FeedbackConfig } from '../../types/global';

export interface MobileFeedbackModalProps {
  visible: boolean;
  selection: any; // The active selection object
  onSave: (feedback: { functionValue: string; aestheticValue: string; comment: string }) => void;
  onDelete: () => void;
  onClose: () => void;
  feedbackConfig?: FeedbackConfig;
  onOpenChange?: (isOpen: boolean) => void;
}

const MobileFeedbackModal: React.FC<MobileFeedbackModalProps> = ({
  visible,
  selection,
  onSave,
  onDelete,
  onClose,
  feedbackConfig = {
    showFunctionValue: true,
    showAestheticValue: true,
    showComment: true,
  },
  onOpenChange,
}) => {
  const [functionValue, setFunctionValue] = useState<string>('');
  const [aestheticValue, setAestheticValue] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [modalHeightPx, setModalHeightPx] = useState<number | null>(null);
  const lastPinchDistanceRef = React.useRef<number | null>(null);
  const lastDragYRef = React.useRef<number | null>(null);

  // Initialize state from selection when modal opens
  useEffect(() => {
    if (visible && selection) {
      setFunctionValue(selection.functionValue || '');
      setAestheticValue(selection.aestheticValue || '');
      setComment(selection.comment || '');
    }
  }, [visible, selection]);

  useEffect(() => {
    onOpenChange?.(visible);
  }, [visible, onOpenChange]);

  useEffect(() => {
    if (!visible) return;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
    if (!vh) return;
    const defaultHeight = Math.round(vh * 0.85);
    setModalHeightPx(defaultHeight);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handleResize = () => {
      if (modalHeightPx === null) return;
      setModalHeightPx((current) => (current ? clampHeight(current) : current));
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [visible, modalHeightPx]);

  // Handle save action
  const handleSave = () => {
    onSave({
      functionValue,
      aestheticValue,
      comment,
    });
    // Reset form
    setFunctionValue('');
    setAestheticValue('');
    setComment('');
  };

  // Handle delete action
  const handleDelete = () => {
    onDelete();
    // Reset form
    setFunctionValue('');
    setAestheticValue('');
    setComment('');
  };

  const getPinchDistance = (touches: React.TouchList) => {
    const t1 = touches[0];
    const t2 = touches[1];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.hypot(dx, dy);
  };

  const clampHeight = (height: number) => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : height;
    const minHeight = Math.round(vh * 0.35);
    const maxHeight = Math.round(vh * 0.95);
    return Math.min(maxHeight, Math.max(minHeight, height));
  };

  const handleHandleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDistanceRef.current = getPinchDistance(e.touches);
      lastDragYRef.current = null;
      return;
    }
    if (e.touches.length === 1) {
      lastDragYRef.current = e.touches[0].clientY;
      lastPinchDistanceRef.current = null;
    }
  };

  const handleHandleTouchMove = (e: React.TouchEvent) => {
    if (modalHeightPx === null) return;
    if (e.touches.length === 2 && lastPinchDistanceRef.current) {
      e.preventDefault();
      const distance = getPinchDistance(e.touches);
      const scale = distance / lastPinchDistanceRef.current;
      const nextHeight = clampHeight(modalHeightPx * scale);
      setModalHeightPx(nextHeight);
      lastPinchDistanceRef.current = distance;
      return;
    }
    if (e.touches.length === 1 && lastDragYRef.current !== null) {
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const dy = currentY - lastDragYRef.current;
      const nextHeight = clampHeight(modalHeightPx - dy);
      setModalHeightPx(nextHeight);
      lastDragYRef.current = currentY;
    }
  };

  const handleHandleTouchEnd = () => {
    lastPinchDistanceRef.current = null;
    lastDragYRef.current = null;
  };

  const handleBackdropTouch = (e: React.TouchEvent) => {
    if (e.touches.length > 1 && e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  const handleModalTouch = (e: React.TouchEvent) => {
    if (e.touches.length > 1 && e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if not visible
  if (!visible) return null;

  // Rating options (good/bad)
  const ratingOptions = [
    { value: 'good', label: 'Good' },
    { value: 'bad', label: 'Bad' },
  ];

  const hasFunctionValue = feedbackConfig.showFunctionValue && !!functionValue;
  const hasAestheticValue = feedbackConfig.showAestheticValue && !!aestheticValue;
  const hasCommentValue = feedbackConfig.showComment && !!comment;
  const isSaveEnabled = hasFunctionValue || hasAestheticValue || hasCommentValue;

  return (
    <div
      className="mobile-modal-backdrop"
      onClick={handleBackdropClick}
      onTouchStart={handleBackdropTouch}
      onTouchMove={handleBackdropTouch}
      onTouchEnd={handleBackdropTouch}
    >
      <div
        className="mobile-modal"
        style={modalHeightPx ? { height: `${modalHeightPx}px`, maxHeight: `${modalHeightPx}px` } : undefined}
        onTouchStart={handleModalTouch}
        onTouchMove={handleModalTouch}
        onTouchEnd={handleModalTouch}
      >
        {/* Handle bar for visual affordance */}
        <div
          className="mobile-modal-handle"
          onTouchStart={handleHandleTouchStart}
          onTouchMove={handleHandleTouchMove}
          onTouchEnd={handleHandleTouchEnd}
          onTouchCancel={handleHandleTouchEnd}
        />

        {/* Header */}
        <div className="mobile-modal-header">
          <h2>Add Feedback</h2>
          <button
            className="mobile-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="mobile-modal-content">
          {/* Function Value Selection */}
          {feedbackConfig.showFunctionValue && (
            <div className="mobile-modal-section">
              <label className="mobile-modal-label">
                How does this area function?
              </label>
              <div className="mobile-modal-button-group">
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`mobile-modal-option ${
                      functionValue === option.value ? 'active' : ''
                    }`}
                    onClick={() => setFunctionValue(option.value)}
                  >
                    <span className="mobile-modal-option-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aesthetic Value Selection */}
          {feedbackConfig.showAestheticValue && (
            <div className="mobile-modal-section">
              <label className="mobile-modal-label">
                How does this area look?
              </label>
              <div className="mobile-modal-button-group">
                {ratingOptions.map((option) => (
                  <button
                    key={`aesthetic-${option.value}`}
                    className={`mobile-modal-option ${
                      aestheticValue === option.value ? 'active' : ''
                    }`}
                    onClick={() => setAestheticValue(option.value)}
                  >
                    <span className="mobile-modal-option-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment Input */}
          {feedbackConfig.showComment && (
            <div className="mobile-modal-section">
              <label className="mobile-modal-label" htmlFor="comment-input">
                Additional comments (optional)
              </label>
              <textarea
                id="comment-input"
                className="mobile-modal-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mobile-modal-footer">
          <button
            className="mobile-modal-button mobile-modal-button-delete"
            onClick={handleDelete}
          >
            Delete
          </button>
          <button
            className="mobile-modal-button mobile-modal-button-save"
            onClick={handleSave}
            disabled={!isSaveEnabled}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFeedbackModal;
