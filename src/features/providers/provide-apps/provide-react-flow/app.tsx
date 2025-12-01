import { FlowDemoCanvas } from "@/components/flow-demo-canvas";
import { useMemoizedFn } from "@/hooks/use-memoized-fn";
import { Uri } from "@/toolkit/vscode/uri";
import { FC, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import xbook from "xbook/index";

export const AppFlowDemo: FC<{
  uri: string;
}> = ({ uri }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const saveData = useMemoizedFn(async (data: { nodes: any[]; edges: any[] }) => {
    await xbook.fs.writeFile(
      Uri.parse(uri),
      new TextEncoder().encode(JSON.stringify(data, null, 2)),
      { create: true, overwrite: true }
    );
  });

  const loadData = useMemoizedFn(async () => {
    try {
      const data = await xbook.fs.readFile(Uri.parse(uri));
      const parsed = JSON.parse(new TextDecoder().decode(data));
      return parsed;
    } catch (error) {
      console.warn("Load flow data failed:", error);
      return { nodes: [], edges: [] };
    }
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await loadData();
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData, uri]);

  if (!uri) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("reactFlow.uriRequired")}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
        {t("reactFlow.loading")}
      </div>
    );
  }

  return <FlowDemoCanvas saveData={saveData} loadData={loadData} />;
}; 