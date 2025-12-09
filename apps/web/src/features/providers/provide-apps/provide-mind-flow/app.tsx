import { MindFlowCanvas } from "@/components/mind-flow-canvas";
import { DEFAULT_MIND_MAP_DATA } from "@/components/mind-map/constants";
import {
  buildMindMapSnapshot,
  cloneMindMapData,
  normalizeMindMapData,
} from "@/components/mind-map/data-helpers";
import { MindMapStore } from "@/components/mind-map/mind-map-store";
import type { MindMapData } from "@/components/mind-map/types";
import { MindMapSaveStatus } from "@/components/mind-map/types";
import { useMemoizedFn } from "@/hooks/use-memoized-fn";
import { Uri } from "@/toolkit/vscode/uri";
import { useEffect, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { debounceTime, distinctUntilChanged, map, shareReplay, skip } from "rxjs/operators";
import xbook from "xbook/index";

const SAVE_DEBOUNCE_MS = 1000;

export const AppMindFlow: FC<{
  uri: string;
}> = ({ uri }) => {
  const { t } = useTranslation();
  const [store, setStore] = useState<MindMapStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<MindMapSaveStatus>(MindMapSaveStatus.IDLE);

  const persistData = useMemoizedFn(async (data: MindMapData) => {
    await xbook.fs.writeFile(
      Uri.parse(uri),
      new TextEncoder().encode(JSON.stringify(cloneMindMapData(data))),
      { create: true, overwrite: true },
    );
  });

  const loadData = useMemoizedFn(async () => {
    try {
      const data = await xbook.fs.readFile(Uri.parse(uri));
      const parsed = JSON.parse(new TextDecoder().decode(data));
      return normalizeMindMapData(parsed);
    } catch (error) {
      console.warn("Load mind map failed, using defaults:", error);
      return cloneMindMapData(DEFAULT_MIND_MAP_DATA);
    }
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await loadData();
      if (cancelled) return;
      setStore((prev) => {
        if (!prev) {
          return new MindMapStore(data);
        }
        prev.replaceData(data);
        return prev;
      });
      setSaveStatus(MindMapSaveStatus.IDLE);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData, uri]);

  useEffect(() => {
    if (!store) return;
    const shared$ = store.data$.pipe(
      map((data) => cloneMindMapData(data)),
      distinctUntilChanged(
        (a, b) => buildMindMapSnapshot(a) === buildMindMapSnapshot(b),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    const dirtySub = shared$.pipe(skip(1)).subscribe(() => {
      setSaveStatus(MindMapSaveStatus.DIRTY);
    });

    const saveSub = shared$
      .pipe(skip(1), debounceTime(SAVE_DEBOUNCE_MS))
      .subscribe(async (data) => {
        try {
          setSaveStatus(MindMapSaveStatus.SAVING);
          await persistData(data);
          setSaveStatus(MindMapSaveStatus.SAVED);
        } catch (error) {
          console.error("Auto save mind map failed:", error);
          setSaveStatus(MindMapSaveStatus.ERROR);
        }
      });

    return () => {
      dirtySub.unsubscribe();
      saveSub.unsubscribe();
    };
  }, [store, persistData]);

  const handleManualSave = useMemoizedFn(async () => {
    if (!store) return;
    try {
      setSaveStatus(MindMapSaveStatus.SAVING);
      await persistData(store.getCurrentData());
      setSaveStatus(MindMapSaveStatus.SAVED);
    } catch (error) {
      console.error("Manual save mind map failed:", error);
      setSaveStatus(MindMapSaveStatus.ERROR);
    }
  });

  useEffect(() => {
    if (saveStatus !== MindMapSaveStatus.SAVED) return;
    const timer = window.setTimeout(() => {
      setSaveStatus(MindMapSaveStatus.IDLE);
    }, 2000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [saveStatus]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === "s" || event.key === "S")) {
        event.preventDefault();
        void handleManualSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleManualSave]);

  if (!uri) {
    return <div className="p-4 text-sm text-muted-foreground">{t("mindFlow.uriRequired")}</div>;
  }

  if (loading || !store) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
        {t("mindFlow.loading")}
      </div>
    );
  }

  return <MindFlowCanvas store={store} saveStatus={saveStatus} />;
};
