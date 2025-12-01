import { BehaviorSubject, type Observable } from "rxjs";
import { map } from "rxjs/operators";
import { DEFAULT_MIND_MAP_DATA } from "./constants";
import { cloneMindMapData } from "./data-helpers";
import type {
  HistoryState,
  MindMapData,
  MindMapNode,
  NodeId,
} from "./types";

interface MindMapStoreSnapshot {
  history: HistoryState;
  drafts: Record<NodeId, string>;
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
    const snapshot = this.getCurrentState();
    const nodes = { ...snapshot.history.present.nodes };
    if (!nodes[id]) return;
    nodes[id] = { ...nodes[id], isExpanded: !nodes[id].isExpanded };
    this.emitWithHistory({
      ...snapshot.history.present,
      nodes,
    });
  };

  addChild = (parentId: NodeId) => {
    const snapshot = this.getCurrentState();
    const parent = snapshot.history.present.nodes[parentId];
    if (!parent) return;
    const id = `node-${Date.now()}`;
    const newNode: MindMapNode = {
      id,
      text: "New Idea",
      parentId,
      children: [],
      isExpanded: true,
    };
    const nodes = { ...snapshot.history.present.nodes };
    nodes[id] = newNode;
    nodes[parentId] = {
      ...parent,
      children: [...parent.children, id],
      isExpanded: true,
    };
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
