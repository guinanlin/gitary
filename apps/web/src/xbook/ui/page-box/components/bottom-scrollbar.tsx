import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/toolkit/utils/shadcn-utils";

interface BottomScrollbarProps {
  scrollContainerRef: React.MutableRefObject<HTMLElement | null>;
  className?: string;
}

export const BottomScrollbar = ({
  scrollContainerRef,
  className,
}: BottomScrollbarProps) => {
  const [scrollInfo, setScrollInfo] = useState({
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
  });
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollInfo = () => {
      setScrollInfo({
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
      });
    };

    updateScrollInfo();

    container.addEventListener("scroll", updateScrollInfo);
    const resizeObserver = new ResizeObserver(updateScrollInfo);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollInfo);
      resizeObserver.disconnect();
    };
  }, [scrollContainerRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    const scrollbar = scrollbarRef.current;
    if (!container || !scrollbar) return;

    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = container.scrollLeft;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      const scrollbarWidth = scrollbar.clientWidth;
      const thumbWidth = scrollbarWidth * (scrollInfo.clientWidth / scrollInfo.scrollWidth);
      const maxThumbLeft = scrollbarWidth - thumbWidth;
      const scrollRatio = scrollInfo.scrollWidth / scrollbarWidth;

      const newScrollLeft = startScrollLeftRef.current + deltaX * scrollRatio;
      container.scrollLeft = Math.max(0, Math.min(newScrollLeft, scrollInfo.scrollWidth - scrollInfo.clientWidth));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    const scrollbar = scrollbarRef.current;
    if (!container || !scrollbar || isDraggingRef.current) return;

    const rect = scrollbar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const scrollbarWidth = scrollbar.clientWidth;
    const scrollRatio = scrollInfo.scrollWidth / scrollbarWidth;
    const newScrollLeft = clickX * scrollRatio - scrollInfo.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, Math.min(newScrollLeft, scrollInfo.scrollWidth - scrollInfo.clientWidth)),
      behavior: "smooth",
    });
  };

  const scrollRatio = scrollInfo.scrollWidth > scrollInfo.clientWidth
    ? scrollInfo.clientWidth / scrollInfo.scrollWidth
    : 1;
  const thumbWidth = scrollRatio * 100;
  const thumbLeft = scrollInfo.scrollWidth > scrollInfo.clientWidth
    ? (scrollInfo.scrollLeft / (scrollInfo.scrollWidth - scrollInfo.clientWidth)) * (100 - thumbWidth)
    : 0;

  if (scrollInfo.scrollWidth <= scrollInfo.clientWidth) {
    return null;
  }

  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      ref={scrollbarRef}
      className={cn("bottom-scrollbar", className)}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "12px",
        backgroundColor: "var(--tab-bar-bg-color, #f5f5f5)",
        borderTop: "1px solid var(--border-light, #e0e0e0)",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      <Box
        className="scrollbar-thumb"
        style={{
          position: "absolute",
          left: `${thumbLeft}%`,
          width: `${thumbWidth}%`,
          height: "8px",
          top: "2px",
          backgroundColor: "var(--primary-color, #3b82f6)",
          borderRadius: "4px",
          cursor: isDraggingRef.current ? "grabbing" : "grab",
          transition: isDraggingRef.current
            ? "none"
            : "left 0.1s ease, width 0.1s ease, opacity 0.2s ease",
          opacity: isHovered || isDraggingRef.current ? 1 : 0.7,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e);
        }}
      />
    </Box>
  );
};

