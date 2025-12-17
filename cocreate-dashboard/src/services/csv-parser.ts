import Papa, { LocalFile } from 'papaparse';
import { Annotation, AnnotationsDto, Selection, SelectionDto } from '../types/global';
import { CORE_COLUMNS } from '../constants';
import { checkForIniitalShowEligibility } from '../utils/selection-utils';

export interface CsvParseResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export const parseCsvFile = (csvFile: File): Promise<CsvParseResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(csvFile, {
      header: true,
      complete: function(results: Papa.ParseResult<Record<string, unknown>>) {
        const allColumns: string[] = (results.meta?.fields?.filter((field: string) => !!field)) || [];
        const parsedRows: Record<string, unknown>[] = (results.data || []) as Record<string, unknown>[]
        const nonEmptyRows = parsedRows.filter((row) => {
          if (!row || typeof row !== 'object') return false;
          return Object.values(row).some((v) => `${v ?? ''}`.trim() !== '');
        });

        resolve({
          columns: allColumns,
          rows: nonEmptyRows
        });
      },
      error: function(error: Error, file: LocalFile) {
        reject(new Error(`Error parsing CSV file: ${error.message} ${file}  `));
      }
    });
  });
};

const normalizeQidKey = (qid: string): string => {
  const trimmed = (qid || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("QID") ? trimmed : `QID${trimmed.replace(/^QID/i, "")}`;
};

export const importFromCsvData = (
  rows: Record<string, unknown>[],
  allColumns: string[]
): {
  annotations: Annotation[];
  demographicColumns: string[];
} => {
  const demographicColumns = allColumns.filter((column) => !CORE_COLUMNS.includes(column as any));
  const annotationsDto: AnnotationsDto[] = rows as unknown as AnnotationsDto[];
  const annotations: Annotation[] = [];

  for (let i = 0; i < annotationsDto.length; i++) {
    const row = annotationsDto[i];

    // Skip empty rows
    if (!row || !row.selectionsData || !row.image) {
      continue;
    }

    try {
      const demographics: Record<string, string> = {};
      allColumns.forEach((key) => {
        if (CORE_COLUMNS.includes(key as any)) return;
        const value = (row as unknown as Record<string, unknown>)[key];
        if (value !== undefined && value !== null && `${value}`.trim() !== '') {
          demographics[key] = `${value}`;
        }
      });

      // Parse selectionsData - it's a JSON object with questionId as key
      let selectionsDataObj: Record<string, SelectionDto[]> = {};
      if (row.selectionsData && row.selectionsData.trim()) {
        selectionsDataObj = JSON.parse(row.selectionsData);
      }

      // Parse metadata - it's a JSON object with questionId as key
      let metadataObj: Record<string, { width?: number; height?: number; imageScaleFactor?: number }> = {};
      if (row.metadata && row.metadata.trim()) {
        metadataObj = JSON.parse(row.metadata);
      }

      // Parse image column. It may be:
      // - A single URL string
      // - A JSON map of { QIDxxx: url }
      let imagesObj: Record<string, string> | null = null;
      const rawImageValue = `${row.image}`.trim();
      if (rawImageValue.startsWith("{")) {
        try {
          const parsed = JSON.parse(rawImageValue);
          if (parsed && typeof parsed === "object") imagesObj = parsed as Record<string, string>;
        } catch {
          imagesObj = null;
        }
      }

      // Determine which QIDs to expand for this row.
      let qidKeys: string[] = [];
      const rowQidKey = normalizeQidKey(row.questionId || "");
      if (rowQidKey) qidKeys = [rowQidKey];
      else if (imagesObj) qidKeys = Object.keys(imagesObj);
      else qidKeys = Object.keys(selectionsDataObj);

      // Fallback if everything is empty (avoid silently dropping)
      if (qidKeys.length === 0) continue;

      qidKeys.forEach((qidKey) => {
        const numericQuestionId = parseInt(qidKey.replace(/^QID/i, "")) || 0;
        const selectionData: SelectionDto[] = selectionsDataObj[qidKey] || [];
        const metadata = metadataObj[qidKey] || {};
        const scaleFactor = metadata.imageScaleFactor || 1;
        const imageWidth = metadata.width || 723;
        const imageHeight = metadata.height || 534;
        const imagePath = (imagesObj ? imagesObj[qidKey] : rawImageValue) || "";

        const imageName = numericQuestionId ? `Question ${numericQuestionId}` : qidKey;

        annotations.push({
          imageName,
          questionId: numericQuestionId,
          selections: selectionData.map((selection: SelectionDto) => {
            const start = selection.start || { x: 0, y: 0 };
            const end = selection.end || { x: 0, y: 0 };

            return {
              uid: Math.random().toString(36).substring(7),
              start,
              end,
              functionValue: (selection.functionValue === 'good' || selection.functionValue === 'bad')
                ? selection.functionValue
                : null,
              aestheticValue: (selection.aestheticValue === 'good' || selection.aestheticValue === 'bad')
                ? selection.aestheticValue
                : null,
              comment: selection.comment || "",
              show: true
            };
          }),
          image: "",
          imagePath,
          scaleFactor,
          width: imageWidth,
          height: imageHeight,
          demographics,
        });
      });
    } catch (error) {
      console.error(`Error parsing row ${i}:`, error, row);
      // Continue to next row if there's an error
    }
  }

  // Process selections
  annotations.forEach((annotation) => {
    annotation.selections.forEach(selection => {
      selection.show = checkForIniitalShowEligibility(selection);
      selection.uid = Math.random().toString(36).substring(7);
    });
    annotation.show = true;
  });

  return { annotations, demographicColumns };
};

export const createAnnotationBuckets = (annotations: Annotation[]): Annotation[][] => {
  const bucketsByQuestionId = new Map<number, Annotation[]>();

  annotations.forEach((annotation) => {
    const key = annotation.questionId || 0;
    if (!bucketsByQuestionId.has(key)) bucketsByQuestionId.set(key, []);
    bucketsByQuestionId.get(key)!.push(annotation);
  });

  const sortedQuestionIds = Array.from(bucketsByQuestionId.keys()).sort((a, b) => a - b);
  return sortedQuestionIds.map((qid) => bucketsByQuestionId.get(qid)!);
};
