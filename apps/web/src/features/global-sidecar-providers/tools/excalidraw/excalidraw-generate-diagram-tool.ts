import { tool } from 'ai';
import { z } from 'zod';
import { t } from "@/i18n/utils";
import { excalidrawAIService } from "@/services/ai/excalidraw-ai.service";
import { ensureExcalidrawAvailable } from "./utils";

export const excalidrawAIGenerateDiagramTool = tool({
  description: t("excalidraw.tools.generateDiagramDescription"),
  inputSchema: z.object({
    prompt: z.string().describe(
      t("excalidraw.tools.generateDiagramPromptDescription")
    ),
    mode: z.enum(["append", "replace"]).optional().default("append").describe(
      t("excalidraw.tools.generateDiagramModeDescription")
    ),
  }),
  execute: async (args: { prompt: string; mode?: "append" | "replace" }): Promise<{ insertedCount: number; mode: "append" | "replace" }> => {
    const { handle, elements: currentElements } = ensureExcalidrawAvailable();
    const prompt = (args?.prompt ?? "").trim();
    const mode: "append" | "replace" =
      args?.mode === "replace" ? "replace" : "append";

    if (!prompt) {
      throw new Error(t("excalidraw.tools.promptRequired"));
    }

    const newElements = await excalidrawAIService.generateDiagram(prompt);
    const combined =
      mode === "append"
        ? [...currentElements, ...newElements]
        : [...newElements];

    handle.updateScene({ elements: combined });

    return {
      insertedCount: newElements.length,
      mode,
    };
  },
});


