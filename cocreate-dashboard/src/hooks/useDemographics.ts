import { useState } from 'react';
import { DemographicFilter, Annotation } from '../types/global';
import { applyDemographicFilters } from '../utils/annotation-utils';
import { getVisibleAnnotationIndex } from '../utils/annotation-utils';

export const useDemographics = (
  baseAggregatedAnnotations: Annotation[][],
  aggregatedAnnotations: Annotation[][],
  activeAnnotation: number,
  setAggregatedAnnotations: (annotations: Annotation[][]) => void,
  setActiveAnnotation: (index: number) => void
) => {
  const [demographicModalOpen, setDemographicModalOpen] = useState<boolean>(false);
  const [demographicModalStep, setDemographicModalStep] = useState<'select' | 'rename'>('select');
  const [availableDemographicColumns, setAvailableDemographicColumns] = useState<string[]>([]);
  const [pendingDemographicColumns, setPendingDemographicColumns] = useState<string[]>([]);
  const [pendingDemographicLabels, setPendingDemographicLabels] = useState<Record<string, string>>({});
  const [demographicSearchTerm, setDemographicSearchTerm] = useState<string>('');
  const [demographicFilters, setDemographicFilters] = useState<DemographicFilter[]>([]);
  const [demographicSelections, setDemographicSelections] = useState<Record<string, string[]>>({});

  const handleDemographicFilterChange = (key: string, values: string[]) => {
    const updatedFilters = demographicFilters.map((filter) =>
      filter.key === key ? { ...filter, selectedValues: values } : filter
    );
    const updatedSelections = { ...demographicSelections, [key]: values };
    setDemographicFilters(updatedFilters);
    setDemographicSelections(updatedSelections);
    const withDemographicFilters = applyDemographicFilters(
      baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations,
      updatedSelections
    );
    setAggregatedAnnotations(withDemographicFilters);
    setActiveAnnotation(getVisibleAnnotationIndex(withDemographicFilters, activeAnnotation));
  };

  const togglePendingColumn = (column: string) => {
    setPendingDemographicColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((c) => c !== column);
      }
      return [...prev, column];
    });
  };

  const toggleAllPendingColumns = () => {
    if (pendingDemographicColumns.length === availableDemographicColumns.length) {
      setPendingDemographicColumns([]);
      return;
    }
    setPendingDemographicColumns(availableDemographicColumns);
  };

  const handleConfirmDemographics = () => {
    const sourceAggregatedAnnotations = baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations;
    if (pendingDemographicColumns.length === 0) {
      setDemographicFilters([]);
      setDemographicSelections({});
      setPendingDemographicLabels({});
      setDemographicSearchTerm('');
      const resetAggregated = applyDemographicFilters(sourceAggregatedAnnotations, {});
      setAggregatedAnnotations(resetAggregated);
      setDemographicModalOpen(false);
      setActiveAnnotation(getVisibleAnnotationIndex(resetAggregated, activeAnnotation));
      return;
    }

    const flatAnnotations = sourceAggregatedAnnotations.flat();
    const filters: DemographicFilter[] = pendingDemographicColumns.map((column) => {
      const uniqueValues = Array.from(new Set(
        flatAnnotations
          .map((annotation) => annotation.demographics?.[column])
          .filter((value): value is string => !!value)
      ));

      return {
        key: column,
        label: pendingDemographicLabels[column] || column,
        options: uniqueValues.map((value) => ({ value, label: value })),
        selectedValues: []
      };
    });

    const emptySelections = Object.fromEntries(pendingDemographicColumns.map((column) => [column, []])) as Record<string, string[]>;

    setDemographicFilters(filters);
    setDemographicSelections(emptySelections);
    setDemographicSearchTerm('');
    const withDemographicFilters = applyDemographicFilters(sourceAggregatedAnnotations, emptySelections);
    setAggregatedAnnotations(withDemographicFilters);
    setActiveAnnotation(getVisibleAnnotationIndex(withDemographicFilters, activeAnnotation));
    setDemographicModalOpen(false);
  };

  return {
    demographicModalOpen,
    setDemographicModalOpen,
    demographicModalStep,
    setDemographicModalStep,
    availableDemographicColumns,
    setAvailableDemographicColumns,
    pendingDemographicColumns,
    setPendingDemographicColumns,
    pendingDemographicLabels,
    setPendingDemographicLabels,
    demographicSearchTerm,
    setDemographicSearchTerm,
    demographicFilters,
    demographicSelections,
    handleDemographicFilterChange,
    togglePendingColumn,
    toggleAllPendingColumns,
    handleConfirmDemographics,
  };
};
