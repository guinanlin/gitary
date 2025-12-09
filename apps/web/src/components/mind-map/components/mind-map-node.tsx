import { useEffect, useRef, useState, useCallback } from "react";
import { MIN_NODE_HEIGHT, MIN_NODE_WIDTH, NODE_STYLES } from "../constants";
import type { MindMapNode, ViewportState } from "../types";
import { ThemeMode, THEMES } from "../types";

interface MindMapNodeProps {
  node: MindMapNode;
  theme: ThemeMode;
  isSelected: boolean;
  isEditing: boolean;
  viewport: ViewportState;
  onSelect: (id: string) => void;
  onEditStart: (id: string) => void;
  onEditChange: (id: string, text: string) => void;
  onEditEnd: (id: string, text: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddChild: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onPositionDrag: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const MindMapNodeComponent = ({
  node,
  theme,
  isSelected,
  isEditing,
  viewport,
  onSelect,
  onEditStart,
  onEditChange,
  onEditEnd,
  onToggleCollapse,
  onAddChild,
  onPositionChange,
  onPositionDrag,
  onDragStart,
  onDragEnd,
}: MindMapNodeProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const styles = THEMES[theme];
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeGroupRef = useRef<SVGGElement>(null);

  const width = node.width ?? MIN_NODE_WIDTH;
  const height = node.height ?? MIN_NODE_HEIGHT;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onEditEnd(node.id, node.text);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onEditEnd(node.id, node.text);
    }
    event.stopPropagation();
  };

  const hasChildren = node.children.length > 0;

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const svgElement = nodeGroupRef.current?.ownerSVGElement;
    if (!svgElement) return { x: 0, y: 0 };

    const svgRect = svgElement.getBoundingClientRect();
    const x = (clientX - svgRect.left - viewport.x) / viewport.scale;
    const y = (clientY - svgRect.top - viewport.y) / viewport.scale;

    return { x, y };
  }, [viewport]);

  // Track if mouse actually moved during drag
  const hasMovedRef = useRef(false);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (isEditing) return;
    const target = event.target as Element;
    if (target.closest('textarea')) return;
    if (target.closest('[data-collapse-toggle]')) return;
    if (target.closest('[data-add-child]')) return;
    if (target.closest('circle')) return;
    if (target.closest('path')) return;
    if (target.closest('text')) return;

    event.stopPropagation();

    const canvasPos = screenToCanvas(event.clientX, event.clientY);

    setDragOffset({
      x: (node.x ?? 0) - canvasPos.x,
      y: (node.y ?? 0) - canvasPos.y,
    });
    hasMovedRef.current = false; // Reset on mouseDown
    setIsDragging(true);
    onDragStart();
    onSelect(node.id);
  }, [isEditing, node, screenToCanvas, onDragStart, onSelect]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      hasMovedRef.current = true; // Mark that mouse has moved
      const canvasPos = screenToCanvas(event.clientX, event.clientY);
      const newX = canvasPos.x + dragOffset.x;
      const newY = canvasPos.y + dragOffset.y;
      onPositionDrag(node.id, newX, newY);
    };

    const handleMouseUp = (event: MouseEvent) => {
      // Only update position if mouse actually moved (real drag, not just click)
      if (hasMovedRef.current) {
        const canvasPos = screenToCanvas(event.clientX, event.clientY);
        const newX = canvasPos.x + dragOffset.x;
        const newY = canvasPos.y + dragOffset.y;
        onPositionChange(node.id, newX, newY);
      }
      setIsDragging(false);
      onDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, node.id, screenToCanvas, onPositionChange, onDragEnd, onPositionDrag]);

  const textStyle: React.CSSProperties = {
    fontFamily: NODE_STYLES.fontFamily,
    fontSize: NODE_STYLES.fontSize,
    fontWeight: NODE_STYLES.fontWeight,
    lineHeight: NODE_STYLES.lineHeight,
    padding: NODE_STYLES.padding,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    textAlign: "left",
  };

  return (
    <g
      ref={nodeGroupRef}
      transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
      className={`${!isDragging ? 'transition-transform duration-300 ease-in-out' : ''} cursor-move group`}
      onMouseDown={handleMouseDown}
      onClick={(event) => {
        if (!isDragging) {
          const target = event.target as Element;
          const collapseToggle = target.closest('[data-collapse-toggle]');
          console.log('[MindMapNode] onClick handler', {
            id: node.id,
            target: target.tagName,
            targetId: target.id,
            targetClass: target.className,
            hasCollapseToggle: !!collapseToggle,
            eventPhase: event.eventPhase,
            bubbles: event.bubbles,
          });
          if (collapseToggle) {
            console.log('[MindMapNode] click blocked - collapse toggle detected');
            return;
          }
          console.log('[MindMapNode] click-select', {
            id: node.id,
            target: target.tagName,
          });
          event.stopPropagation();
          // onSelect(node.id); // Removed to prevent double selection/collapse issue, handled in onMouseDown
        }
      }}
      onDoubleClick={(event) => {
        if (!isDragging) {
          event.stopPropagation();
          onEditStart(node.id);
        }
      }}
    >
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={8}
        className={`${styles.nodeBg} ${isSelected ? `stroke-2 ${styles.highlight}` : "stroke-1 stroke-slate-200 dark:stroke-slate-700"
          } shadow-sm transition-all duration-200`}
      />

      <foreignObject
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        className="pointer-events-none"
      >
        <div className="w-full h-full">
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={node.text}
              onChange={(event) => onEditChange(node.id, event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => onEditEnd(node.id, node.text)}
              className="pointer-events-auto w-full h-full bg-transparent resize-none outline-none text-slate-800 dark:text-white border-0 m-0 overflow-hidden"
              style={{ ...textStyle, margin: 0 }}
            />
          ) : (
            <div className={`w-full h-full ${styles.text}`} style={textStyle}>
              {node.text}
            </div>
          )}
        </div>
      </foreignObject>

      {hasChildren && (
        <g
          data-collapse-toggle
          transform={`translate(${width / 2 + 12}, 0)`}
          onMouseDown={(event) => {
            console.log('[MindMapNode] collapse-toggle mousedown', { id: node.id });
            event.stopPropagation();
          }}
          onClick={(event) => {
            console.log('[MindMapNode] collapse-toggle group click', {
              id: node.id,
              target: (event.target as Element).tagName,
            });
            event.stopPropagation();
            event.preventDefault();
            onToggleCollapse(node.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <circle
            r="8"
            className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600"
          />
          <text
            dy=".3em"
            textAnchor="middle"
            className="text-[10px] fill-slate-500 font-bold select-none pointer-events-none"
          >
            {node.isExpanded ? "-" : "+"}
          </text>
        </g>
      )}

      <g
        data-add-child
        transform={`translate(0, ${height / 2 + 12})`}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onAddChild(node.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <circle
          r="8"
          className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600"
        />
        <text
          dy=".3em"
          textAnchor="middle"
          className="text-[10px] fill-slate-500 font-bold select-none pointer-events-none"
        >
          +
        </text>
      </g>
    </g>
  );
};
