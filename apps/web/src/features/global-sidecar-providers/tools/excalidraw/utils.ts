import { getCurrentExcalidrawHandle } from "@/services/excalidraw-runtime";
import { t } from "@/i18n/utils";
import type { ExcalidrawElement } from "./types";

export function ensureExcalidrawAvailable() {
  const handle = getCurrentExcalidrawHandle();
  if (!handle) {
    throw new Error(t("excalidraw.tools.noCanvas"));
  }
  const scene = handle.getScene();
  const elements = (scene.elements ?? []) as ExcalidrawElement[];
  return { handle, scene, elements };
}

export function inferKindFromLabel(label: string): string | undefined {
  const text = label.toLowerCase();
  if (text.includes("db") || text.includes("数据库")) return "database";
  if (text.includes("cache") || text.includes("redis")) return "cache";
  if (text.includes("api") || text.includes("service")) return "service";
  return undefined;
}

export function getElementCenter(el: ExcalidrawElement): { x: number; y: number } {
  const anyEl = el as Record<string, unknown>;
  const x = ((anyEl.x as number) ?? 0) + ((anyEl.width as number) ?? 0) / 2;
  const y = ((anyEl.y as number) ?? 0) + ((anyEl.height as number) ?? 0) / 2;
  return { x, y };
}

export function distanceSq(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function getArrowEndpoints(el: ExcalidrawElement): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  const anyEl = el as Record<string, unknown>;
  const points = (anyEl.points as [number, number][]) ?? [];
  const baseX = (anyEl.x as number) ?? 0;
  const baseY = (anyEl.y as number) ?? 0;
  if (!Array.isArray(points) || points.length < 2) {
    const start = { x: baseX, y: baseY };
    const end = {
      x: baseX + ((anyEl.width as number) ?? 0),
      y: baseY + ((anyEl.height as number) ?? 0),
    };
    return { start, end };
  }
  const first = points[0];
  const last = points[points.length - 1];
  return {
    start: { x: baseX + first[0], y: baseY + first[1] },
    end: { x: baseX + last[0], y: baseY + last[1] },
  };
}

export function findNodeElementByRef(
  elements: ExcalidrawElement[],
  ref?: string
): ExcalidrawElement | null {
  if (!ref) return null;
  const trimmed = ref.trim();
  const lowered = trimmed.toLowerCase();

  let found = elements.find((el) => el.id === trimmed);
  if (found) return found;

  found = elements.find((el) => {
    const anyEl = el as Record<string, unknown>;
    if (anyEl.type !== "text") return false;
    const text = (anyEl.text ?? "") as string;
    return text.trim().toLowerCase() === lowered;
  });
  if (found) return found;

  found = elements.find((el) => {
    const anyEl = el as Record<string, unknown>;
    if (anyEl.type !== "text") return false;
    const text = (anyEl.text ?? "") as string;
    return text.toLowerCase().includes(lowered);
  });
  return found ?? null;
}

export function computeSceneBounds(elements: ExcalidrawElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  if (!elements.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const anyEl = el as Record<string, unknown>;
    const x = (anyEl.x as number) ?? 0;
    const y = (anyEl.y as number) ?? 0;
    const w = (anyEl.width as number) ?? 0;
    const h = (anyEl.height as number) ?? 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  return { minX, minY, maxX, maxY };
}

export function createRectangleAndTextNode(params: {
  baseId: string;
  label: string;
  center: { x: number; y: number };
}): ExcalidrawElement[] {
  const { baseId, label, center } = params;
  const timestamp = Date.now();
  const rectId = `${baseId}-box`;
  const textId = baseId;

  const width = 180;
  const height = 80;
  const rectX = center.x - width / 2;
  const rectY = center.y - height / 2;

  const rect = {
    type: "rectangle",
    version: 1,
    versionNonce: timestamp,
    isDeleted: false,
    id: rectId,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: rectX,
    y: rectY,
    strokeColor: "#1e293b",
    backgroundColor: "#e0f2fe",
    width,
    height,
    seed: timestamp,
    groupIds: [],
    frameId: null,
    roundness: { type: 3 },
    boundElements: [
      {
        type: "text",
        id: textId,
      },
    ],
    updated: timestamp,
    link: null,
    locked: false,
  } as unknown as ExcalidrawElement;

  const textWidth = width - 40;
  const textHeight = 28;
  const textX = rectX + (width - textWidth) / 2;
  const textY = center.y - textHeight / 2;

  const text = {
    type: "text",
    version: 1,
    versionNonce: timestamp + 1,
    isDeleted: false,
    id: textId,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: textX,
    y: textY,
    strokeColor: "#0f172a",
    backgroundColor: "transparent",
    width: textWidth,
    height: textHeight,
    seed: timestamp + 1,
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: null,
    updated: timestamp + 1,
    link: null,
    locked: false,
    fontSize: 18,
    fontFamily: 1,
    text: label,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: rectId,
    originalText: label,
    lineHeight: 1.25,
    baseline: Math.round(textHeight * 0.8),
  } as unknown as ExcalidrawElement;

  return [rect, text];
}

export function createArrowBetween(
  fromEl: ExcalidrawElement,
  toEl: ExcalidrawElement
): ExcalidrawElement {
  const now = Date.now();
  const start = getElementCenter(fromEl);
  const end = getElementCenter(toEl);
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const width = Math.max(Math.abs(dx), 1);
  const height = Math.max(Math.abs(dy), 1);

  const arrow = {
    type: "arrow",
    version: 1,
    versionNonce: now,
    isDeleted: false,
    id: `arrow-${now}-${Math.floor(Math.random() * 1e4)}`,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: start.x,
    y: start.y,
    strokeColor: "#1e293b",
    backgroundColor: "transparent",
    width,
    height,
    seed: now,
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: [],
    updated: now,
    link: null,
    locked: false,
    startBinding: null,
    endBinding: null,
    points: [
      [0, 0],
      [dx, dy],
    ],
    lastCommittedPoint: [dx, dy],
    startArrowhead: null,
    endArrowhead: "arrow",
  } as unknown as ExcalidrawElement;

  return arrow;
}

