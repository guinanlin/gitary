import { DEFAULT_MIND_MAP_DATA } from "./constants";
import type { MindMapData, MindMapNode } from "./types";

const cloneNode = (node: MindMapNode): MindMapNode => ({
  id: node.id,
  text: node.text,
  parentId: node.parentId,
  children: [...node.children],
  isExpanded: node.isExpanded,
  depth: node.depth,
});

export const cloneMindMapData = (data: MindMapData): MindMapData => ({
  rootId: data.rootId,
  nodes: Object.fromEntries(
    Object.entries(data.nodes).map(([id, node]) => [id, cloneNode(node)]),
  ),
});

export const buildMindMapSnapshot = (data: MindMapData): string =>
  JSON.stringify(data);

export const normalizeMindMapData = (value: unknown): MindMapData => {
  if (
    !value ||
    typeof value !== "object" ||
    !("rootId" in value) ||
    !("nodes" in value)
  ) {
    return cloneMindMapData(DEFAULT_MIND_MAP_DATA);
  }

  const parsed = value as Partial<MindMapData>;
  const rootId =
    typeof parsed.rootId === "string" ? parsed.rootId : DEFAULT_MIND_MAP_DATA.rootId;
  const nodesInput = parsed.nodes ?? {};

  if (!nodesInput[rootId]) {
    return cloneMindMapData(DEFAULT_MIND_MAP_DATA);
  }

  const normalizedNodes: Record<string, MindMapNode> = {};
  for (const [id, node] of Object.entries(nodesInput)) {
    if (!node || typeof node !== "object") continue;
    const { text, parentId, children, isExpanded, depth } = node as MindMapNode;
    normalizedNodes[id] = {
      id,
      text: typeof text === "string" ? text : "",
      parentId: typeof parentId === "string" || parentId === null ? parentId : null,
      children: Array.isArray(children)
        ? children.filter((childId): childId is string => typeof childId === "string")
        : [],
      isExpanded: typeof isExpanded === "boolean" ? isExpanded : true,
      depth: typeof depth === "number" ? depth : 0,
    };
  }

  if (!normalizedNodes[rootId]) {
    return cloneMindMapData(DEFAULT_MIND_MAP_DATA);
  }

  return cloneMindMapData({
    rootId,
    nodes: normalizedNodes,
  });
};
