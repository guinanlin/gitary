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
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  data: MindMapData;
}

export const useMindMap = (store: MindMapStore): UseMindMapResult => {
  const snapshot = useBehaviorSubjectValue(store.state$);

  const layoutNodes = useMemo(
    () => computeLayout(snapshot.history.present, snapshot.drafts),
    [snapshot.history.present, snapshot.drafts],
  );

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
    undo,
    redo,
    canUndo: snapshot.history.past.length > 0,
    canRedo: snapshot.history.future.length > 0,
    data: snapshot.history.present,
  };
};
