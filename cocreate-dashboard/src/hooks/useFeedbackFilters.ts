import { useState, useCallback } from 'react';
import { FeedbackFilterGroup, Annotation, Selection } from '../types/global';
import { checkSelectionShowEligibility } from '../utils/filter-utils';

export const useFeedbackFilters = (
  baseAggregatedAnnotations: Annotation[][],
  aggregatedAnnotations: Annotation[][],
  activeAnnotation: number,
  activeSelection: Selection | null,
  setBaseAggregatedAnnotations: (annotations: Annotation[][]) => void
) => {
  const [feedbackFilters, setFeedbackFilters] = useState<FeedbackFilterGroup[]>([
    {
      group: "Sentiment",
      groupCount: 0,
      groupType: "value",
      filters: [
        { label: "Positive", id: "positive", value: "good", fieldName: 'functionValue', active: true },
        { label: "Negative", id: "negative", value: "bad", fieldName: 'functionValue', active: true },
      ]
    },
    {
      group: "Category",
      groupCount: 0,
      groupType: "field",
      filters: [
        { label: "Aesthetic", id: "aesthetic", value: "aesthetic", fieldName: 'aestheticValue', active: true },
        { label: "Functional", id: "functional", value: "functional", fieldName: 'functionValue', active: true },
      ]
    }
  ]);

  const updateFilterCounts = useCallback((annotations: Annotation[][], currentActiveAnnotation: number) => {
    if (currentActiveAnnotation === -1) return;

    const allSelections = annotations[currentActiveAnnotation]?.flatMap(a => a.selections) || [];
    const containedSelections = activeSelection
      ? allSelections.filter(s => {
          // Check if selection is contained
          return (
            s.start.x >= activeSelection.start.x &&
            s.start.y >= activeSelection.start.y &&
            s.end.x <= activeSelection.end.x &&
            s.end.y <= activeSelection.end.y
          );
        })
      : allSelections;

    setFeedbackFilters(prev => prev.map(filterGroup => ({
      ...filterGroup,
      groupCount: containedSelections.length
    })));
  }, [activeSelection]);

  const handleFilterChange = useCallback((
    questionId: number,
    filterGroup: string,
    fieldName: string,
    value: string
  ) => {
    const filterGroupChanged = feedbackFilters.find(fg => fg.group === filterGroup);
    if (!filterGroupChanged) return;

    const filterChanged = filterGroupChanged.filters.find(f => f.fieldName === fieldName && f.value === value);
    if (!filterChanged) return;

    // Update checked status
    const updatedFilters = feedbackFilters.map((filterGroup) => {
      const updatedFilters = filterGroup.filters.map((filter) => {
        if (filter.fieldName === fieldName && filter.value === value) {
          return { ...filter, active: !filter.active };
        }
        return filter;
      });
      return { ...filterGroup, filters: updatedFilters };
    });

    const sourceAggregatedAnnotations = baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations;
    // Update show status
    const updatedAggregatedAnnotations = sourceAggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        if (annotation.questionId !== questionId) return annotation;
        const updatedSelections = annotation.selections.map((selection) =>
          ({ ...selection, show: checkSelectionShowEligibility(selection, updatedFilters, activeSelection) }))
        return { ...annotation, selections: updatedSelections };
      });
      return updatedQuestions;
    });

    setFeedbackFilters(updatedFilters);
    setBaseAggregatedAnnotations(updatedAggregatedAnnotations);
  }, [feedbackFilters, baseAggregatedAnnotations, aggregatedAnnotations, activeAnnotation, activeSelection, setBaseAggregatedAnnotations]);

  return {
    feedbackFilters,
    setFeedbackFilters,
    handleFilterChange,
    updateFilterCounts,
  };
};
