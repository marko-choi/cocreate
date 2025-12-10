import { Selection } from "@/types/global";

export const isSelectionContained = (outer: Selection, inner: Selection): boolean => {
  return (
    inner.start.x >= outer.start.x &&
    inner.start.y >= outer.start.y &&
    inner.end.x <= outer.end.x &&
    inner.end.y <= outer.end.y
  );
};

export const getContainedSelections = (container: Selection, selections: Selection[]): Selection[] => {
  return selections.filter(selection => isSelectionContained(container, selection));
};