import { tool } from 'ai';
import { z } from 'zod';
import { t } from "@/i18n/utils";
import { ensureExcalidrawAvailable } from "./utils";
import { validateAndCompleteElements } from "./element-validator";

export const excalidrawAppendDiagramTool = tool({
  description: t("excalidraw.tools.appendDiagramDescription"),
  inputSchema: z.object({
    elements: z.array(z.any()).describe(
      t("excalidraw.tools.appendDiagramElementsDescription")
    ),
  }),
  execute: async (args: { elements: unknown[] }): Promise<{ insertedCount: number }> => {
    const { handle, elements: currentElements } = ensureExcalidrawAvailable();
    const elements = args?.elements ?? [];

    if (!Array.isArray(elements) || elements.length === 0) {
      throw new Error(t("excalidraw.tools.elementsRequired"));
    }

    const validatedElements = validateAndCompleteElements(elements);
    const combined = [...currentElements, ...validatedElements];

    handle.updateScene({ elements: combined });

    return {
      insertedCount: validatedElements.length,
    };
  },
});


