export interface Point {
  x: number;
  y: number;
}

export interface FeedbackConfig {
  functionality: boolean;
  aesthetics: boolean;
  comments: boolean;
}

export interface Selection {
  start: Point;
  end: Point;
  functionValue: string | null;
  aestheticValue: string | null;
  comment: string;
}

export interface TooltipProps {
  x: number;
  y: number;
  visible: boolean;
  index: number;
}