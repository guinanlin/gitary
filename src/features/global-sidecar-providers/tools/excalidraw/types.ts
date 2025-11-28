import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

export type ExcalidrawElement = NonNullable<
  ExcalidrawInitialDataState["elements"]
>[number];

export interface ExcalidrawSummaryNode {
  id: string;
  label: string;
  kind?: string;
  position?: { x: number; y: number };
}

export interface ExcalidrawSummaryEdge {
  id: string;
  from: string;
  to: string;
}

export interface ExcalidrawSummaryResult {
  nodeCount: number;
  edgeCount: number;
  nodes: ExcalidrawSummaryNode[];
  edges: ExcalidrawSummaryEdge[];
}

export type ExcalidrawOperation = {
  op: "add_node" | "connect" | "rename_node" | "delete_node";
  id?: string;
  label?: string;
  kind?: string;
  near?: string;
  from?: string;
  to?: string;
  target?: string;
  newLabel?: string;
};

export interface ApplyOperationsResult {
  applied: number;
  failed: { index: number; op: string; reason: string }[];
}

