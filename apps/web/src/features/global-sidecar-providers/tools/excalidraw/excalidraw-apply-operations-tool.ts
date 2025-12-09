import { tool } from 'ai';
import { z } from 'zod';
import { t } from "@/i18n/utils";
import type {
  ExcalidrawOperation,
  ApplyOperationsResult,
} from "./types";
import {
  ensureExcalidrawAvailable,
  findNodeElementByRef,
  getElementCenter,
  computeSceneBounds,
  createRectangleAndTextNode,
  createArrowBetween,
} from "./utils";

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

export const excalidrawModifyTool = tool({
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


