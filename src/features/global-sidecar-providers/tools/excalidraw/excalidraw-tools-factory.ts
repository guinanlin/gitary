import { tool } from 'ai';
import { z } from 'zod';
import { t } from "@/i18n/utils";
import { excalidrawAIService } from "@/services/ai/excalidraw-ai.service";
import { ensureExcalidrawAvailable } from "./utils";
import { validateAndCompleteElements } from "./element-validator";
import type { IToolContext } from "@dty/ai-assistant-core";
import type {
  ExcalidrawSummaryNode,
  ExcalidrawSummaryEdge,
  ExcalidrawSummaryResult,
  ExcalidrawOperation,
  ApplyOperationsResult,
} from "./types";
import {
  inferKindFromLabel,
  getElementCenter,
  getArrowEndpoints,
  distanceSq,
  findNodeElementByRef,
  computeSceneBounds,
  createRectangleAndTextNode,
  createArrowBetween,
} from "./utils";

export function createExcalidrawAnalyzeTool(context: IToolContext) {
  return tool({
    description: t("excalidraw.tools.getSummaryDescription"),
    inputSchema: z.object({
      maxNodes: z.number().optional().describe(
        t("excalidraw.tools.getSummaryMaxNodesDescription")
      ),
    }),
    execute: async (args: { maxNodes?: number }): Promise<ExcalidrawSummaryResult> => {
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
  });
}

export function createExcalidrawAIGenerateDiagramTool(context: IToolContext) {
  return tool({
    description: t("excalidraw.tools.generateDiagramDescription"),
    inputSchema: z.object({
      prompt: z.string().describe(
        t("excalidraw.tools.generateDiagramPromptDescription")
      ),
      mode: z.enum(["append", "replace"]).optional().default("append").describe(
        t("excalidraw.tools.generateDiagramModeDescription")
      ),
    }),
    execute: async (args: { prompt: string; mode?: "append" | "replace" }): Promise<{ insertedCount: number; mode: "append" | "replace" }> => {
      const { handle, elements: currentElements } = ensureExcalidrawAvailable();
      const prompt = (args?.prompt ?? "").trim();
      const mode: "append" | "replace" =
        args?.mode === "replace" ? "replace" : "append";

      if (!prompt) {
        throw new Error(t("excalidraw.tools.promptRequired"));
      }

      const newElements = await excalidrawAIService.generateDiagram(prompt);
      const combined =
        mode === "append"
          ? [...currentElements, ...newElements]
          : [...newElements];

      handle.updateScene({ elements: combined });

      return {
        insertedCount: newElements.length,
        mode,
      };
    },
  });
}

export function createExcalidrawAIAppendDiagramTool(context: IToolContext) {
  return tool({
    description: t("excalidraw.tools.aiAppendDiagramDescription"),
    inputSchema: z.object({
      prompt: z.string().describe(
        t("excalidraw.tools.aiAppendDiagramPromptDescription")
      ),
    }),
    execute: async (args: { prompt: string }): Promise<{ insertedCount: number }> => {
      const { handle, elements: currentElements } = ensureExcalidrawAvailable();
      const prompt = (args?.prompt ?? "").trim();

      if (!prompt) {
        throw new Error(t("excalidraw.tools.promptRequired"));
      }

      const newElements = await excalidrawAIService.generateDiagram(prompt);
      const combined = [...currentElements, ...newElements];

      handle.updateScene({ elements: combined });

      return {
        insertedCount: newElements.length,
      };
    },
  });
}

export function createExcalidrawCreateDiagramTool(context: IToolContext) {
  return tool({
    description: t("excalidraw.tools.createDiagramDescription"),
    inputSchema: z.object({
      elements: z.array(z.any()).describe(
        t("excalidraw.tools.createDiagramElementsDescription")
      ),
      mode: z.enum(["append", "replace"]).optional().default("append").describe(
        t("excalidraw.tools.createDiagramModeDescription")
      ),
    }),
    execute: async (args: { elements: unknown[]; mode?: "append" | "replace" }): Promise<{ insertedCount: number; mode: "append" | "replace" }> => {
      const { handle, elements: currentElements } = ensureExcalidrawAvailable();
      const elements = args?.elements ?? [];
      const mode: "append" | "replace" =
        args?.mode === "replace" ? "replace" : "append";

      if (!Array.isArray(elements) || elements.length === 0) {
        throw new Error(t("excalidraw.tools.elementsRequired"));
      }

      const validatedElements = validateAndCompleteElements(elements);
      const combined =
        mode === "append"
          ? [...currentElements, ...validatedElements]
          : [...validatedElements];

      handle.updateScene({ elements: combined });

      return {
        insertedCount: validatedElements.length,
        mode,
      };
    },
  });
}

export function createExcalidrawAppendDiagramTool(context: IToolContext) {
  return tool({
    description: t("excalidraw.tools.appendDiagramDescription"),
    inputSchema: z.object({
      elements: z.array(z.any()).describe(
        t("excalidraw.tools.appendDiagramElementsDescription")
      ),
    }),
    execute: async (args: { elements: unknown[] }): Promise<{ insertedCount: number }> => {
      const { handle, elements: currentElements } = ensureExcalidrawAvailable();
      const elements = args?.elements ?? [];

      if (!Array.isArray(elements) || elements.length === 0) {
        throw new Error(t("excalidraw.tools.elementsRequired"));
      }

      const validatedElements = validateAndCompleteElements(elements);
      const combined = [...currentElements, ...validatedElements];

      handle.updateScene({ elements: combined });

      return {
        insertedCount: validatedElements.length,
      };
    },
  });
}

const ExcalidrawOperationSchema = z.object({
  op: z.enum(["add_node", "connect", "rename_node", "delete_node"]).describe(
    t("excalidraw.tools.applyOperationsOpDescription")
  ),
  id: z.string().optional().describe(
    t("excalidraw.tools.applyOperationsIdDescription")
  ),
  label: z.string().optional().describe(
    t("excalidraw.tools.applyOperationsLabelDescription")
  ),
  kind: z.string().optional().describe(
    t("excalidraw.tools.applyOperationsKindDescription")
  ),
  near: z.string().optional().describe(
    t("excalidraw.tools.applyOperationsNearDescription")
  ),
  from: z.string().optional().describe(
    t("excalidraw.tools.applyOperationsFromDescription")
  ),
  to: z.string().optional().describe(
    t("excalidraw.tools.applyOperationsToDescription")
  ),
  target: z.string().optional().describe(
    t("excalidraw.tools.applyOperationsTargetDescription")
  ),
  newLabel: z.string().optional().describe(
    t("excalidraw.tools.applyOperationsNewLabelDescription")
  ),
});

export function createExcalidrawModifyTool(context: IToolContext) {
  return tool({
    description: t("excalidraw.tools.applyOperationsDescription"),
    inputSchema: z.object({
      operations: z.array(ExcalidrawOperationSchema).describe(
        t("excalidraw.tools.applyOperationsOperationsDescription")
      ),
    }),
    execute: async (args: { operations: ExcalidrawOperation[] }): Promise<ApplyOperationsResult> => {
      const { handle, elements: initialElements } = ensureExcalidrawAvailable();
      const operations = args?.operations ?? [];
      if (!operations.length) {
        throw new Error(t("excalidraw.tools.operationsRequired"));
      }

      let elements = [...initialElements];
      const failed: { index: number; op: string; reason: string }[] = [];
      let applied = 0;

      const bounds = computeSceneBounds(elements);
      const defaultCenter = bounds
        ? {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2,
          }
        : { x: 0, y: 0 };

      const addFailure = (index: number, op: ExcalidrawOperation, reason: string) => {
        failed.push({ index, op: op.op, reason });
      };

      operations.forEach((op, index) => {
        if (!op || typeof op.op !== "string") {
          addFailure(index, { op: "add_node" }, t("excalidraw.tools.invalidOperation"));
          return;
        }

        if (op.op === "add_node") {
          const label = (op.label ?? "").trim();
          if (!label) {
            addFailure(index, op, t("excalidraw.tools.addNodeLabelRequired"));
            return;
          }

          const baseId =
            (op.id && op.id.trim()) ||
            `node-${Date.now()}-${index}-${Math.floor(Math.random() * 1e4)}`;

          let center = defaultCenter;
          if (op.near) {
            const nearEl = findNodeElementByRef(elements, op.near);
            if (nearEl) {
              const nearCenter = getElementCenter(nearEl);
              center = { x: nearCenter.x + 220, y: nearCenter.y };
            }
          } else if (bounds) {
            center = { x: bounds.maxX + 220, y: defaultCenter.y };
          }

          const newEls = createRectangleAndTextNode({
            baseId,
            label,
            center,
          });

          elements = [...elements, ...newEls];
          applied += 1;
          return;
        }

        if (op.op === "connect") {
          const fromRef = (op.from ?? "").trim();
          const toRef = (op.to ?? "").trim();
          if (!fromRef || !toRef) {
            addFailure(index, op, t("excalidraw.tools.connectFromToRequired"));
            return;
          }
          const fromEl = findNodeElementByRef(elements, fromRef);
          const toEl = findNodeElementByRef(elements, toRef);
          if (!fromEl || !toEl) {
            addFailure(
              index,
              op,
              t("excalidraw.tools.connectNodeNotFound")
            );
            return;
          }

          const arrow = createArrowBetween(fromEl, toEl);
          elements = [...elements, arrow];
          applied += 1;
          return;
        }

        if (op.op === "rename_node") {
          const targetRef = (op.target ?? "").trim();
          const newLabel = (op.newLabel ?? "").trim();
          if (!targetRef || !newLabel) {
            addFailure(index, op, t("excalidraw.tools.renameTargetLabelRequired"));
            return;
          }
          const nodeEl = findNodeElementByRef(elements, targetRef);
          if (!nodeEl) {
            addFailure(
              index,
              op,
              t("excalidraw.tools.renameNodeNotFound")
            );
            return;
          }

          const anyNode = nodeEl as Record<string, unknown>;
          if (anyNode.type === "text") {
            anyNode.text = newLabel;
            anyNode.originalText = newLabel;
            anyNode.updated = Date.now();
            applied += 1;
          } else {
            addFailure(
              index,
              op,
              t("excalidraw.tools.renameOnlyTextNode")
            );
          }
          return;
        }

        if (op.op === "delete_node") {
          const targetRef = (op.target ?? "").trim();
          if (!targetRef) {
            addFailure(index, op, t("excalidraw.tools.deleteTargetRequired"));
            return;
          }
          const nodeEl = findNodeElementByRef(elements, targetRef);
          if (!nodeEl) {
            addFailure(
              index,
              op,
              t("excalidraw.tools.deleteNodeNotFound")
            );
            return;
          }

          const idsToRemove = new Set<string>();
          idsToRemove.add(nodeEl.id);
          const anyNode = nodeEl as Record<string, unknown>;
          if (anyNode.type === "text" && typeof anyNode.containerId === "string") {
            idsToRemove.add(anyNode.containerId);
          }

          elements = elements.filter((el) => !idsToRemove.has(el.id));
          applied += 1;
          return;
        }

        addFailure(index, op, t("excalidraw.tools.unknownOperationType", { type: op.op }));
      });

      handle.updateScene({ elements });

      return {
        applied,
        failed,
      };
    },
  });
}

