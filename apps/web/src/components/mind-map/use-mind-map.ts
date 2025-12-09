import { useCallback, useMemo } from "react";
import { useBehaviorSubjectValue } from "@/hooks/use-behavior-subject-value";
import { computeLayout } from "./utils/layout";
import type { MindMapStore } from "./mind-map-store";
import type { MindMapData, MindMapNode, NodeId } from "./types";

interface UseMindMapResult {
  nodes: Record<string, MindMapNode>;
  selectedId: NodeId | null;
  setSelectedId: (id: NodeId | null) => void;
  editingId: NodeId | null;
  setEditingId: (id: NodeId | null) => void;
  updateNodeText: (id: NodeId, text: string) => void;
  updateDraft: (id: NodeId, text: string | null) => void;
  addChild: (parentId: NodeId) => void;
  addSibling: (referenceId: NodeId) => void;
  deleteNode: (id: NodeId) => void;
  toggleCollapse: (id: NodeId) => void;
  updateNodePosition: (id: NodeId, x: number, y: number) => void;
  updateNodeDragPosition: (id: NodeId, x: number, y: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  data: MindMapData;
}

export const useMindMap = (store: MindMapStore): UseMindMapResult => {
  const snapshot = useBehaviorSubjectValue(store.state$);

  const layoutNodes = useMemo(() => {
    const nodes = computeLayout(snapshot.history.present, snapshot.drafts);

    // Merge drag positions
    if (Object.keys(snapshot.dragPositions).length > 0) {
      return Object.entries(nodes).reduce((acc, [id, node]) => {
        if (snapshot.dragPositions[id]) {
          acc[id] = {
            ...node,
            x: snapshot.dragPositions[id].x,
            y: snapshot.dragPositions[id].y,
          };
        } else {
          acc[id] = node;
        }
        return acc;
      }, {} as Record<string, MindMapNode>);
    }

    return nodes;
  }, [snapshot.history.present, snapshot.drafts, snapshot.dragPositions]);

  const setSelectedId = useCallback((id: NodeId | null) => {
    store.setSelectedId(id);
  }, [store]);

  const setEditingId = useCallback((id: NodeId | null) => {
    store.setEditingId(id);
  }, [store]);

  const updateNodeText = useCallback(
    (id: NodeId, text: string) => {
      store.updateNodeText(id, text);
    },
    [store],
  );

  const updateDraft = useCallback(
    (id: NodeId, text: string | null) => {
      store.updateDraft(id, text);
    },
    [store],
  );

  const addChild = useCallback(
    (parentId: NodeId) => {
      store.addChild(parentId);
    },
    [store],
  );

  const addSibling = useCallback(
    (referenceId: NodeId) => {
      store.addSibling(referenceId);
    },
    [store],
  );

  const deleteNode = useCallback(
    (id: NodeId) => {
      store.deleteNode(id);
    },
    [store],
  );

  const toggleCollapse = useCallback(
    (id: NodeId) => {
      store.toggleCollapse(id);
    },
    [store],
  );

  const updateNodePosition = useCallback(
    (id: NodeId, x: number, y: number) => {
      store.updateNodePosition(id, x, y);
    },
    [store],
  );

  const updateNodeDragPosition = useCallback(
    (id: NodeId, x: number, y: number) => {
      store.updateNodeDragPosition(id, x, y);
    },
    [store],
  );

  const undo = useCallback(() => {
    store.undo();
  }, [store]);

  const redo = useCallback(() => {
    store.redo();
  }, [store]);

  return {
    nodes: layoutNodes,
    selectedId: snapshot.selectedId,
    setSelectedId,
    editingId: snapshot.editingId,
    setEditingId,
    updateNodeText,
    updateDraft,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    updateNodePosition,
    updateNodeDragPosition,
    undo,
    redo,
    canUndo: snapshot.history.past.length > 0,
    canRedo: snapshot.history.future.length > 0,
    data: snapshot.history.present,
  };
};
