export enum SlideLayout {
  TITLE = 'TITLE',
  BULLET_LIST = 'BULLET_LIST',
  TWO_COLUMN = 'TWO_COLUMN',
  QUOTE = 'QUOTE',
  BIG_NUMBER = 'BIG_NUMBER'
}

export interface SlideContent {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  content: string[];
  contentRight?: string[];
  footer?: string;
  speakerNotes?: string;
}

export interface PresentationData {
  title: string;
  slides: SlideContent[];
}

export enum ThemeId {
  MODERN_DARK = 'MODERN_DARK',
  MINIMAL_LIGHT = 'MINIMAL_LIGHT',
  CORPORATE_BLUE = 'CORPORATE_BLUE',
  CREATIVE_VIBRANT = 'CREATIVE_VIBRANT'
}

export interface Theme {
  id: ThemeId;
  name: string;
  bg: string;
  text: string;
  accent: string;
  secondaryBg: string;
  fontHeading: string;
  fontBody: string;
}

export interface GenerationParams {
  markdown: string;
  theme: ThemeId;
  audience: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}


