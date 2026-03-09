export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style?: Record<string, string>;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  transition?: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
