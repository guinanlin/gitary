import type { IToolContext } from "@dty/ai-assistant-core";
import {
  createExcalidrawAnalyzeTool,
  createExcalidrawAIGenerateDiagramTool,
  createExcalidrawAIAppendDiagramTool,
  createExcalidrawCreateDiagramTool,
  createExcalidrawAppendDiagramTool,
  createExcalidrawModifyTool,
} from "./excalidraw-tools-factory";

export const excalidrawAnalyzeTool = (context: IToolContext) => createExcalidrawAnalyzeTool(context);
export const excalidrawAIGenerateDiagramTool = (context: IToolContext) => createExcalidrawAIGenerateDiagramTool(context);
export const excalidrawAIAppendDiagramTool = (context: IToolContext) => createExcalidrawAIAppendDiagramTool(context);
export const excalidrawCreateDiagramTool = (context: IToolContext) => createExcalidrawCreateDiagramTool(context);
export const excalidrawAppendDiagramTool = (context: IToolContext) => createExcalidrawAppendDiagramTool(context);
export const excalidrawModifyTool = (context: IToolContext) => createExcalidrawModifyTool(context);

export type * from "./types";
