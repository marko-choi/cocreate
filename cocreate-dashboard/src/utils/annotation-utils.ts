import { Annotation } from '../types/global';

export const findFirstVisibleAnnotationIndex = (data: Annotation[][]): number => {
  return data.findIndex(bucket => bucket[0]?.show !== false && bucket.length > 0);
};

export const getVisibleAnnotationIndex = (data: Annotation[][], preferredIndex: number): number => {
  if (preferredIndex !== -1 && data[preferredIndex]?.[0]?.show !== false) return preferredIndex;
  const firstVisible = findFirstVisibleAnnotationIndex(data);
  return firstVisible === -1 ? -1 : firstVisible;
};

export const applyDemographicFilters = (
  sourceAnnotations: Annotation[][],
  filters: Record<string, string[]>
): Annotation[][] => {
  const hasActiveFilters = Object.values(filters).some(values => values && values.length > 0);

  return sourceAnnotations.map((bucket) => {
    let bucketHasMatch = false;
    const updatedBucket = bucket.map((annotation) => {
      const matches = !hasActiveFilters || Object.entries(filters).every(([key, values]) => {
        if (!values || values.length === 0) return true;
        const demographicValue = annotation.demographics?.[key];
        return demographicValue ? values.includes(String(demographicValue)) : false;
      });

      if (matches && annotation.show !== false) bucketHasMatch = true;

      const updatedSelections = annotation.selections.map((selection) => {
        const baseShow = selection.show !== false;
        return { ...selection, show: baseShow && matches };
      });

      return { ...annotation, selections: updatedSelections, show: (annotation.show !== false) && matches };
    });

    if (!bucketHasMatch && updatedBucket.length > 0) {
      return updatedBucket.map((annotation, index) => index === 0 ? { ...annotation, show: false } : annotation);
    }

    if (bucketHasMatch && updatedBucket.length > 0) {
      return updatedBucket.map((annotation, index) => index === 0 ? { ...annotation, show: true } : annotation);
    }

    return updatedBucket;
  });
};
