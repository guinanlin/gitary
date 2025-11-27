import { useEffect, useState } from "react";
import { useDocument } from "@/hooks/use-document";
import { aiContextService } from "@/services/ai/context-service";
import { cn } from "@/toolkit/utils/shadcn-utils";

interface Heading {
  level: number;
  text: string;
  id: string;
}

function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split("\n");
  const headings: Heading[] = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        let text = match[2].trim();
        text = text.replace(/\s+/g, " ");
        const id = `heading-${index}-${text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "")}`;
        headings.push({ level, text, id });
      }
    }
  });
  
  return headings;
}

function useMarkdownContent(uri: string | null) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!uri) {
      setContent("");
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    
    const loadContent = async () => {
      try {
        const { fileSystemHelper } = await import("@/helpers/file-system.helper");
        const fileContent = await fileSystemHelper.service.read(uri);
        if (!cancelled) {
          setContent(fileContent);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading markdown content:", error);
          setContent("");
          setLoading(false);
        }
      }
    };
    
    loadContent();
    
    return () => {
      cancelled = true;
    };
  }, [uri]);
  
  return { content, loading };
}

export const MarkdownOutlinePanel = () => {
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  
  const { content } = useMarkdownContent(currentUri);
  
  useEffect(() => {
    const updateCurrentUri = async () => {
      try {
        const pageContext = await aiContextService.getCurrentPageContext();
        if (pageContext?.uri && pageContext.openerId === "zenmark-editor") {
          setCurrentUri(pageContext.uri);
        } else {
          setCurrentUri(null);
        }
      } catch (error) {
        console.error("Error getting page context:", error);
        setCurrentUri(null);
      }
    };
    
    updateCurrentUri();
    const interval = setInterval(updateCurrentUri, 500);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (content && currentUri) {
      const extracted = extractHeadings(content);
      setHeadings(extracted);
    } else {
      setHeadings([]);
    }
  }, [content, currentUri]);
  
  const handleHeadingClick = (heading: Heading) => {
    const editorElement = document.querySelector(".zenmark-editor-content");
    if (!editorElement) {
      const proseMirror = document.querySelector(".ProseMirror");
      if (proseMirror) {
        const headingElements = proseMirror.querySelectorAll(`h${heading.level}`);
        headingElements.forEach((el) => {
          const text = el.textContent?.trim() || "";
          if (text === heading.text || text.replace(/\s+/g, " ") === heading.text) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }
      return;
    }
    
    const normalizeText = (text: string) => text.trim().replace(/\s+/g, " ");
    const targetText = normalizeText(heading.text);
    
    const headingElements = editorElement.querySelectorAll(`h${heading.level}`);
    let found = false;
    
    headingElements.forEach((el) => {
      const text = normalizeText(el.textContent || "");
      if (text === targetText) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        found = true;
      }
    });
    
    if (!found) {
      const allHeadings = editorElement.querySelectorAll("h1, h2, h3, h4, h5, h6");
      allHeadings.forEach((el) => {
        const text = normalizeText(el.textContent || "");
        if (text === targetText) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  };
  
  if (!currentUri) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <p className="text-sm text-muted-foreground">
          请打开一个 Markdown 文件以查看大纲
        </p>
      </div>
    );
  }
  
  if (headings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <p className="text-sm text-muted-foreground">
          当前文档没有标题
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth p-4">
      <nav className="space-y-1">
        {headings.map((heading, index) => (
          <button
            key={index}
            onClick={() => handleHeadingClick(heading)}
            className={cn(
              "block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors",
              "hover:bg-muted/80 hover:text-foreground",
              "text-muted-foreground",
              heading.level === 1 && "font-semibold text-foreground",
              heading.level === 2 && "font-medium",
              heading.level >= 3 && "text-muted-foreground/80"
            )}
            style={{
              paddingLeft: `${(heading.level - 1) * 12 + 8}px`,
            }}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
};

