import { tool } from 'ai';
import { z } from 'zod';
import { t } from "@/i18n/utils";
import { ensureExcalidrawAvailable } from "./utils";
import { validateAndCompleteElements } from "./element-validator";

export const excalidrawCreateDiagramTool = tool({
  description: t("excalidraw.tools.createDiagramDescription"),
  inputSchema: z.object({
    elements: z.array(z.any()).describe(
      t("excalidraw.tools.createDiagramElementsDescription")
    ),
    mode: z.enum(["append", "replace"]).optional().default("append").describe(
      t("excalidraw.tools.createDiagramModeDescription")
    ),
  }),
  execute: async (args: { elements: unknown[]; mode?: "append" | "replace" }): Promise<{ insertedCount: number; mode: "append" | "replace" }> => {
    const { handle, elements: currentElements } = ensureExcalidrawAvailable();
    const elements = args?.elements ?? [];
    const mode: "append" | "replace" =
      args?.mode === "replace" ? "replace" : "append";

    if (!Array.isArray(elements) || elements.length === 0) {
      throw new Error(t("excalidraw.tools.elementsRequired"));
    }

    const validatedElements = validateAndCompleteElements(elements);
    const combined =
      mode === "append"
        ? [...currentElements, ...validatedElements]
        : [...validatedElements];

    handle.updateScene({ elements: combined });

    return {
      insertedCount: validatedElements.length,
      mode,
    };
  },
});


