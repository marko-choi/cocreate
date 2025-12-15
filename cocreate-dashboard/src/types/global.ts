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

export interface SelectionDto {
  start: Point;
  end: Point;
  unscaledStart?: Point;
  unscaledEnd?: Point;
  functionValue: 'good' | 'bad' | '';
  aestheticValue: 'good' | 'bad' | '';
  comment: string;
}

export interface TooltipProps {
  x: number;
  y: number;
  visible: boolean;
  index: number;
}

export interface Annotation {
  imageName: string;
  questionId: number;
  selections: Selection[];
  image: string; // this is in base64
  imagePath: string;
  scaleFactor: number;
  width?: number;
  height?: number;
  show?: boolean;
  demographics?: Record<string, string>;
}

export interface AnnotationsDto {

  // Qualtrics Metadata
  StartDate?: string;
  EndDate?: string;
  Status?: string;
  Progress?: string;
  RecordedDate?: string;
  ResponseId?: string;

  // Cocreate Data
  questionId: string;
  selectionsData: string;
  image: string;
  metadata: string;

  // Dynamic Demographic Fields
  [key: string]: string | undefined;
}

export interface ExecutiveSummaryJson {
  summary: string;
  analysis: string[];
  strengths: string;
  improvements: string;
}
