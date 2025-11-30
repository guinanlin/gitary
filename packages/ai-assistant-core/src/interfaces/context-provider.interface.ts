export interface BrowserTabContext {
  url: string;
  title: string;
  content?: string;
  selectedText?: string;
}

export interface EditorContext {
  uri: string;
  fileName: string;
  content: string;
  selectedText?: string;
  language?: string;
  lineCount: number;
}

export interface ProjectContext {
  currentFile?: string;
  recentFiles?: string[];
  projectStructure?: string;
}

export interface AIContext {
  browserTab?: BrowserTabContext;
  editor?: EditorContext;
  project?: ProjectContext;
  timestamp: number;
}

export interface IContextProvider {
  getCurrentPageContext(): Promise<{ uri?: string; openerId?: string } | undefined>;
  getEditorContext(): Promise<EditorContext | undefined>;
  getBrowserTabContext(): Promise<BrowserTabContext | undefined>;
  getFullContext(options?: {
    includeBrowserTab?: boolean;
    includeEditor?: boolean;
    includeProject?: boolean;
  }): Promise<AIContext>;
  formatContextForPrompt(context: AIContext): string;
}

