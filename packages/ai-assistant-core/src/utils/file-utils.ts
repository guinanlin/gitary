export function isBinaryFile(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".ico",
      ".pdf",
      ".zip",
      ".tar",
      ".gz",
      ".7z",
      ".mp3",
      ".mp4",
      ".mov",
      ".wav",
      ".ttf",
      ".woff",
      ".woff2",
      ".exe",
      ".dll",
    ].some((ext) => lower.endsWith(ext)) || lower.startsWith(".git/")
  );
}

export function shouldIgnorePath(path: string): boolean {
  const parts = path.split("/");
  if (parts.some((p) => [".git", "node_modules", ".next", "dist", "build"].includes(p))) return true;
  const name = parts[parts.length - 1];
  if ([".DS_Store", "Thumbs.db"].includes(name)) return true;
  return false;
}

