export type AppMode = 'word' | 'coding' | 'powerpoint';

export interface Document {
  id: string;
  title: string;
  content: string;
  mode: 'word' | 'powerpoint';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  projectId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'student' | 'teacher' | 'enterprise';
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  transition?: string;
}

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
