import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect, useCallback } from "react";

export interface CustomNodeData {
  label: string;
  description?: string;
  color?: string;
  icon?: string;
  sequence?: string;
  metadata?: Record<string, unknown>;
}

export const CustomNode = ({ data, selected, id }: NodeProps<CustomNodeData>) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const [isEditingSequence, setIsEditingSequence] = useState(false);
  const [editSequenceValue, setEditSequenceValue] = useState(data.sequence || "1.0");
  const inputRef = useRef<HTMLInputElement>(null);
  const sequenceInputRef = useRef<HTMLInputElement>(null);
  
  const nodeColor = data.color || "#8b5cf6";
  const borderColor = selected ? "#3b82f6" : nodeColor;

  useEffect(() => {
    setEditValue(data.label);
  }, [data.label]);

  useEffect(() => {
    setEditSequenceValue(data.sequence || "1.0");
  }, [data.sequence]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingSequence && sequenceInputRef.current) {
      sequenceInputRef.current.focus();
      sequenceInputRef.current.select();
    }
  }, [isEditingSequence]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label);
  }, [data.label]);

  const handleSave = useCallback(() => {
    if (editValue.trim() !== "") {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                label: editValue.trim(),
              },
            };
          }
          return node;
        })
      );
    }
    setIsEditing(false);
  }, [id, editValue, setNodes]);

  const handleCancel = useCallback(() => {
    setEditValue(data.label);
    setIsEditing(false);
  }, [data.label]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const handleSequenceDoubleClick = useCallback(() => {
    setIsEditingSequence(true);
    setEditSequenceValue(data.sequence || "1.0");
  }, [data.sequence]);

  const handleSequenceSave = useCallback(() => {
    if (editSequenceValue.trim() !== "") {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                sequence: editSequenceValue.trim(),
              },
            };
          }
          return node;
        })
      );
    }
    setIsEditingSequence(false);
  }, [id, editSequenceValue, setNodes]);

  const handleSequenceCancel = useCallback(() => {
    setEditSequenceValue(data.sequence || "1.0");
    setIsEditingSequence(false);
  }, [data.sequence]);

  const handleSequenceKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSequenceSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSequenceCancel();
      }
    },
    [handleSequenceSave, handleSequenceCancel]
  );

  const handleSequenceBlur = useCallback(() => {
    handleSequenceSave();
  }, [handleSequenceSave]);

  return (
    <Card
      className="px-4 py-3 min-w-[150px] shadow-md border-2 transition-all relative"
      style={{
        borderColor,
        backgroundColor: selected ? `${nodeColor}15` : "white",
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex flex-col items-center justify-center gap-1">
        {data.icon && (
          <div className="text-lg mb-1">{data.icon}</div>
        )}
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="font-semibold text-sm h-7 px-2 nodrag text-center border-gray-300 focus-visible:border-gray-400"
            style={{ 
              color: nodeColor,
              borderColor: "#d1d5db",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="font-semibold text-sm cursor-text text-center"
            style={{ color: nodeColor }}
            onDoubleClick={handleDoubleClick}
          >
            {data.label}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground z-10">
        {isEditingSequence ? (
          <Input
            ref={sequenceInputRef}
            value={editSequenceValue}
            onChange={(e) => setEditSequenceValue(e.target.value)}
            onBlur={handleSequenceBlur}
            onKeyDown={handleSequenceKeyDown}
            className="w-12 h-5 px-1 text-xs nodrag border-gray-300 focus-visible:border-gray-400 bg-white"
            style={{ borderColor: "#d1d5db" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="cursor-text select-none"
            onDoubleClick={handleSequenceDoubleClick}
          >
            {data.sequence || "1.0"}
          </div>
        )}
      </div>
    </Card>
  );
};

