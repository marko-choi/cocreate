import { useAnnotations } from './useAnnotations';
import { useExecutiveSummary } from './useExecutiveSummary';
import { useDemographics } from './useDemographics';
import { useFeedbackFilters } from './useFeedbackFilters';
import { useCsvImport } from './useCsvImport';
import { useSearch } from './useSearch';
import { Selection } from '../types/global';

/**
 * Master hook that coordinates all dashboard state and actions.
 * This reduces the number of variables in App.tsx by grouping related functionality.
 */
export const useDashboard = (activeSelection: Selection | null) => {
  const annotations = useAnnotations();
  const executiveSummary = useExecutiveSummary(annotations.activeAnnotation);
  const demographics = useDemographics(
    annotations.baseAggregatedAnnotations,
    annotations.aggregatedAnnotations,
    annotations.activeAnnotation,
    annotations.setAggregatedAnnotations,
    annotations.setActiveAnnotation
  );
  const feedbackFilters = useFeedbackFilters(
    annotations.baseAggregatedAnnotations,
    annotations.aggregatedAnnotations,
    annotations.activeAnnotation,
    activeSelection,
    annotations.setBaseAggregatedAnnotations
  );
  const csvImport = useCsvImport(
    annotations.setAnnotations,
    annotations.setBaseAggregatedAnnotations,
    annotations.setAggregatedAnnotations,
    annotations.setActiveAnnotation,
    annotations.activeAnnotation,
    demographics.setDemographicModalOpen,
    demographics.setAvailableDemographicColumns
  );
  const search = useSearch(
    annotations.baseAggregatedAnnotations,
    annotations.aggregatedAnnotations,
    annotations.activeAnnotation,
    demographics.demographicSelections,
    annotations.setBaseAggregatedAnnotations,
    annotations.setAggregatedAnnotations,
    annotations.setActiveAnnotation
  );

  return {
    annotations,
    executiveSummary,
    demographics,
    feedbackFilters,
    csvImport,
    search,
  };
};
