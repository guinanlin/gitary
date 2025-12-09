import { Folder, File, FileText, Calendar, HardDrive } from "lucide-react";
import { useState } from "react";

interface FsDirCardProps {
  path: string;
  entries: Array<{ name: string; type: "file" | "directory" | "other" }>;
}

const FsDirCard = ({ path, entries }: FsDirCardProps) => {
  const [expanded, setExpanded] = useState(entries.length <= 20);

  const files = entries.filter((e) => e.type === "file");
  const directories = entries.filter((e) => e.type === "directory");
  const others = entries.filter((e) => e.type === "other");

  const displayEntries = expanded ? entries : entries.slice(0, 20);

  return (
    <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="text-base font-semibold text-foreground">目录内容</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{path}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {entries.length} 项
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {displayEntries.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 transition-colors"
          >
            {entry.type === "directory" ? (
              <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
            )}
            <span className="text-sm text-foreground font-mono truncate flex-1">
              {entry.name}
            </span>
            <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
              {entry.type === "directory" ? "目录" : entry.type === "file" ? "文件" : "其他"}
            </span>
          </div>
        ))}
      </div>

      {entries.length > 20 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? `收起 (显示全部 ${entries.length} 项)` : `展开 (显示全部 ${entries.length} 项)`}
        </button>
      )}

      <div className="mt-3 pt-3 border-t border-border/50 flex gap-4 text-xs text-muted-foreground">
        <span>📁 {directories.length} 个目录</span>
        <span>📄 {files.length} 个文件</span>
        {others.length > 0 && <span>❓ {others.length} 个其他</span>}
      </div>
    </div>
  );
};

interface FsFileCardProps {
  path: string;
  content: string;
  truncated: boolean;
}

const FsFileCard = ({ path, content, truncated }: FsFileCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const previewLines = content.split("\n").slice(0, 10);
  const hasMore = content.split("\n").length > 10;

  return (
    <div className="rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h3 className="text-base font-semibold text-foreground">文件内容</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{path}</p>
          </div>
        </div>
        {truncated && (
          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
            已截断
          </span>
        )}
      </div>

      <div className="bg-muted/50 rounded-md p-3 max-h-96 overflow-y-auto">
        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
          {expanded || !hasMore ? content : previewLines.join("\n") + "\n..."}
        </pre>
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? "收起" : `展开 (共 ${content.split("\n").length} 行)`}
        </button>
      )}

      <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span>📊 {content.length} 字符</span>
        {truncated && <span className="ml-3">⚠️ 内容已截断</span>}
      </div>
    </div>
  );
};

interface FsStatCardProps {
  path: string;
  size?: number;
  mtime?: number;
}

const FsStatCard = ({ path, size, mtime }: FsStatCardProps) => {
  const formatSize = (bytes?: number) => {
    if (!bytes) return "未知";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "未知";
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  return (
    <div className="rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-base font-semibold text-foreground">文件信息</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{path}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">大小:</span>
          <span className="text-foreground font-medium">{formatSize(size)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">修改时间:</span>
          <span className="text-foreground font-medium">{formatDate(mtime)}</span>
        </div>
      </div>
    </div>
  );
};

interface FsBinaryCardProps {
  path: string;
  note: string;
  size?: number;
}

const FsBinaryCard = ({ path, note, size }: FsBinaryCardProps) => {
  const formatSize = (bytes?: number) => {
    if (!bytes) return "未知";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <File className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-base font-semibold text-foreground">二进制文件</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{path}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{note}</p>
        {size !== undefined && (
          <div className="text-sm">
            <span className="text-muted-foreground">大小:</span>
            <span className="ml-2 text-foreground font-medium">{formatSize(size)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const FsResultCard = ({ result }: { result: any }) => {
  if (!result || typeof result !== "object") return null;

  if (result.kind === "directory") {
    return <FsDirCard path={result.path} entries={result.entries || []} />;
  }

  if (result.kind === "file") {
    return (
      <FsFileCard
        path={result.path}
        content={result.content || ""}
        truncated={result.truncated || false}
      />
    );
  }

  if (result.kind === "binary") {
    return (
      <FsBinaryCard
        path={result.path}
        note={result.note || "二进制文件"}
        size={result.size}
      />
    );
  }

  if (result.kind === "stat") {
    return (
      <FsStatCard
        path={result.path}
        size={result.size}
        mtime={result.mtime}
      />
    );
  }

  return null;
};

