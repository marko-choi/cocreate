import { useState, useCallback } from 'react';
import { Annotation } from '../types/global';
import { getVisibleAnnotationIndex } from '../utils/annotation-utils';

export const useAnnotations = () => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [baseAggregatedAnnotations, setBaseAggregatedAnnotations] = useState<Annotation[][]>([]);
  const [aggregatedAnnotations, setAggregatedAnnotations] = useState<Annotation[][]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<number>(-1);

  const updateAggregatedAnnotations = useCallback((newAnnotations: Annotation[][]) => {
    setBaseAggregatedAnnotations(newAnnotations);
    setAggregatedAnnotations(newAnnotations);
    setActiveAnnotation(getVisibleAnnotationIndex(newAnnotations, activeAnnotation));
  }, [activeAnnotation]);

  const setActiveAnnotationWithValidation = useCallback((index: number) => {
    setActiveAnnotation(getVisibleAnnotationIndex(aggregatedAnnotations, index));
  }, [aggregatedAnnotations]);

  return {
    annotations,
    setAnnotations,
    baseAggregatedAnnotations,
    setBaseAggregatedAnnotations,
    aggregatedAnnotations,
    setAggregatedAnnotations,
    activeAnnotation,
    setActiveAnnotation: setActiveAnnotationWithValidation,
    updateAggregatedAnnotations,
  };
};
