import { type DrawioXmlValue, DEFAULT_DRAWIO_XML } from "./drawio-shared";
import { useMemoizedFn } from "@/hooks/use-memoized-fn";
import { FC, useEffect, useMemo, useRef } from "react";
import { useDrawioRuntime } from "@/hooks/use-drawio-runtime";

interface DrawioEditorProps {
  initialXml: DrawioXmlValue | null;
  onChange: (xml: DrawioXmlValue) => void;
  onSave?: (xml: DrawioXmlValue) => void;
}

const DRAWIO_ORIGIN = "https://embed.diagrams.net";
const DRAWIO_BASE_URL = `${DRAWIO_ORIGIN}/?embed=1&ui=atlas&spin=1&proto=json&saveAndExit=0`;

export const DrawioEditor: FC<DrawioEditorProps> = ({
  initialXml,
  onChange,
  onSave,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const xmlRef = useRef<DrawioXmlValue | null>(
    initialXml || DEFAULT_DRAWIO_XML
  );
  const isInitializedRef = useRef(false);
  const initialXmlRef = useRef(initialXml);

  useEffect(() => {
    if (initialXml && !isInitializedRef.current) {
      xmlRef.current = initialXml;
      initialXmlRef.current = initialXml;
      isInitializedRef.current = true;
    } else if (initialXml && initialXml !== initialXmlRef.current) {
      initialXmlRef.current = initialXml;
      if (xmlRef.current !== initialXml) {
        xmlRef.current = initialXml;
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ action: "load", xml: initialXml }),
            DRAWIO_ORIGIN
          );
        }
      }
    }
  }, [initialXml]);

  useDrawioRuntime({
    xmlRef,
    iframeRef,
    onChange,
  });

  const memoizedOnChange = useMemoizedFn(onChange);
  const memoizedOnSave = useMemoizedFn(onSave || (() => {}));

  const handleMessage = useMemoizedFn((event: MessageEvent) => {
    if (event.origin !== DRAWIO_ORIGIN) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    if (event.data === "ready") {
      if (xmlRef.current) {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ action: "load", xml: xmlRef.current }),
          DRAWIO_ORIGIN
        );
      }
    } else if (typeof event.data === "string") {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "change") {
          if (data.xml) {
            xmlRef.current = data.xml;
            memoizedOnChange(data.xml);
          }
        } else if (data.event === "save") {
          if (data.xml) {
            xmlRef.current = data.xml;
            memoizedOnSave(data.xml);
          }
        } else if (data.event === "init") {
          if (xmlRef.current) {
            iframe.contentWindow?.postMessage(
              JSON.stringify({ action: "load", xml: xmlRef.current }),
              DRAWIO_ORIGIN
            );
          }
        }
      } catch (error) {
        console.error("Failed to parse draw.io message:", error);
      }
    }
  });

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const drawioUrl = useMemo(() => {
    const initialXmlForUrl = initialXmlRef.current || DEFAULT_DRAWIO_XML;
    return `${DRAWIO_BASE_URL}&xml=${encodeURIComponent(initialXmlForUrl)}`;
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={drawioUrl}
      className="w-full h-full border-0"
      title="Draw.io Editor"
    />
  );
};

