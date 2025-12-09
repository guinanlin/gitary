import type { MindMapData } from "./types";

export const MAX_NODE_WIDTH = 400;
export const MIN_NODE_WIDTH = 50;
export const MIN_NODE_HEIGHT = 40;
export const HORIZONTAL_GAP = 60;
export const VERTICAL_SPACING = 20;

export const NODE_STYLES = {
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  fontSize: "14px",
  fontWeight: "500",
  lineHeight: "1.5",
  padding: "8px 12px",
} as const;

export const DEFAULT_MIND_MAP_DATA: MindMapData = {
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      text: "Root",
      parentId: null,
      children: [],
      isExpanded: true,
      depth: 0,
    },
  },
};
