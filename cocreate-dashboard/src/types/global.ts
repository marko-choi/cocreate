export interface Point {
  x: number;
  y: number;
}

export interface Selection {
  start: Point;
  end: Point;
  functionValue: 'good' | 'bad' | null;
  aestheticValue: 'good' | 'bad' | null;
  comment: string;
}

export interface TooltipProps {
  x: number;
  y: number;
  visible: boolean;
  index: number;
}

export interface Annotation {
  questionId: number;
  selections: Selection[];
  image: string; // this is in base64
  scaleFactor: number;
}