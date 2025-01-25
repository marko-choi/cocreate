export interface Point {
  x: number;
  y: number;
}

export interface Selection {
  start: Point;
  end: Point;
  functionValue: number | null;
  aestheticValue: number | null;
  comment: string;
}

export interface TooltipProps {
  x: number;
  y: number;
  visible: boolean;
  index: number;
}