import { useState, useCallback } from 'react';
import { Annotation } from '../types/global';
import { parseCsvFile, importFromCsvData, createAnnotationBuckets, CsvParseResult } from '../services/csv-parser';
import { applyDemographicFilters } from '../utils/annotation-utils';
import { getVisibleAnnotationIndex } from '../utils/annotation-utils';
import { CORE_COLUMNS } from '../constants';

export const useCsvImport = (
  setAnnotations: (annotations: Annotation[]) => void,
  setBaseAggregatedAnnotations: (annotations: Annotation[][]) => void,
  setAggregatedAnnotations: (annotations: Annotation[][]) => void,
  setActiveAnnotation: (index: number) => void,
  activeAnnotation: number,
  setDemographicModalOpen: (open: boolean) => void,
  setAvailableDemographicColumns: (columns: string[]) => void
) => {
  const [csvCleanupOpen, setCsvCleanupOpen] = useState<boolean>(false);
  const [csvCleanupColumns, setCsvCleanupColumns] = useState<string[]>([]);
  const [csvCleanupRows, setCsvCleanupRows] = useState<Record<string, unknown>[]>([]);

  const resetCsvCleanupState = useCallback(() => {
    setCsvCleanupOpen(false);
    setCsvCleanupColumns([]);
    setCsvCleanupRows([]);
  }, []);

  const removeCsvColumn = useCallback((column: string) => {
    if (column === 'selectionsData' || column === 'image') return;
    setCsvCleanupColumns((prev) => prev.filter((c) => c !== column));
    setCsvCleanupRows((prev) =>
      prev.map((row) => {
        const next = { ...row };
        delete (next as Record<string, unknown>)[column];
        return next;
      })
    );
  }, []);

  const removeCsvRow = useCallback((rowIndex: number) => {
    setCsvCleanupRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  }, []);

  const handleImportFromCsvData = useCallback((rows: Record<string, unknown>[], allColumns: string[]) => {
    const { annotations, demographicColumns } = importFromCsvData(rows, allColumns);

    setAnnotations(annotations);
    setAvailableDemographicColumns(demographicColumns);

    const buckets = createAnnotationBuckets(annotations);
    setBaseAggregatedAnnotations(buckets);
    const filteredBuckets = applyDemographicFilters(buckets, {});
    setActiveAnnotation(getVisibleAnnotationIndex(filteredBuckets, activeAnnotation));
    setAggregatedAnnotations(filteredBuckets);

    setDemographicModalOpen(demographicColumns.length > 0);
  }, [setAnnotations, setBaseAggregatedAnnotations, setAggregatedAnnotations, setActiveAnnotation, activeAnnotation, setDemographicModalOpen, setAvailableDemographicColumns]);

  const applyCsvCleanupAndContinue = useCallback(() => {
    const cols = [...csvCleanupColumns];
    const rows = [...csvCleanupRows];
    resetCsvCleanupState();
    handleImportFromCsvData(rows, cols);
  }, [csvCleanupColumns, csvCleanupRows, resetCsvCleanupState, handleImportFromCsvData]);

  const importAnnotations = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const result: CsvParseResult = await parseCsvFile(file);
          setCsvCleanupColumns(result.columns);
          setCsvCleanupRows(result.rows);
          setCsvCleanupOpen(true);
        } catch (error) {
          console.error('Error parsing CSV:', error);
        }
      }
    };
    input.click();
  }, []);

  return {
    csvCleanupOpen,
    setCsvCleanupOpen,
    csvCleanupColumns,
    csvCleanupRows,
    resetCsvCleanupState,
    removeCsvColumn,
    removeCsvRow,
    applyCsvCleanupAndContinue,
    importAnnotations,
  };
};
