import type { Tool } from "@agent-labs/agent-chat";
import { t } from "@/i18n/utils";
import { ensureExcalidrawAvailable } from "./utils";
import { validateAndCompleteElements } from "./element-validator";

export const excalidrawCreateDiagramTool: Tool<
  { elements: unknown[]; mode?: "append" | "replace" },
  { insertedCount: number; mode: "append" | "replace" }
> = {
  name: "excalidraw_create_diagram",
  description: t("excalidraw.tools.createDiagramDescription"),
  parameters: {
    type: "object",
    properties: {
      elements: {
        type: "array",
        description: t("excalidraw.tools.createDiagramElementsDescription"),
        items: {
          type: "object",
        },
      },
      mode: {
        type: "string",
        enum: ["append", "replace"],
        description: t("excalidraw.tools.createDiagramModeDescription"),
        default: "append",
      },
    },
    required: ["elements"],
    additionalProperties: false,
  },
  async execute(args) {
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
};

