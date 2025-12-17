import { Selection, FeedbackFilterGroup } from '../types/global';
import { isSelectionContained } from './selection-utils';

export const checkSelectionShowEligibility = (
  selection: Selection,
  feedbackFilters: FeedbackFilterGroup[],
  activeSelection: Selection | null
): boolean => {
  // First check if the selection is contained within the active selection
  if (activeSelection && !isSelectionContained(activeSelection, selection)) {
    return false;
  }

  const fieldFilters = feedbackFilters.filter(fg => fg.groupType === 'field').flatMap(fg => fg.filters);
  const valueFilters = feedbackFilters.filter(fg => fg.groupType === 'value').flatMap(fg => fg.filters);
  if (!fieldFilters || !valueFilters) return false;

  for (const field of fieldFilters) {
    for (const value of valueFilters) {
      let fieldName = field.fieldName as keyof Selection;
      let hasEligibility = selection[fieldName] === value.value && value.active;
      if (hasEligibility) return true;
    }
  }

  return false;
};
