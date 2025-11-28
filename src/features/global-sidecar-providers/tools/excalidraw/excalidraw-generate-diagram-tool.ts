import type { Tool } from "@agent-labs/agent-chat";
import { t } from "@/i18n/utils";
import { excalidrawAIService } from "@/services/ai/excalidraw-ai.service";
import { ensureExcalidrawAvailable } from "./utils";

export const excalidrawAIGenerateDiagramTool: Tool<
  { prompt: string; mode?: "append" | "replace" },
  { insertedCount: number; mode: "append" | "replace" }
> = {
  name: "excalidraw_ai_generate_diagram",
  description: t("excalidraw.tools.generateDiagramDescription"),
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: t("excalidraw.tools.generateDiagramPromptDescription"),
      },
      mode: {
        type: "string",
        enum: ["append", "replace"],
        description: t("excalidraw.tools.generateDiagramModeDescription"),
        default: "append",
      },
    },
    required: ["prompt"],
    additionalProperties: false,
  },
  async execute(args) {
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
};

