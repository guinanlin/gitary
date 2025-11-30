import { tool } from 'ai';
import { z } from 'zod';
import { t } from "@/i18n/utils";
import { excalidrawAIService } from "@/services/ai/excalidraw-ai.service";
import { ensureExcalidrawAvailable } from "./utils";

export const excalidrawAIAppendDiagramTool = tool({
  description: t("excalidraw.tools.aiAppendDiagramDescription"),
  inputSchema: z.object({
    prompt: z.string().describe(
      t("excalidraw.tools.aiAppendDiagramPromptDescription")
    ),
  }),
  execute: async (args: { prompt: string }): Promise<{ insertedCount: number }> => {
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
});


