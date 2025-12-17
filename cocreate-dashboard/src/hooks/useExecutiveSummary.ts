import { useState, useRef } from 'react';
import { ExecutiveSummaryJson } from '../types/global';

export const useExecutiveSummary = (activeAnnotation: number) => {
  const [executiveSummariesByAnnotation, setExecutiveSummariesByAnnotation] = useState<Record<number, ExecutiveSummaryJson | undefined>>({});
  const [execSummaryImportOpen, setExecSummaryImportOpen] = useState<boolean>(false);
  const [execSummaryImportText, setExecSummaryImportText] = useState<string>('');
  const [execSummaryImportError, setExecSummaryImportError] = useState<string | null>(null);
  const execSummaryTextareaRef = useRef<HTMLTextAreaElement>(null);

  const getCurrentExecutiveSummary = (): ExecutiveSummaryJson | undefined => {
    if (activeAnnotation === -1) return undefined;
    return executiveSummariesByAnnotation[activeAnnotation];
  };

  const parseExecutiveSummaryJson = (value: unknown): ExecutiveSummaryJson => {
    if (typeof value !== 'object' || value === null) throw new Error('Invalid JSON: expected an object');
    const v = value as Record<string, unknown>;

    const summary = v.summary;
    const analysis = v.analysis;
    const strengths = v.strengths;
    const improvements = v.improvements;

    if (typeof summary !== 'string') throw new Error('Invalid JSON: "summary" must be a string');
    if (!Array.isArray(analysis) || !analysis.every((x) => typeof x === 'string')) {
      throw new Error('Invalid JSON: "analysis" must be an array of strings');
    }
    if (typeof strengths !== 'string') throw new Error('Invalid JSON: "strengths" must be a string');
    if (typeof improvements !== 'string') throw new Error('Invalid JSON: "improvements" must be a string');

    return { summary, analysis, strengths, improvements };
  };

  const importExecutiveSummaryFromText = () => {
    setExecSummaryImportError(null);
    if (activeAnnotation === -1) {
      setExecSummaryImportError('No active view selected yet.');
      return;
    }

    try {
      const parsed = JSON.parse(execSummaryImportText);
      const validated = parseExecutiveSummaryJson(parsed);
      setExecutiveSummariesByAnnotation((prev) => ({ ...prev, [activeAnnotation]: validated }));
      setExecSummaryImportOpen(false);
      setExecSummaryImportText('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid JSON';
      setExecSummaryImportError(message);
      setTimeout(() => execSummaryTextareaRef.current?.focus(), 0);
    }
  };

  const clearExecutiveSummaryForCurrent = () => {
    setExecSummaryImportError(null);
    if (activeAnnotation === -1) return;
    setExecutiveSummariesByAnnotation((prev) => {
      const next = { ...prev };
      delete next[activeAnnotation];
      return next;
    });
  };

  return {
    executiveSummariesByAnnotation,
    execSummaryImportOpen,
    setExecSummaryImportOpen,
    execSummaryImportText,
    setExecSummaryImportText,
    execSummaryImportError,
    setExecSummaryImportError,
    execSummaryTextareaRef,
    getCurrentExecutiveSummary,
    importExecutiveSummaryFromText,
    clearExecutiveSummaryForCurrent,
  };
};
