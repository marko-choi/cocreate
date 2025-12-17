import { useCallback } from 'react';
import { Annotation } from '../types/global';
import { applyDemographicFilters } from '../utils/annotation-utils';
import { getVisibleAnnotationIndex } from '../utils/annotation-utils';

export const useSearch = (
  baseAggregatedAnnotations: Annotation[][],
  aggregatedAnnotations: Annotation[][],
  activeAnnotation: number,
  demographicSelections: Record<string, string[]>,
  setBaseAggregatedAnnotations: (annotations: Annotation[][]) => void,
  setAggregatedAnnotations: (annotations: Annotation[][]) => void,
  setActiveAnnotation: (index: number) => void
) => {
  const handleSearchAnnotations = useCallback((searchText: string) => {
    const cleanedSearchText = searchText.trim().toLowerCase();
    const sourceAggregatedAnnotations = baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations;
    const updatedAggregatedAnnotations = sourceAggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        return { ...annotation, show: annotation.imageName.toLowerCase().includes(cleanedSearchText) };
      });
      return updatedQuestions;
    });
    setBaseAggregatedAnnotations(updatedAggregatedAnnotations);
    const withDemographicFilters = applyDemographicFilters(updatedAggregatedAnnotations, demographicSelections);
    setAggregatedAnnotations(withDemographicFilters);
    setActiveAnnotation(getVisibleAnnotationIndex(withDemographicFilters, activeAnnotation));
  }, [baseAggregatedAnnotations, aggregatedAnnotations, activeAnnotation, demographicSelections, setBaseAggregatedAnnotations, setAggregatedAnnotations, setActiveAnnotation]);

  const handleSearchComments = useCallback((searchText: string) => {
    const cleanedSearchText = searchText.trim().toLowerCase();
    const sourceAggregatedAnnotations = baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations;
    const updatedAggregatedAnnotations = sourceAggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        const updatedSelections = annotation.selections.map((selection) =>
          ({ ...selection, show: selection.comment.toLowerCase().includes(cleanedSearchText) }))
        return { ...annotation, selections: updatedSelections };
      });
      return updatedQuestions;
    });
    setBaseAggregatedAnnotations(updatedAggregatedAnnotations);
    const withDemographicFilters = applyDemographicFilters(updatedAggregatedAnnotations, demographicSelections);
    setAggregatedAnnotations(withDemographicFilters);
  }, [baseAggregatedAnnotations, aggregatedAnnotations, demographicSelections, setBaseAggregatedAnnotations, setAggregatedAnnotations]);

  return {
    handleSearchAnnotations,
    handleSearchComments,
  };
};
