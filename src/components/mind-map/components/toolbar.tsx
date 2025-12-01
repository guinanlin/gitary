import { Plus, Redo, Trash2, Undo } from "lucide-react";

interface ToolbarLabels {
  undo: string;
  redo: string;
  addChild: string;
  deleteNode: string;
}

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAdd: () => void;
  onDelete: () => void;
  labels: ToolbarLabels;
  className?: string;
}

export const Toolbar = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAdd,
  onDelete,
  labels,
  className = "",
}: ToolbarProps) => (
  <div
    className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}
  >
    <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
        title={labels.undo}
      >
        <Undo size={18} />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
        title={labels.redo}
      >
        <Redo size={18} />
      </button>
    </div>

    <div className="flex items-center gap-1">
      <button
        onClick={onAdd}
        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
        title={labels.addChild}
      >
        <Plus size={18} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
        title={labels.deleteNode}
      >
        <Trash2 size={18} />
      </button>
    </div>

  </div>
);
