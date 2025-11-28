import type { Tool } from "@agent-labs/agent-chat";
import { t } from "@/i18n/utils";
import { excalidrawAIService } from "@/services/ai/excalidraw-ai.service";
import { ensureExcalidrawAvailable } from "./utils";

export const excalidrawAIAppendDiagramTool: Tool<
  { prompt: string },
  { insertedCount: number }
> = {
  name: "excalidraw_ai_append_diagram",
  description: t("excalidraw.tools.aiAppendDiagramDescription"),
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: t("excalidraw.tools.aiAppendDiagramPromptDescription"),
      },
    },
    required: ["prompt"],
    additionalProperties: false,
  },
  async execute(args) {
    const { handle, elements: currentElements } = ensureExcalidrawAvailable();
    const prompt = (args?.prompt ?? "").trim();

    if (!prompt) {
      throw new Error(t("excalidraw.tools.promptRequired"));
    }

    const newElements = await excalidrawAIService.generateDiagram(prompt);
    const combined = [...currentElements, ...newElements];

    handle.updateScene({ elements: combined });

    return {
      insertedCount: newElements.length,
    };
  },
};

