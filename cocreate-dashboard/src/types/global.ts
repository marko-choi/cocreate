export interface Point {
  x: number;
  y: number;
}

export interface Selection {
  uid: string;
  start: Point;
  end: Point;
  functionValue: 'good' | 'bad' | null;
  aestheticValue: 'good' | 'bad' | null;
  comment: string;
  show?: boolean;
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
  imagePath: string;
  scaleFactor: number;
}