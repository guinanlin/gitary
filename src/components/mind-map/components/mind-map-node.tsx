import { useEffect, useRef } from "react";
import { MIN_NODE_HEIGHT, MIN_NODE_WIDTH, NODE_STYLES } from "../constants";
import type { MindMapNode } from "../types";
import { ThemeMode, THEMES } from "../types";

interface MindMapNodeProps {
  node: MindMapNode;
  theme: ThemeMode;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (id: string) => void;
  onEditStart: (id: string) => void;
  onEditChange: (id: string, text: string) => void;
  onEditEnd: (id: string, text: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddChild: (id: string) => void;
}

export const MindMapNodeComponent = ({
  node,
  theme,
  isSelected,
  isEditing,
  onSelect,
  onEditStart,
  onEditChange,
  onEditEnd,
  onToggleCollapse,
  onAddChild,
}: MindMapNodeProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const styles = THEMES[theme];

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
      transform={`translate(${node.x}, ${node.y})`}
      className="transition-transform duration-300 ease-in-out cursor-pointer group"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.id);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEditStart(node.id);
      }}
    >
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={8}
        className={`${styles.nodeBg} ${
          isSelected ? `stroke-2 ${styles.highlight}` : "stroke-1 stroke-slate-200 dark:stroke-slate-700"
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
          transform={`translate(${width / 2 + 12}, 0)`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapse(node.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <circle r="8" className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600" />
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
        transform={`translate(0, ${height / 2 + 12})`}
        onClick={(event) => {
          event.stopPropagation();
          onAddChild(node.id);
        }}
        className={`opacity-0 ${isSelected ? "opacity-100" : "group-hover:opacity-50"} transition-opacity cursor-pointer`}
      >
        <circle r="8" className="fill-blue-500 stroke-none" />
        <path d="M-3 0 H3 M0 -3 V3" stroke="white" strokeWidth="1.5" />
      </g>
    </g>
  );
};
