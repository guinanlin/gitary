import { useState } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { WeatherCard } from "./weather-card";
import { FsResultCard } from "./fs-result-card";

interface ToolInvocationListProps {
  message: {
    toolInvocations?: Array<{
      toolCallId: string;
      toolName: string;
      status: string;
      args: unknown;
      result?: unknown;
      error?: string;
    }>;
  };
}

/**
 * Renders tool invocation parts for a single assistant message.
 * - Keeps the raw structure from AgentChat (toolInvocation).
 * - Limits height with scroll so large args/results不会撑爆布局。
 */
export const ToolInvocationList = ({ message }: ToolInvocationListProps) => {
  const toolInvocations = message.toolInvocations || [];

  if (!toolInvocations.length) return null;

  return (
    <div className="mt-2 space-y-2">
      {toolInvocations.map((invocation, idx) => {
        return (
          <ToolInvocationItem key={invocation.toolCallId || idx} invocation={invocation} />
        );
      })}
    </div>
  );
};

interface ToolInvocationItemProps {
  invocation: {
    toolCallId: string;
    toolName: string;
    status: string;
    args: unknown;
    result?: unknown;
    error?: string;
  };
}

const ToolInvocationItem = ({ invocation }: ToolInvocationItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const isPending =
    invocation.status === "call" || invocation.status === "partial-call";
  const isError = invocation.status === "error";
  const isWeatherTool = invocation.toolName === "getWeather" && invocation.status === "result";
  const isFsTool = (invocation.toolName === "fs_readdir" || 
                    invocation.toolName === "fs_readFile" || 
                    invocation.toolName === "fs_stat") && 
                    invocation.status === "result";

  const argsPreview =
    typeof invocation.args === "string"
      ? invocation.args
      : JSON.stringify(invocation.args, null, 2);

  const hasResult =
    invocation.result !== undefined ||
    (invocation.error && invocation.error.length > 0);

  const resultText =
    invocation.error && invocation.error.length
      ? `error: ${invocation.error}`
      : invocation.result !== undefined
      ? typeof invocation.result === "string"
        ? invocation.result
        : JSON.stringify(invocation.result, null, 2)
      : undefined;

  const parseWeatherResult = () => {
    if (!isWeatherTool || !resultText) return null;

    try {
      const args = typeof invocation.args === "object" && invocation.args !== null
        ? invocation.args as { city?: string; unit?: "C" | "F" }
        : {};
      
      const city = args.city || "";
      const unit = args.unit || "C";

      const match = resultText.match(/(.+?)当前天气[：:](.+?)，温度\s*(\d+)/);
      if (match) {
        const [, resultCity, description, tempStr] = match;
        const temperature = parseInt(tempStr, 10);
        return {
          city: resultCity.trim() || city,
          description: description.trim(),
          temperature,
          unit,
        };
      }

      return null;
    } catch (e) {
      console.warn("[WeatherCard] Failed to parse weather result:", e);
      return null;
    }
  };

  const weatherData = parseWeatherResult();

  const parseFsResult = () => {
    if (!isFsTool || !invocation.result) return null;

    try {
      let result = invocation.result;
      
      if (typeof result === "string") {
        result = JSON.parse(result);
      }
      
      if (result && typeof result === "object" && result.kind) {
        return result;
      }
      
      return null;
    } catch (e) {
      console.warn("[FsResultCard] Failed to parse FS result:", e);
      return null;
    }
  };

  const fsResult = parseFsResult();

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wide">
            <span>
              Tool: {invocation.toolName}{" "}
              <span className="ml-1 text-[10px] font-normal opacity-70">
                ({invocation.status})
              </span>
            </span>
            {isPending && (
              <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
            )}
            {isError && (
              <span className="ml-1 text-[11px] text-red-500">错误</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground px-1 py-0.5 rounded-sm"
            aria-label={expanded ? "收起工具详情" : "展开工具详情"}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {expanded && (
          <div className="space-y-1 mt-1">
            <div className="text-[11px] font-mono opacity-80">
              <span className="font-semibold">args:</span>{" "}
              <span className="break-all whitespace-pre-wrap">
                {argsPreview}
              </span>
            </div>
            {hasResult && resultText && !isWeatherTool && !isFsTool && (
              <div className="text-[11px] font-mono opacity-80 max-h-40 overflow-y-auto overflow-x-auto pr-1">
                <span className="font-semibold">result:</span>{" "}
                <span className="break-all whitespace-pre-wrap">
                  {resultText}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isWeatherTool && weatherData && (
        <WeatherCard
          city={weatherData.city}
          description={weatherData.description}
          temperature={weatherData.temperature}
          unit={weatherData.unit}
        />
      )}

      {isFsTool && fsResult && (
        <FsResultCard result={fsResult} />
      )}
    </div>
  );
};
