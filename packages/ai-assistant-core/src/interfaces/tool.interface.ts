import { z } from 'zod';
import type { IFileSystemProvider } from './file-system.interface';
import type { IContextProvider } from './context-provider.interface';
import type { II18nProvider } from './i18n.interface';

export interface IToolContext {
  fileSystem?: IFileSystemProvider;
  contextProvider?: IContextProvider;
  i18n?: II18nProvider;
  getAIModel?: () => any;
  [key: string]: any;
}

export interface ITool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  execute: (args: any, context: IToolContext) => Promise<any>;
}

export type ToolFactory = (context: IToolContext) => any;

