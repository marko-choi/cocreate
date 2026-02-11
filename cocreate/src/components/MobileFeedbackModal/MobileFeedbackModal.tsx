/**
 * MobileFeedbackModal Component
 * Full-screen modal for collecting feedback on mobile devices
 * Replaces the desktop tooltip with a touch-friendly interface
 */

import React, { useState, useEffect } from 'react';
import './MobileFeedbackModal.css';

export interface FeedbackConfig {
  showFunctionValue?: boolean;
  showAestheticValue?: boolean;
  showComment?: boolean;
}

export interface MobileFeedbackModalProps {
  visible: boolean;
  selection: any; // The active selection object
  onSave: (feedback: { functionValue: string; comment: string }) => void;
  onDelete: () => void;
  onClose: () => void;
  feedbackConfig?: FeedbackConfig;
}

const MobileFeedbackModal: React.FC<MobileFeedbackModalProps> = ({
  visible,
  selection,
  onSave,
  onDelete,
  onClose,
  feedbackConfig = {
    showFunctionValue: true,
    showAestheticValue: false,
    showComment: true,
  },
}) => {
  const [functionValue, setFunctionValue] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  // Initialize state from selection when modal opens
  useEffect(() => {
    if (visible && selection) {
      setFunctionValue(selection.functionValue || '');
      setComment(selection.comment || '');
    }
  }, [visible, selection]);

  // Handle save action
  const handleSave = () => {
    onSave({
      functionValue,
      comment,
    });
    // Reset form
    setFunctionValue('');
    setComment('');
  };

  // Handle delete action
  const handleDelete = () => {
    onDelete();
    // Reset form
    setFunctionValue('');
    setComment('');
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if not visible
  if (!visible) return null;

  // Function value options
  const functionOptions = [
    { value: 'good', label: 'Good', emoji: '👍' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'bad', label: 'Bad', emoji: '👎' },
  ];

  return (
    <div className="mobile-modal-backdrop" onClick={handleBackdropClick}>
      <div className="mobile-modal">
        {/* Handle bar for visual affordance */}
        <div className="mobile-modal-handle" />

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
                {functionOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`mobile-modal-option ${
                      functionValue === option.value ? 'active' : ''
                    }`}
                    onClick={() => setFunctionValue(option.value)}
                  >
                    <span className="mobile-modal-emoji">{option.emoji}</span>
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
            disabled={!functionValue && !comment}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFeedbackModal;
