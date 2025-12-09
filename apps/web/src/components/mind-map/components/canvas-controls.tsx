import { Minus, Plus, RotateCcw } from "lucide-react";

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  labels: {
    zoomIn: string;
    zoomOut: string;
    reset: string;
  };
  className?: string;
}

export const CanvasControls = ({
  onZoomIn,
  onZoomOut,
  onReset,
  labels,
  className = "",
}: CanvasControlsProps) => (
  <div className={`absolute bottom-4 left-4 z-20 flex flex-col gap-2 ${className}`}>
    <div className="flex flex-col rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={onZoomIn}
        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border-b border-slate-200 dark:border-slate-700 active:bg-slate-200 dark:active:bg-slate-600"
        title={labels.zoomIn}
      >
        <Plus size={20} />
      </button>
      <button
        onClick={onZoomOut}
        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border-b border-slate-200 dark:border-slate-700 active:bg-slate-200 dark:active:bg-slate-600"
        title={labels.zoomOut}
      >
        <Minus size={20} />
      </button>
      <button
        onClick={onReset}
        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors active:bg-slate-200 dark:active:bg-slate-600"
        title={labels.reset}
      >
        <RotateCcw size={20} />
      </button>
    </div>
  </div>
);
