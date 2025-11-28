// Lightweight runtime registry for the currently active Excalidraw canvas.
// This allows global AI tools to read and update the current scene without
// needing direct access to React component refs.

export interface ExcalidrawScene {
  // We intentionally keep these fields loosely typed to avoid coupling this
  // runtime to Excalidraw's internal types. At runtime they will be the
  // same structures that Excalidraw's `updateScene` expects.
  elements?: readonly unknown[];
  appState?: unknown;
  files?: unknown;
}

export interface ExcalidrawHandle {
  // Return the latest scene snapshot.
  getScene(): ExcalidrawScene;
  // Apply a partial scene update. Callers should always pass the full
  // `elements` array when modifying diagram content.
  updateScene(partial: ExcalidrawScene): void;
}

class ExcalidrawRuntime {
  private currentHandle: ExcalidrawHandle | null = null;

  register(handle: ExcalidrawHandle): void {
    this.currentHandle = handle;
  }

  unregister(handle: ExcalidrawHandle): void {
    if (this.currentHandle === handle) {
      this.currentHandle = null;
    }
  }

  getCurrentHandle(): ExcalidrawHandle | null {
    return this.currentHandle;
  }
}

const runtime = new ExcalidrawRuntime();

export function registerExcalidraw(handle: ExcalidrawHandle): void {
  runtime.register(handle);
}

export function unregisterExcalidraw(handle: ExcalidrawHandle): void {
  runtime.unregister(handle);
}

export function getCurrentExcalidrawHandle(): ExcalidrawHandle | null {
  return runtime.getCurrentHandle();
}

