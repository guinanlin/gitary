import { Theme, ThemeId, SlideLayout } from './types';

export const THEMES: Record<ThemeId, Theme> = {
  [ThemeId.MODERN_DARK]: {
    id: ThemeId.MODERN_DARK,
    name: 'Modern Dark',
    bg: 'bg-gray-900',
    text: 'text-white',
    accent: 'text-blue-400',
    secondaryBg: 'bg-gray-800',
    fontHeading: 'font-sans',
    fontBody: 'font-sans'
  },
  [ThemeId.MINIMAL_LIGHT]: {
    id: ThemeId.MINIMAL_LIGHT,
    name: 'Minimal Light',
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'text-emerald-600',
    secondaryBg: 'bg-gray-50',
    fontHeading: 'font-serif',
    fontBody: 'font-sans'
  },
  [ThemeId.CORPORATE_BLUE]: {
    id: ThemeId.CORPORATE_BLUE,
    name: 'Corporate Blue',
    bg: 'bg-slate-50',
    text: 'text-slate-900',
    accent: 'text-blue-700',
    secondaryBg: 'bg-white',
    fontHeading: 'font-sans font-bold',
    fontBody: 'font-sans'
  },
  [ThemeId.CREATIVE_VIBRANT]: {
    id: ThemeId.CREATIVE_VIBRANT,
    name: 'Creative Vibrant',
    bg: 'bg-indigo-900',
    text: 'text-yellow-50',
    accent: 'text-pink-400',
    secondaryBg: 'bg-indigo-800',
    fontHeading: 'font-mono',
    fontBody: 'font-sans'
  }
};

export const INITIAL_MARKDOWN = `# 项目演示

## 执行摘要
*   项目概述
*   关键里程碑
*   战略路线图

## Market Analysis
*   Growing demand for multimodal models
*   Competitor landscape analysis
*   User adoption trends in enterprise

## Technical Architecture
*   Natively multimodal from the ground up
*   Efficient scaling with TPU v5p
*   Safety and alignment protocols`;

export const INITIAL_PRESENTATION = {
  title: "",
  slides: [
    {
      id: "init-1",
      layout: SlideLayout.TITLE,
      title: "",
      subtitle: "",
      content: [],
      speakerNotes: ""
    },
    {
      id: "init-2",
      layout: SlideLayout.BULLET_LIST,
      title: "",
      content: [],
      speakerNotes: ""
    }
  ]
};

