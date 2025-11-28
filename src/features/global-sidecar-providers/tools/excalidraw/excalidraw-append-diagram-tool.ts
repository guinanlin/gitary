import type { Tool } from "@agent-labs/agent-chat";
import { t } from "@/i18n/utils";
import { ensureExcalidrawAvailable } from "./utils";
import { validateAndCompleteElements } from "./element-validator";

export const excalidrawAppendDiagramTool: Tool<
  { elements: unknown[] },
  { insertedCount: number }
> = {
  name: "excalidraw_append_diagram",
  description: t("excalidraw.tools.appendDiagramDescription"),
  parameters: {
    type: "object",
    properties: {
      elements: {
        type: "array",
        description: t("excalidraw.tools.appendDiagramElementsDescription"),
        items: {
          type: "object",
        },
      },
    },
    required: ["elements"],
    additionalProperties: false,
  },
  async execute(args) {
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
};

