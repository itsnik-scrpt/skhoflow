export const APP_NAME = 'SkhoFlow';

export const MODES = {
  WORD: 'word' as const,
  CODING: 'coding' as const,
  POWERPOINT: 'powerpoint' as const,
};

export const COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
};

export const ANIMATION_DURATION = {
  FAST: 0.15,
  NORMAL: 0.3,
  SLOW: 0.5,
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
