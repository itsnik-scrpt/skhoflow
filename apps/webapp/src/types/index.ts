export type AppMode = 'word' | 'coding' | 'slides';

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  avatarUrl?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  mode: 'word' | 'slides' | 'ide';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  transition?: string;
  notes?: string;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style?: Record<string, string>;
  locked?: boolean;
}

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isModified?: boolean;
  path: string; // e.g. "src/utils/helper.ts"
}

export interface FolderEntry {
  id: string;
  name: string;
  path: string; // e.g. "src/utils"
  type: 'file' | 'folder';
  children?: FolderEntry[];
  fileId?: string; // if type === 'file', points to CodeFile.id
  expanded?: boolean;
}

export interface CodeProject {
  id: string;
  name: string;
  files: CodeFile[];
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  highlighted?: boolean;
}
