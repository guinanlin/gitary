import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useColorMode } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { MAX_NODE_WIDTH, MIN_NODE_HEIGHT } from "./mind-map/constants";
import type { MindMapStore } from "./mind-map/mind-map-store";
import { useMindMap } from "./mind-map/use-mind-map";
import type { MindMapNode, ViewportState } from "./mind-map/types";
import { MindMapSaveStatus, ThemeMode, THEMES } from "./mind-map/types";
import { Toolbar } from "./mind-map/components/toolbar";
import { MindMapEdge } from "./mind-map/components/mind-map-edge";
import { MindMapNodeComponent } from "./mind-map/components/mind-map-node";
import { CanvasControls } from "./mind-map/components/canvas-controls";
import { Instructions } from "./mind-map/components/instructions";

interface MindFlowCanvasProps {
  store: MindMapStore;
  saveStatus: MindMapSaveStatus;
}

const buildViewport = (): ViewportState => {
  if (typeof window === "undefined") {
    return { x: 0, y: 0, scale: 1 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 };
};

const getContainerSize = (element: HTMLDivElement | null) => {
  if (element) {
    const rect = element.getBoundingClientRect();
    return { width: rect.width || 1, height: rect.height || 1 };
  }
  if (typeof window !== "undefined") {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: 1, height: 1 };
};

const STATUS_CLASS_MAP: Record<MindMapSaveStatus, string> = {
  [MindMapSaveStatus.IDLE]: "text-slate-500 bg-white/90 border-slate-200",
  [MindMapSaveStatus.DIRTY]: "text-amber-700 bg-amber-50 border-amber-200",
  [MindMapSaveStatus.SAVING]: "text-blue-700 bg-blue-50 border-blue-200",
  [MindMapSaveStatus.SAVED]: "text-emerald-700 bg-emerald-50 border-emerald-200",
  [MindMapSaveStatus.ERROR]: "text-red-700 bg-red-50 border-red-200",
};

export const MindFlowCanvas = ({ store, saveStatus }: MindFlowCanvasProps) => {
  const { t } = useTranslation();
  const { colorMode } = useColorMode();
  const theme = colorMode === "dark" ? ThemeMode.DARK : ThemeMode.LIGHT;

  const {
    nodes,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    updateNodeText,
    updateDraft,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMindMap(store);

  const [viewport, setViewport] = useState<ViewportState>(buildViewport);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasManualViewChangeRef = useRef(false);

  const navigateSelection = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (!selectedId) return;
      const current = nodes[selectedId];
      if (!current) return;

      let nextId: string | null = null;
      const allNodes = Object.values(nodes) as MindMapNode[];

      if (direction === "left" && current.parentId) {
        nextId = current.parentId;
      } else if (direction === "right" && current.children.length > 0 && current.isExpanded) {
        nextId = current.children[Math.floor(current.children.length / 2)];
      } else {
        const cx = current.x || 0;
        const cy = current.y || 0;
        let closestDist = Number.POSITIVE_INFINITY;
        allNodes.forEach((node) => {
          if (node.id === current.id) return;
          const nx = node.x || 0;
          const ny = node.y || 0;
          const dx = nx - cx;
          const dy = ny - cy;
          let valid = false;
          if (direction === "up") valid = dy < -10 && Math.abs(dx) < 100;
          if (direction === "down") valid = dy > 10 && Math.abs(dx) < 100;
          if (direction === "right") valid = dx > 10;
          if (valid) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
              closestDist = dist;
              nextId = node.id;
            }
          }
        });
      }

      if (nextId) {
        setSelectedId(nextId);
      }
    },
    [nodes, selectedId, setSelectedId],
  );

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (editingId) return;
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      switch (event.key) {
        case "Tab":
          event.preventDefault();
          if (selectedId) addChild(selectedId);
          break;
        case "Enter":
          event.preventDefault();
          if (selectedId) addSibling(selectedId);
          break;
        case "Backspace":
        case "Delete":
          if (selectedId) deleteNode(selectedId);
          break;
        case " ":
          event.preventDefault();
          if (selectedId) setEditingId(selectedId);
          break;
        case "ArrowLeft":
          event.preventDefault();
          navigateSelection("left");
          break;
        case "ArrowRight":
          event.preventDefault();
          navigateSelection("right");
          break;
        case "ArrowUp":
          event.preventDefault();
          navigateSelection("up");
          break;
        case "ArrowDown":
          event.preventDefault();
          navigateSelection("down");
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    selectedId,
    editingId,
    addChild,
    addSibling,
    deleteNode,
    undo,
    redo,
    navigateSelection,
    setEditingId,
  ]);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      hasManualViewChangeRef.current = true;
      if (event.ctrlKey || event.metaKey) {
        const zoomSensitivity = 0.001;
        const newScale = Math.min(
          Math.max(0.1, viewport.scale - event.deltaY * zoomSensitivity),
          5,
        );
        setViewport((prev) => ({ ...prev, scale: newScale }));
      } else {
        setViewport((prev) => ({
          ...prev,
          x: prev.x - event.deltaX,
          y: prev.y - event.deltaY,
        }));
      }
    },
    [viewport.scale],
  );

  const handleMouseDown = (event: React.MouseEvent) => {
    if ((event.target as Element).tagName === "svg" || (event.target as Element).id === "canvas-bg") {
      setIsPanning(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
      setSelectedId(null);
      hasManualViewChangeRef.current = true;
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isPanning) {
      const dx = event.clientX - lastMousePos.x;
      const dy = event.clientY - lastMousePos.y;
      setViewport((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const stopPanning = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () =>
    setViewport((prev) => {
      hasManualViewChangeRef.current = true;
      return { ...prev, scale: Math.min(prev.scale * 1.2, 5) };
    });
  const handleZoomOut = () =>
    setViewport((prev) => {
      hasManualViewChangeRef.current = true;
      return { ...prev, scale: Math.max(prev.scale / 1.2, 0.1) };
    });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };
    const gestureEvents = ["gesturestart", "gesturechange", "gestureend"] as const;
    gestureEvents.forEach((type) => {
      container.addEventListener(type, preventGesture as EventListener, { passive: false });
    });

    return () => {
      gestureEvents.forEach((type) => {
        container.removeEventListener(type, preventGesture as EventListener);
      });
    };
  }, []);

  const handleResetView = useCallback(() => {
    hasManualViewChangeRef.current = false;
    const allNodes = Object.values(nodes) as MindMapNode[];
    const visibleNodes = allNodes.filter((node) => {
      if (node.x === undefined || node.y === undefined) return false;
      let current = node;
      while (current.parentId) {
        const parent = nodes[current.parentId];
        if (!parent || !parent.isExpanded) return false;
        current = parent;
      }
      return true;
    });

    if (!visibleNodes.length) {
      setViewport(buildViewport());
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    visibleNodes.forEach((node) => {
      if (node.x === undefined || node.y === undefined) return;
      const { x, y } = node;
      const width = node.width || MAX_NODE_WIDTH;
      const height = node.height || MIN_NODE_HEIGHT;
      minX = Math.min(minX, x - width / 2);
      maxX = Math.max(maxX, x + width / 2);
      minY = Math.min(minY, y - height / 2);
      maxY = Math.max(maxY, y + height / 2);
    });

    const padding = 80;
    const bboxWidth = Math.max(maxX - minX, 100);
    const bboxHeight = Math.max(maxY - minY, 100);
    const { width: viewportWidth, height: viewportHeight } = getContainerSize(
      containerRef.current,
    );
    const availableWidth = Math.max(viewportWidth - padding * 2, 100);
    const availableHeight = Math.max(viewportHeight - padding * 2, 100);
    const scaleX = availableWidth / bboxWidth;
    const scaleY = availableHeight / bboxHeight;

    let fitScale = Math.min(scaleX, scaleY);
    fitScale = Math.min(fitScale, 1.2);
    fitScale = Math.max(fitScale, 0.1);

    const centerX = minX + bboxWidth / 2;
    const centerY = minY + bboxHeight / 2;
    const newX = viewportWidth / 2 - centerX * fitScale;
    const newY = viewportHeight / 2 - centerY * fitScale;
    setViewport({ x: newX, y: newY, scale: fitScale });
  }, [nodes]);

  useEffect(() => {
    if (hasManualViewChangeRef.current) {
      return;
    }
    const availableNodes = Object.values(nodes) as MindMapNode[];
    const hasPositions = availableNodes.some(
      (node) => node.x !== undefined && node.y !== undefined,
    );
    if (!hasPositions) return;
    handleResetView();
  }, [handleResetView, nodes]);

  const saveStatusText = useMemo(() => {
    switch (saveStatus) {
      case MindMapSaveStatus.SAVING:
        return t("mindFlow.status.saving");
      case MindMapSaveStatus.SAVED:
        return t("mindFlow.status.saved");
      case MindMapSaveStatus.ERROR:
        return t("mindFlow.status.error");
      case MindMapSaveStatus.DIRTY:
        return t("mindFlow.status.dirty");
      case MindMapSaveStatus.IDLE:
      default:
        return t("mindFlow.status.idle");
    }
  }, [saveStatus, t]);

  const toolbarLabels = useMemo(
    () => ({
      undo: t("mindFlow.toolbar.undo"),
      redo: t("mindFlow.toolbar.redo"),
      addChild: t("mindFlow.toolbar.addChild"),
      deleteNode: t("mindFlow.toolbar.deleteNode"),
    }),
    [t],
  );

  const controlLabels = useMemo(
    () => ({
      zoomIn: t("mindFlow.controls.zoomIn"),
      zoomOut: t("mindFlow.controls.zoomOut"),
      reset: t("mindFlow.controls.reset"),
    }),
    [t],
  );

  const instructionsItems = useMemo(
    () => [
      { label: t("mindFlow.instructions.select"), action: t("mindFlow.instructions.selectAction") },
      { label: t("mindFlow.instructions.edit"), action: t("mindFlow.instructions.editAction") },
      {
        label: t("mindFlow.instructions.addChild"),
        action: t("mindFlow.instructions.addChildAction"),
      },
      {
        label: t("mindFlow.instructions.addSibling"),
        action: t("mindFlow.instructions.addSiblingAction"),
      },
      { label: t("mindFlow.instructions.delete"), action: t("mindFlow.instructions.deleteAction") },
      {
        label: t("mindFlow.instructions.navigate"),
        action: t("mindFlow.instructions.navigateAction"),
      },
      { label: t("mindFlow.instructions.pan"), action: t("mindFlow.instructions.panAction") },
    ],
    [t],
  );

  const styles = THEMES[theme];

  const renderEdges = useMemo(() => {
    return (Object.values(nodes) as MindMapNode[]).map((node) => {
      if (!node.parentId) return null;
      const parent = nodes[node.parentId];
      if (!parent || !parent.isExpanded) return null;
      return (
        <MindMapEdge key={`edge-${node.id}`} source={parent} target={node} theme={theme} />
      );
    });
  }, [nodes, theme]);

  const renderNodes = useMemo(() => {
    return (Object.values(nodes) as MindMapNode[])
      .filter((node) => {
        if (!node.parentId) return true;
        const parent = nodes[node.parentId];
        return parent && parent.isExpanded && parent.x !== undefined;
      })
      .map((node) => (
        <MindMapNodeComponent
          key={node.id}
          node={node}
          theme={theme}
          isSelected={selectedId === node.id}
          isEditing={editingId === node.id}
          onSelect={setSelectedId}
          onEditStart={setEditingId}
          onEditChange={updateDraft}
          onEditEnd={(id, text) => {
            updateNodeText(id, text);
            updateDraft(id, null);
            setEditingId(null);
          }}
          onToggleCollapse={toggleCollapse}
          onAddChild={addChild}
        />
      ));
  }, [
    nodes,
    theme,
    selectedId,
    editingId,
    setSelectedId,
    setEditingId,
    updateDraft,
    updateNodeText,
    toggleCollapse,
    addChild,
  ]);

  const canvas: ReactNode = (
    <div
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPanning}
      onMouseLeave={stopPanning}
    >
      <svg id="canvas-bg" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`}>
          {renderEdges}
          {renderNodes}
        </g>
      </svg>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${styles.bg} selection:bg-blue-500/30`}
    >
      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAdd={() => selectedId && addChild(selectedId)}
        onDelete={() => selectedId && deleteNode(selectedId)}
        labels={toolbarLabels}
      />

      <div
        className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full border text-xs font-medium shadow-sm ${STATUS_CLASS_MAP[saveStatus]}`}
      >
        {saveStatusText}
      </div>

      {canvas}

      <CanvasControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        labels={controlLabels}
      />
      <Instructions
        title={t("mindFlow.instructions.title")}
        toggleShow={t("mindFlow.instructions.show")}
        toggleHide={t("mindFlow.instructions.hide")}
        items={instructionsItems}
      />
    </div>
  );
};
