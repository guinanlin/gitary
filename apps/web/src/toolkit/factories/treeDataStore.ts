import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";

export type PersistConfig = {
  name: string;
  type: "LocalStorage";
  transforms?: any[];
};

export type TreeDataNode<T=any> = T & {
  children?: TreeDataNode<T>[];
  id: string;
};

type TreeDataAction<T> = {
  type: string;
  payload?: {
    node?: TreeDataNode<T>;
    id?: string;
    parentId?: string;
  };
};

type TreeDataObserver<T> = (action: TreeDataAction<T>) => void;

export const createTreeDataStore = <T extends { [k: string]: any }>({
  name = "treeData",
  initialState,
  primaryKey = "id",
  persistConfig,
}: {
  name?: string;
  initialState: TreeDataNode<T>;
  primaryKey?: string;
  persistConfig?: PersistConfig;
}) => {
  type ChangeMonifier = (changes: TreeDataChange<T>[]) => any;
  const changeMonifierList: ChangeMonifier[] = [];

  type StoreState = {
    data: TreeDataNode<T>;
    init: (root: TreeDataNode<T>) => void;
    update: (node: Partial<TreeDataNode<T>>) => void;
    add: (payload: { node: TreeDataNode<T>; parentId?: string }) => void;
    delete: (id: string) => void;
  };

  const createState = (set: any, get: any): StoreState => ({
    data: initialState,
    init: (root) => {
      set({ data: root || initialState });
    },
    update: (node) => {
      if (!node) return;
      const applyUpdate = (parent: TreeDataNode<T>): boolean => {
        if ((parent as any)[primaryKey] === (node as any)[primaryKey]) {
          Object.assign(parent, node);
          return true;
        } else if (parent.children) {
          for (const child of parent.children) {
            if (applyUpdate(child)) return true;
          }
        }
        return false;
      };
      set((state) => {
        const cloned = structuredClone(state.data) as TreeDataNode<T>;
        applyUpdate(cloned);
        return { data: cloned };
      });
    },
    add: ({ node, parentId }) => {
      if (!node) return;
      if (!parentId) {
        // Root replace
        set({ data: node });
        return;
      }
      const applyAdd = (parent: TreeDataNode<T>): boolean => {
        if ((parent as any)[primaryKey] === parentId) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
          return true;
        } else if (parent.children) {
          for (const child of parent.children) {
            if (applyAdd(child)) return true;
          }
        }
        return false;
      };
      set((state) => {
        const cloned = structuredClone(state.data) as TreeDataNode<T>;
        applyAdd(cloned);
        return { data: cloned };
      });
    },
    delete: (id: string) => {
      const applyDelete = (parent: TreeDataNode<T>, idToDelete: string) => {
        if (!parent.children) return false;
        const index = parent.children.findIndex(
          (node) => (node as any)[primaryKey] === idToDelete
        );
        if (index !== -1) {
          parent.children.splice(index, 1);
          return true;
        }
        for (const child of parent.children) {
          if (applyDelete(child, idToDelete)) return true;
        }
        return false;
      };
      set((state) => {
        const cloned = structuredClone(state.data) as TreeDataNode<T>;
        applyDelete(cloned, id);
        return { data: cloned };
      });
    },
  });

  let store: StoreApi<StoreState>;
  if (persistConfig && persistConfig.type === "LocalStorage") {
    const persisted = persist<StoreState, [], [], StoreState>(
      (set, get) => createState(set, get),
      {
        name: persistConfig.name,
        storage: createJSONStorage<StoreState>(() => window.localStorage),
        // transforms are not wired through; if needed we can map them via
        // serialize/deserialize.
      }
    );
    store = createStore<StoreState>()(persisted);
  } else {
    store = createStore<StoreState>()(createState);
  }

  function useSelectedState(store, selector) {
    const [selectedState, setSelectedState] = useState(
      selector(store.getState())
    );
    useEffect(() => {
      const unsubscribe = store.subscribe(() => {
        const newSelectedState = selector(store.getState());
        if (newSelectedState !== selectedState) {
          setSelectedState(newSelectedState);
        }
      });
      return () => unsubscribe();
    }, [store, selector, selectedState]);
    return selectedState;
  }

  const useData = () => {
    return useSelectedState(store, (state) => state.data as TreeDataNode<T>);
  };

  const findNode = (
    current: TreeDataNode<T>,
    id: string
  ): TreeDataNode<T> | undefined => {
    if (current[primaryKey] === id) return current;
    if (current.children) {
      for (const child of current.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return undefined;
  };
  const getNode = (id: string) => {
    return findNode(store.getState().data as TreeDataNode<T>, id);
  };
  const useNode = (id: string) => {
    return useSelectedState(store, (state) => {
      return findNode(state.data as TreeDataNode<T>, id);
    });
  };
  const useInternalSelector = (selector) => {
    return useSelectedState(store, (state) => selector(state.data));
  };
  let observers: TreeDataObserver<any>[] = [];

  const notifyObservers = (action: TreeDataAction<any>) => {
    for (const observer of observers) {
      observer(action);
    }
  };
  const addObserver = (observer: TreeDataObserver<any>) => {
    observers.push(observer);
    return () => removeObserver(observer);
  };

  const removeObserver = (observer: TreeDataObserver<any>) => {
    observers = observers.filter((o) => o !== observer);
  };
  const getActions = () => {
    return {
      init: (root: TreeDataNode<T>) => {
        const prev = store.getState().data;
        store.getState().init(root);
        const next = store.getState().data;
        const differences = diff(prev as any, next as any);
        if (differences && differences.length) {
          changeMonifierList.forEach((fn) => fn(differences as any));
        }
        notifyObservers({ type: `${name}/init`, payload: { node: root } });
      },
      update: (payload: { node: Partial<TreeDataNode<T>> }) => {
        const prev = store.getState().data;
        store.getState().update(payload.node);
        const next = store.getState().data;
        const differences = diff(prev as any, next as any);
        if (differences && differences.length) {
          changeMonifierList.forEach((fn) => fn(differences as any));
        }
        notifyObservers({ type: `${name}/update`, payload });
      },
      add: (payload: { node: TreeDataNode<T>; parentId?: string }) => {
        const prev = store.getState().data;
        store.getState().add(payload);
        const next = store.getState().data;
        const differences = diff(prev as any, next as any);
        if (differences && differences.length) {
          changeMonifierList.forEach((fn) => fn(differences as any));
        }
        notifyObservers({ type: `${name}/add`, payload });
      },
      delete: (payload: { id: string }) => {
        const prev = store.getState().data;
        store.getState().delete(payload.id);
        const next = store.getState().data;
        const differences = diff(prev as any, next as any);
        if (differences && differences.length) {
          changeMonifierList.forEach((fn) => fn(differences as any));
        }
        notifyObservers({ type: `${name}/delete`, payload });
      },
    };
  };

  const onChange = (handler: ChangeMonifier) => {
    changeMonifierList.push(handler);
    return () =>
      changeMonifierList.splice(changeMonifierList.indexOf(handler), 1);
  };
  return {
    // Backwards compatible `reduxStore`-like surface for existing subscribers.
    reduxStore: {
      getState: () => ({ [name]: { data: store.getState().data } }),
      subscribe: (listener: () => void) => store.subscribe(listener),
    },
    useSelector: useInternalSelector,
    useData: useData,
    useNode,
    onChange,
    getActions,
    getNode,
    getData: () => {
      return store.getState().data;
    },
    id: nanoid(),
    addObserver,
    removeObserver,
  };
};

export type TreeDataStore<T extends Record<string, any> = any> = ReturnType<
  typeof createTreeDataStore<T>
>;

export interface TreeDataChange<T = any> {
  id: string;
  type: "add" | "delete" | "update";
  path?: string[];
  value?: T;
}

function diff<Node extends { id: string; children?: any[] }>(
  obj1: Node,
  obj2: Node
): TreeDataChange[] {
  const changes: TreeDataChange[] = [];

  const dfs = (
    node1: Node | undefined,
    node2: Node | undefined,
    path: string[]
  ) => {
    if (!node1 && !node2) {
      return;
    }

    if (!node1) {
      // node1 不存在，node2为新增节点
      changes.push({ id: node2!.id, type: "add", path });
      return;
    }

    if (!node2) {
      // node2 不存在，node1为删除节点
      changes.push({ id: node1!.id, type: "delete", path });
      return;
    }

    // 对比 node1 和 node2 的属性
    const keys = new Set([...Object.keys(node1), ...Object.keys(node2)]);
    for (const key of keys) {
      if (key === "children") {
        continue;
      }
      if (node1[key] !== node2[key]) {
        changes.push({
          id: node1.id,
          type: "update",
          path: [...path, key],
          value: node2[key],
        });
      }
    }

    // 对比 node1 和 node2 的子节点列表
    // const childChanges: TreeDataChange[] = [];
    const childIds = new Set([
      ...(node1.children || []).map((child) => child.id),
      ...(node2.children || []).map((child) => child.id),
    ]);
    for (const id of childIds) {
      const child1 = node1.children?.find((child) => child.id === id);
      const child2 = node2.children?.find((child) => child.id === id);
      dfs(child1, child2, [...path, "children", String(id)]);
    }
  };
  dfs(obj1, obj2, []);
  return changes;
}
