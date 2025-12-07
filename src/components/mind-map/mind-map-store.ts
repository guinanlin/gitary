import { BehaviorSubject, type Observable } from "rxjs";
import { map } from "rxjs/operators";
import { DEFAULT_MIND_MAP_DATA, HORIZONTAL_GAP, MIN_NODE_HEIGHT, MIN_NODE_WIDTH, VERTICAL_SPACING } from "./constants";
import { cloneMindMapData } from "./data-helpers";
import { computeLayout } from "./utils/layout";
import type {
  HistoryState,
  MindMapData,
  MindMapNode,
  NodeId,
} from "./types";

interface MindMapStoreSnapshot {
  history: HistoryState;
  drafts: Record<NodeId, string>;
  dragPositions: Record<NodeId, { x: number; y: number }>;
  selectedId: NodeId | null;
  editingId: NodeId | null;
}

const createHistory = (data: MindMapData): HistoryState => ({
  past: [],
  present: cloneMindMapData(data),
  future: [],
});

const createSnapshot = (data: MindMapData): MindMapStoreSnapshot => ({
  history: createHistory(data),
  drafts: {},
  dragPositions: {},
  selectedId: data.rootId,
  editingId: null,
});

const pushHistory = (
  snapshot: MindMapStoreSnapshot,
  nextData: MindMapData,
): HistoryState => ({
  past: [...snapshot.history.past, snapshot.history.present],
  present: cloneMindMapData(nextData),
  future: [],
});

export class MindMapStore {
  private readonly subject: BehaviorSubject<MindMapStoreSnapshot>;
  readonly data$: Observable<MindMapData>;

  constructor(initialData: MindMapData = DEFAULT_MIND_MAP_DATA) {
    this.subject = new BehaviorSubject(createSnapshot(initialData));
    this.data$ = this.subject.asObservable().pipe(
      map((snapshot) => snapshot.history.present),
    );
  }

  get state$(): BehaviorSubject<MindMapStoreSnapshot> {
    return this.subject;
  }

  getCurrentState(): MindMapStoreSnapshot {
    return this.subject.getValue();
  }

  getCurrentData(): MindMapData {
    return this.subject.getValue().history.present;
  }

  replaceData(data: MindMapData) {
    this.subject.next(createSnapshot(data));
  }

  setSelectedId = (id: NodeId | null) => {
    const snapshot = this.getCurrentState();
    this.subject.next({ ...snapshot, selectedId: id });
  };

  setEditingId = (id: NodeId | null) => {
    const snapshot = this.getCurrentState();
    this.subject.next({ ...snapshot, editingId: id });
  };

  updateDraft = (id: NodeId, text: string | null) => {
    const snapshot = this.getCurrentState();
    const drafts = { ...snapshot.drafts };
    if (text === null) {
      delete drafts[id];
    } else {
      drafts[id] = text;
    }
    this.subject.next({ ...snapshot, drafts });
  };

  updateNodeDragPosition = (id: NodeId, x: number, y: number) => {
    const snapshot = this.getCurrentState();
    const dragPositions = { ...snapshot.dragPositions };
    dragPositions[id] = { x, y };
    this.subject.next({ ...snapshot, dragPositions });
  };

  private emitWithHistory(nextData: MindMapData) {
    const snapshot = this.getCurrentState();
    this.subject.next({
      ...snapshot,
      history: pushHistory(snapshot, nextData),
    });
  }

  updateNodeText = (id: NodeId, text: string) => {
    const snapshot = this.getCurrentState();
    const nodes = { ...snapshot.history.present.nodes };
    if (!nodes[id]) return;
    nodes[id] = { ...nodes[id], text };
    this.emitWithHistory({
      ...snapshot.history.present,
      nodes,
    });
  };

  toggleCollapse = (id: NodeId) => {
    console.log("[MindMapStore] toggleCollapse", { id });
    const snapshot = this.getCurrentState();
    const nodes = { ...snapshot.history.present.nodes };
    if (!nodes[id]) return;

    const nextExpanded = !nodes[id].isExpanded;
    nodes[id] = { ...nodes[id], isExpanded: nextExpanded };

    if (!nextExpanded) {
      const stack = [...nodes[id].children];
      while (stack.length) {
        const childId = stack.pop()!;
        const child = nodes[childId];
        if (!child) continue;
        nodes[childId] = { ...child, isExpanded: false };
        stack.push(...child.children);
      }
    }

    this.emitWithHistory({
      ...snapshot.history.present,
      nodes,
    });
  };

  updateNodePosition = (id: NodeId, x: number, y: number) => {
    const snapshot = this.getCurrentState();
    const nodes = { ...snapshot.history.present.nodes };
    if (!nodes[id]) return;
    nodes[id] = { ...nodes[id], manualX: x, manualY: y };

    // Clear drag position when committing the final position
    const dragPositions = { ...snapshot.dragPositions };
    delete dragPositions[id];

    this.subject.next({
      ...snapshot,
      dragPositions,
      history: pushHistory(snapshot, {
        ...snapshot.history.present,
        nodes,
      }),
    });
  };

  addChild = (parentId: NodeId) => {
    const snapshot = this.getCurrentState();
    const parent = snapshot.history.present.nodes[parentId];
    if (!parent) return;
    
    const currentLayout = computeLayout(snapshot.history.present, snapshot.drafts);
    const parentLayoutNode = currentLayout[parentId];
    
    const id = `node-${Date.now()}`;
    const newNode: MindMapNode = {
      id,
      text: "New Idea",
      parentId,
      children: [],
      isExpanded: true,
    };
    
    let newNodeManualX: number | undefined;
    let newNodeManualY: number | undefined;

    if (parentLayoutNode) {
      const parentWidth = parentLayoutNode.width ?? MIN_NODE_WIDTH;
      const siblingLayouts = parent.children
        .map((childId) => currentLayout[childId])
        .filter((child): child is MindMapNode => !!child && child.x !== undefined && child.y !== undefined);

      const rightX =
        (parentLayoutNode.x ?? 0) +
        parentWidth / 2 +
        HORIZONTAL_GAP +
        (MIN_NODE_WIDTH / 2);

      const lastSibling = siblingLayouts.at(-1);
      if (lastSibling && lastSibling.y !== undefined) {
        const lastSiblingHeight = lastSibling.height ?? MIN_NODE_HEIGHT;
        newNodeManualY = lastSibling.y + lastSiblingHeight / 2 + VERTICAL_SPACING + MIN_NODE_HEIGHT / 2;
      } else {
        newNodeManualY = parentLayoutNode.y ?? 0;
      }

      newNodeManualX = rightX;
    }

    const nodes = { ...snapshot.history.present.nodes };
    nodes[id] = {
      ...newNode,
      manualX: newNodeManualX,
      manualY: newNodeManualY,
    };
    
    const updatedParent: MindMapNode = {
      ...parent,
      children: [...parent.children, id],
      isExpanded: true,
    };
    
    if (parentLayoutNode && parentLayoutNode.x !== undefined && parentLayoutNode.y !== undefined) {
      if (parent.manualX === undefined && parent.manualY === undefined) {
        updatedParent.manualX = parentLayoutNode.x;
        updatedParent.manualY = parentLayoutNode.y;
      } else {
        updatedParent.manualX = parent.manualX;
        updatedParent.manualY = parent.manualY;
      }
    }
    
    nodes[parentId] = updatedParent;
    
    this.subject.next({
      ...snapshot,
      history: pushHistory(snapshot, {
        ...snapshot.history.present,
        nodes,
      }),
      selectedId: id,
      editingId: id,
    });
  };

  addSibling = (referenceId: NodeId) => {
    const snapshot = this.getCurrentState();
    const refNode = snapshot.history.present.nodes[referenceId];
    if (!refNode || !refNode.parentId) return;
    const parent = snapshot.history.present.nodes[refNode.parentId];
    if (!parent) return;
    const id = `node-${Date.now()}`;
    const newNode: MindMapNode = {
      id,
      text: "New Idea",
      parentId: refNode.parentId,
      children: [],
      isExpanded: true,
    };
    const nodes = { ...snapshot.history.present.nodes };
    nodes[id] = newNode;
    const siblings = [...parent.children];
    const index = siblings.indexOf(referenceId);
    siblings.splice(index + 1, 0, id);
    nodes[parent.id] = { ...parent, children: siblings };
    this.subject.next({
      ...snapshot,
      history: pushHistory(snapshot, {
        ...snapshot.history.present,
        nodes,
      }),
      selectedId: id,
      editingId: id,
    });
  };

  deleteNode = (id: NodeId) => {
    const snapshot = this.getCurrentState();
    const node = snapshot.history.present.nodes[id];
    if (!node || !node.parentId) return;
    const nodes = { ...snapshot.history.present.nodes };

    const removeRecursively = (nodeId: NodeId) => {
      const current = nodes[nodeId];
      if (!current) return;
      current.children.forEach(removeRecursively);
      delete nodes[nodeId];
    };

    removeRecursively(id);

    nodes[node.parentId] = {
      ...nodes[node.parentId],
      children: nodes[node.parentId].children.filter((childId) => childId !== id),
    };

    this.subject.next({
      ...snapshot,
      history: pushHistory(snapshot, {
        ...snapshot.history.present,
        nodes,
      }),
      selectedId: node.parentId,
    });
  };

  undo = () => {
    const snapshot = this.getCurrentState();
    if (!snapshot.history.past.length) return;
    const previous = snapshot.history.past[snapshot.history.past.length - 1];
    const newPast = snapshot.history.past.slice(0, -1);
    this.subject.next({
      ...snapshot,
      history: {
        past: newPast,
        present: previous,
        future: [snapshot.history.present, ...snapshot.history.future],
      },
    });
  };

  redo = () => {
    const snapshot = this.getCurrentState();
    if (!snapshot.history.future.length) return;
    const [next, ...rest] = snapshot.history.future;
    this.subject.next({
      ...snapshot,
      history: {
        past: [...snapshot.history.past, snapshot.history.present],
        present: next,
        future: rest,
      },
    });
  };

  canUndo(): boolean {
    return this.subject.getValue().history.past.length > 0;
  }

  canRedo(): boolean {
    return this.subject.getValue().history.future.length > 0;
  }
}
