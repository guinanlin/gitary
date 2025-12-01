import type { MindMapData, MindMapNode } from "../types";
import {
  HORIZONTAL_GAP,
  MAX_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  NODE_STYLES,
  VERTICAL_SPACING,
} from "../constants";

interface LayoutNode extends MindMapNode {
  subtreeHeight: number;
}

let measureEl: HTMLDivElement | null = null;

const getMeasureElement = (): HTMLDivElement | null => {
  if (typeof document === "undefined") {
    return null;
  }
  if (!measureEl) {
    measureEl = document.createElement("div");
    measureEl.id = "mindmap-measure-el";
    Object.assign(measureEl.style, {
      position: "absolute",
      visibility: "hidden",
      top: "-9999px",
      left: "-9999px",
      width: "auto",
      height: "auto",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      overflowWrap: "break-word",
      boxSizing: "border-box",
      fontFamily: NODE_STYLES.fontFamily,
      fontSize: NODE_STYLES.fontSize,
      fontWeight: NODE_STYLES.fontWeight,
      lineHeight: NODE_STYLES.lineHeight,
      padding: NODE_STYLES.padding,
    } satisfies Partial<CSSStyleDeclaration>);

    document.body.appendChild(measureEl);
  }
  return measureEl;
};

const calculateNodeDimensions = (text: string) => {
  const element = getMeasureElement();
  if (!element) {
    return {
      width: Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, text.length * 8)),
      height: MIN_NODE_HEIGHT,
    };
  }

  element.style.maxWidth = `${MAX_NODE_WIDTH}px`;
  element.style.width = "fit-content";
  element.textContent = text || " ";

  const rect = element.getBoundingClientRect();
  const naturalWidth = rect.width + 2;
  const width = Math.max(Math.min(naturalWidth, MAX_NODE_WIDTH), MIN_NODE_WIDTH);

  element.style.width = `${width}px`;
  const height = Math.max(element.getBoundingClientRect().height, MIN_NODE_HEIGHT);

  return { width, height };
};

export const computeLayout = (
  data: MindMapData,
  drafts?: Record<string, string>,
): Record<string, MindMapNode> => {
  const nodes: Record<string, MindMapNode> = {};

  Object.values(data.nodes).forEach((node) => {
    nodes[node.id] = {
      ...node,
      x: undefined,
      y: undefined,
      width: undefined,
      height: undefined,
    };
  });

  if (drafts) {
    Object.entries(drafts).forEach(([id, text]) => {
      if (nodes[id]) {
        nodes[id] = { ...nodes[id], text };
      }
    });
  }

  const calculateHeight = (nodeId: string, depth: number): number => {
    const node = nodes[nodeId] as LayoutNode | undefined;
    if (!node) return 0;

    node.depth = depth;
    const { width, height } = calculateNodeDimensions(node.text);
    node.width = width;
    node.height = height;

    if (!node.children.length || !node.isExpanded) {
      node.subtreeHeight = height;
      return height;
    }

    let totalChildrenHeight = 0;
    node.children.forEach((childId) => {
      totalChildrenHeight += calculateHeight(childId, depth + 1);
    });
    totalChildrenHeight += (node.children.length - 1) * VERTICAL_SPACING;

    node.subtreeHeight = Math.max(height, totalChildrenHeight);
    return node.subtreeHeight;
  };

  calculateHeight(data.rootId, 0);

  const assignCoordinates = (nodeId: string, x: number, y: number) => {
    const node = nodes[nodeId] as LayoutNode | undefined;
    if (!node) return;
    node.x = x;
    node.y = y;

    if (!node.children.length || !node.isExpanded) return;

    let childrenBlockHeight = 0;
    node.children.forEach((childId) => {
      const child = nodes[childId] as LayoutNode | undefined;
      if (child) {
        childrenBlockHeight += child.subtreeHeight;
      }
    });
    childrenBlockHeight += (node.children.length - 1) * VERTICAL_SPACING;

    let currentY = y - childrenBlockHeight / 2;

    node.children.forEach((childId) => {
      const child = nodes[childId] as LayoutNode | undefined;
      if (!child) return;

      const childHeight = child.subtreeHeight;
      const childY = currentY + childHeight / 2;
      const childX = x + (node.width! / 2) + HORIZONTAL_GAP + (child.width! / 2);

      assignCoordinates(childId, childX, childY);
      currentY += childHeight + VERTICAL_SPACING;
    });
  };

  assignCoordinates(data.rootId, 0, 0);

  return nodes;
};
