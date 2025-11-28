import type { Tool } from "@agent-labs/agent-chat";
import { t } from "@/i18n/utils";
import type {
  ExcalidrawSummaryNode,
  ExcalidrawSummaryEdge,
  ExcalidrawSummaryResult,
} from "./types";
import {
  ensureExcalidrawAvailable,
  inferKindFromLabel,
  getElementCenter,
  getArrowEndpoints,
  distanceSq,
} from "./utils";

export const excalidrawAnalyzeTool: Tool<
  { maxNodes?: number },
  ExcalidrawSummaryResult
> = {
  name: "excalidraw_analyze",
  description: t("excalidraw.tools.getSummaryDescription"),
  parameters: {
    type: "object",
    properties: {
      maxNodes: {
        type: "number",
        description: t("excalidraw.tools.getSummaryMaxNodesDescription"),
      },
    },
    required: [],
    additionalProperties: false,
  },
  async execute(args) {
    const { elements } = ensureExcalidrawAvailable();
    const maxNodes =
      typeof args?.maxNodes === "number" && args.maxNodes > 0
        ? args.maxNodes
        : undefined;

    const nodes: ExcalidrawSummaryNode[] = [];

    for (const el of elements) {
      const anyEl = el as Record<string, unknown>;
      if (anyEl.type === "text" && typeof anyEl.text === "string") {
        const label = (anyEl.text as string).trim();
        if (!label) continue;
        const center = getElementCenter(el);
        nodes.push({
          id: el.id,
          label,
          kind: inferKindFromLabel(label),
          position: center,
        });
      }
    }

    const nodeLimit = maxNodes ?? nodes.length;
    const limitedNodes = nodes.slice(0, nodeLimit);

    const nodeById = new Map<string, ExcalidrawSummaryNode>();
    for (const n of nodes) {
      nodeById.set(n.id, n);
    }

    const edges: ExcalidrawSummaryEdge[] = [];
    for (const el of elements) {
      const anyEl = el as Record<string, unknown>;
      if (anyEl.type !== "arrow") continue;

      let fromId: string | null = null;
      let toId: string | null = null;

      const startBinding = anyEl.startBinding as { elementId?: string } | undefined;
      const endBinding = anyEl.endBinding as { elementId?: string } | undefined;

      if (
        startBinding?.elementId &&
        endBinding?.elementId &&
        typeof startBinding.elementId === "string" &&
        typeof endBinding.elementId === "string"
      ) {
        fromId = startBinding.elementId;
        toId = endBinding.elementId;
      } else {
        const { start, end } = getArrowEndpoints(el);
        let bestFrom: { id: string; dist: number } | null = null;
        let bestTo: { id: string; dist: number } | null = null;
        for (const n of nodes) {
          if (!n.position) continue;
          const dStart = distanceSq(start, n.position);
          const dEnd = distanceSq(end, n.position);
          if (!bestFrom || dStart < bestFrom.dist) {
            bestFrom = { id: n.id, dist: dStart };
          }
          if (!bestTo || dEnd < bestTo.dist) {
            bestTo = { id: n.id, dist: dEnd };
          }
        }
        fromId = bestFrom?.id ?? null;
        toId = bestTo?.id ?? null;
      }

      if (!fromId || !toId || fromId === toId) continue;
      if (!nodeById.has(fromId) || !nodeById.has(toId)) continue;

      edges.push({
        id: el.id,
        from: fromId,
        to: toId,
      });
    }

    const edgeLimit = nodeLimit * 4;
    const limitedEdges = edges.slice(0, edgeLimit);

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes: limitedNodes,
      edges: limitedEdges,
    };
  },
};

