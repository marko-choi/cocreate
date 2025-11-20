export interface Point {
  x: number;
  y: number;
}

export interface FeedbackConfig {
  showFunctionValue: boolean;
  showAestheticValue: boolean;
  showComment: boolean;
}

export interface Selection {
  start: Point;
  end: Point;
  functionValue: string | null;
  aestheticValue: string | null;
  comment: string;
}

// Mobile-specific: Circular selection for touch interfaces
export interface CircularSelection {
  center: Point;
  radius: number;
  functionValue?: string;
  comment?: string;
}

// Union type for both desktop rectangles and mobile circles
export type SelectionType = Selection | CircularSelection;

// Type guard to check if a selection is circular (mobile)
export function isCircularSelection(
  selection: SelectionType
): selection is CircularSelection {
  return 'radius' in selection && 'center' in selection;
}

export interface TooltipProps {
  x: number;
  y: number;
  visible: boolean;
  index: number;
}