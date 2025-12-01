import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FC } from 'react';
import {
  Download,
  Wand2,
  Presentation,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Palette,
  ExternalLink,
  X,
  ArrowRight
} from 'lucide-react';
import { useDocument } from '@/hooks/use-document';
import { useTranslation } from 'react-i18next';
import { generatePresentation } from './services/ai-service';
import {
  PresentationData,
  ThemeId,
  GenerationParams,
  SlideLayout
} from './types';
import { THEMES, INITIAL_MARKDOWN, INITIAL_PRESENTATION } from './constants';
import { SlideRenderer } from './components/slide-renderer';

declare global {
  interface Window {
    PptxGenJS: any;
  }
}

const ExportGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
            <Presentation size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            导入到 Google Slides
          </h3>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
            <div>
              <h4 className="font-semibold text-gray-900">文件已下载</h4>
              <p className="text-sm text-gray-600 mt-1">
                我们已将您的演示文稿保存为 <code>.pptx</code> 文件到您的计算机。
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</div>
            <div>
              <h4 className="font-semibold text-gray-900">打开新演示文稿</h4>
              <p className="text-sm text-gray-600 mt-1">
                我们已在新标签页中为您打开了一个空白的 Google Slides。
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">3</div>
            <div>
              <h4 className="font-semibold text-gray-900">导入幻灯片</h4>
              <p className="text-sm text-gray-600 mt-1 mb-2">
                在 Google Slides 标签页中，按照以下步骤操作：
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium text-gray-700 flex flex-wrap items-center gap-2">
                <span>文件</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span>导入幻灯片...</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span>上传</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span>选择 .pptx 文件</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition active:scale-95"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppMakePPT: FC<{
  uri: string;
}> = ({ uri }) => {
  const { t } = useTranslation();
  const { content, setContent, loading, flush } = useDocument(uri, {
    autosave: false,
  });

  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [presentation, setPresentation] = useState<PresentationData>(INITIAL_PRESENTATION);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [showExportGuide, setShowExportGuide] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(ThemeId.MINIMAL_LIGHT);
  const [audience, setAudience] = useState("Professional Team");
  const [tone, setTone] = useState("Inspirational");
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!loading && content) {
      console.log("[AppMakePPT] Content loaded:", { contentLength: content.length, uri });
      try {
        const parsed = JSON.parse(content);
        if (parsed.markdown) {
          console.log("[AppMakePPT] Setting markdown from content:", parsed.markdown.substring(0, 100));
          setMarkdown(parsed.markdown);
        }
        if (parsed.presentation) {
          setPresentation(parsed.presentation);
        }
      } catch (e) {
        console.warn("[AppMakePPT] Failed to parse JSON, using raw content:", e);
        setMarkdown(content || INITIAL_MARKDOWN);
      }
    } else if (!loading && !content) {
      console.log("[AppMakePPT] Content is empty, retrying read:", uri);
      const retryTimer = setTimeout(async () => {
        try {
          const { fileSystemHelper } = await import("@/helpers/file-system.helper");
          const retryContent = await fileSystemHelper.service.read(uri);
          console.log("[AppMakePPT] Retry read result:", { 
            hasContent: !!retryContent, 
            contentLength: retryContent?.length || 0 
          });
          if (retryContent) {
            try {
              const parsed = JSON.parse(retryContent);
              if (parsed.markdown) {
                console.log("[AppMakePPT] Setting markdown from retry:", parsed.markdown.substring(0, 100));
                setMarkdown(parsed.markdown);
              }
              if (parsed.presentation) {
                setPresentation(parsed.presentation);
              }
            } catch (e) {
              console.warn("[AppMakePPT] Failed to parse retry content:", e);
              setMarkdown(retryContent || INITIAL_MARKDOWN);
            }
          }
        } catch (error) {
          console.warn("[AppMakePPT] Retry read failed:", error);
        }
      }, 500);
      return () => clearTimeout(retryTimer);
    }
  }, [loading, content, uri]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const { width, height } = previewContainerRef.current.getBoundingClientRect();
        const padding = window.innerWidth < 768 ? 16 : 64;
        const scaleX = Math.max((width - padding * 2) / 960, 0.3);
        const scaleY = Math.max((height - padding * 2) / 540, 0.3);
        const newScale = Math.min(scaleX, scaleY, 1.5);
        setScale(Math.max(newScale, 0.3));
      }
    };

    const resizeObserver = new ResizeObserver(updateScale);
    if (previewContainerRef.current) {
      resizeObserver.observe(previewContainerRef.current);
    }

    window.addEventListener('resize', updateScale);
    updateScale();

    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver.disconnect();
    };
  }, [isSidebarOpen]);

  const savePresentation = useCallback(async () => {
    const data = JSON.stringify({
      markdown,
      presentation,
      theme: selectedTheme,
      audience,
      tone,
      length,
    }, null, 2);
    setContent(data);
    await flush();
  }, [markdown, presentation, selectedTheme, audience, tone, length, setContent, flush]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    console.log("[AppMakePPT] Starting generation...");
    try {
      const params: GenerationParams = {
        markdown,
        theme: selectedTheme,
        audience,
        tone,
        length
      };

      console.log("[AppMakePPT] Calling generatePresentation with params:", { 
        markdownLength: markdown.length, 
        theme: selectedTheme, 
        audience, 
        tone, 
        length 
      });

      const data = await generatePresentation(params);
      
      console.log("[AppMakePPT] Generation successful, received data:", data);
      
      setPresentation(data);
      setCurrentSlideIndex(0);
      
      // Save asynchronously without blocking UI - use the new data directly
      const saveData = JSON.stringify({
        markdown,
        presentation: data, // Use the newly generated data
        theme: selectedTheme,
        audience,
        tone,
        length,
      }, null, 2);
      setContent(saveData);
      flush(saveData).catch((error) => {
        console.error("[AppMakePPT] Failed to save presentation:", error);
      });
    } catch (error) {
      console.error("[AppMakePPT] Failed to generate presentation:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`生成演示文稿失败：${errorMessage}\n\n请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. 控制台是否有详细错误信息`);
    } finally {
      console.log("[AppMakePPT] Generation process finished");
      setIsGenerating(false);
    }
  };

  const handleExportPPTX = async () => {
    if (!window.PptxGenJS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
      script.onload = () => {
        if (window.PptxGenJS) {
          exportPPTXFile();
        } else {
          alert("PPTX 生成库加载失败。");
        }
      };
      script.onerror = () => {
        alert("无法加载 PPTX 生成库。请检查网络连接。");
      };
      document.head.appendChild(script);
      return;
    }
    exportPPTXFile();
  };

  const exportPPTXFile = async () => {
    if (!window.PptxGenJS) return;

    const pptx = new window.PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = presentation.title;

    presentation.slides.forEach(slide => {
      const slidePage = pptx.addSlide();
      const theme = THEMES[selectedTheme];

      let bgColor = "FFFFFF";
      if (theme.bg.includes("gray-900")) bgColor = "111827";
      if (theme.bg.includes("indigo-900")) bgColor = "312E81";
      if (theme.bg.includes("slate-50")) bgColor = "F8FAFC";

      slidePage.background = { color: bgColor };

      const color = theme.text.includes("white") || theme.text.includes("slate-50") ? "FFFFFF" : "000000";

      slidePage.addText(slide.title, {
        x: 0.5, y: 0.5, w: '90%', h: 1,
        fontSize: 32,
        color,
        align: slide.layout === SlideLayout.TITLE ? 'center' : 'left',
        bold: true
      });

      if (slide.layout === SlideLayout.TITLE && slide.subtitle) {
        slidePage.addText(slide.subtitle, { x: 0.5, y: 2, w: '90%', fontSize: 20, color, align: 'center' });
      } else if (slide.layout === SlideLayout.BULLET_LIST) {
        slidePage.addText(slide.content.map(c => ({ text: c, options: { breakLine: true } })), {
          x: 0.5, y: 1.8, w: '90%', h: 4, fontSize: 18, color, bullet: true
        });
      } else if (slide.layout === SlideLayout.TWO_COLUMN) {
        slidePage.addText(slide.content.map(c => ({ text: c, options: { breakLine: true } })), {
          x: 0.5, y: 1.8, w: '45%', h: 4, fontSize: 16, color, bullet: true
        });
        if (slide.contentRight) {
          slidePage.addText(slide.contentRight.map(c => ({ text: c, options: { breakLine: true } })), {
            x: 5.0, y: 1.8, w: '45%', h: 4, fontSize: 16, color, bullet: true
          });
        }
      }

      if (slide.speakerNotes) {
        slidePage.addNotes(slide.speakerNotes);
      }
    });

    await pptx.writeFile({ fileName: `${presentation.title.replace(/\s+/g, '_')}.pptx` });
  };

  const handleGoogleSlidesFlow = async () => {
    await handleExportPPTX();
    setShowExportGuide(true);
    window.open('https://docs.google.com/presentation/create', '_blank');
  };

  const nextSlide = () => setCurrentSlideIndex(prev => Math.min(prev + 1, presentation.slides.length - 1));
  const prevSlide = () => setCurrentSlideIndex(prev => Math.max(prev - 1, 0));

  if (loading) {
    return <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="flex h-full w-full bg-gray-100 font-sans text-gray-800 overflow-hidden">
      <ExportGuideModal isOpen={showExportGuide} onClose={() => setShowExportGuide(false)} />

      {/* LEFT PANEL: Preview Canvas */}
      <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden relative min-w-0">

        {/* Sidebar Toggle Button - Always visible on the right edge of preview area */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 border-r-0 rounded-l-full p-1.5 md:p-2 shadow-lg z-30 hover:bg-gray-50 transition-colors active:scale-95"
          aria-label={isSidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
        >
          {isSidebarOpen ? <ChevronRight size={18} className="text-gray-600" /> : <ChevronLeft size={18} className="text-gray-600" />}
        </button>

        {/* Toolbar */}
        <div className="h-14 md:h-16 bg-white border-b border-gray-200 px-3 md:px-6 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <h2 className="font-medium text-gray-800 truncate text-sm md:text-base max-w-xs">{presentation.title}</h2>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-500 flex-shrink-0">
              {currentSlideIndex + 1} / {presentation.slides.length}
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button
              onClick={() => setSelectedTheme(ThemeId.MODERN_DARK)}
              className={`w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-900 border-2 ${selectedTheme === ThemeId.MODERN_DARK ? 'border-blue-500' : 'border-transparent'} transition-colors`}
              title={t('apps.makePPT.themes.MODERN_DARK')}
            />
            <button
              onClick={() => setSelectedTheme(ThemeId.MINIMAL_LIGHT)}
              className={`w-5 h-5 md:w-6 md:h-6 rounded-full bg-white border-2 border-gray-300 ${selectedTheme === ThemeId.MINIMAL_LIGHT ? 'ring-2 ring-blue-500' : ''} transition-colors`}
              title={t('apps.makePPT.themes.MINIMAL_LIGHT')}
            />
            <div className="h-6 w-px bg-gray-200 mx-1 md:mx-2 hidden sm:block"></div>

            <button
              onClick={handleExportPPTX}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
              title={t('apps.makePPT.downloadPPTX')}
            >
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t('apps.makePPT.downloadPPTX')}</span>
            </button>

            <button
              onClick={handleGoogleSlidesFlow}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              title={t('apps.makePPT.exportToGoogleSlides')}
            >
              <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden lg:inline">{t('apps.makePPT.exportToGoogleSlides')}</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div
          ref={previewContainerRef}
          className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto relative min-h-0"
        >
          {/* Slide Renderer */}
          {presentation.slides.length > 0 ? (
            <div className="transition-all duration-300 ease-in-out shadow-2xl" style={{ willChange: 'transform' }}>
              <SlideRenderer
                slide={presentation.slides[currentSlideIndex]}
                theme={THEMES[selectedTheme]}
                scale={scale}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <Presentation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('apps.makePPT.welcomeTitle')}</h3>
                <p className="text-gray-500">{t('apps.makePPT.welcomeDesc')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls (Bottom Overlay) */}
        {presentation.slides.length > 0 && (
          <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-white/90 backdrop-blur-sm p-1.5 md:p-2 rounded-full shadow-lg border border-gray-200/50 z-20">
            <button
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
              className="p-2 md:p-3 rounded-full hover:bg-gray-100 disabled:opacity-30 transition active:scale-95"
              aria-label="上一张幻灯片"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            </button>

            <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-[300px] scrollbar-hide px-2">
              {presentation.slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 flex-shrink-0
                     ${idx === currentSlideIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'}
                   `}
                  aria-label={`跳转到第 ${idx + 1} 张幻灯片`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              disabled={currentSlideIndex === presentation.slides.length - 1}
              className="p-2 md:p-3 rounded-full hover:bg-gray-100 disabled:opacity-30 transition active:scale-95"
              aria-label="下一张幻灯片"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            </button>
          </div>
        )}

      </div>

      {/* RIGHT PANEL: Editor & Controls */}
      <div
        className={`${isSidebarOpen
          ? 'md:w-1/2 lg:w-1/3'
          : 'w-0'
          } bg-white border-l border-gray-200 transition-all duration-300 flex flex-col overflow-hidden flex-shrink-0`}
      >
        <div className={`flex flex-col h-full ${!isSidebarOpen && 'hidden'}`}>
          <div className="p-3 md:p-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Presentation className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
              <h1 className="text-lg md:text-xl font-bold tracking-tight">{t('apps.makePPT.appTitle')}</h1>
            </div>
            <p className="text-xs text-gray-500">{t('apps.makePPT.appSubtitle')}</p>
          </div>

          <div className="p-3 md:p-5 space-y-3 md:space-y-4 bg-gray-50/50 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">{t('apps.makePPT.theme')}</label>
                <div className="relative">
                  <Palette className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value as ThemeId)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {Object.values(THEMES).map(theme => (
                      <option key={theme.id} value={theme.id}>{t(`apps.makePPT.themes.${theme.id}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">{t('apps.makePPT.audience')}</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">{t('apps.makePPT.tone')}</label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">{t('apps.makePPT.length')}</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="short">{t('apps.makePPT.lengthShort')}</option>
                  <option value="medium">{t('apps.makePPT.lengthMedium')}</option>
                  <option value="long">{t('apps.makePPT.lengthLong')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-3 md:p-5 overflow-hidden min-h-0">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase text-gray-400">{t('apps.makePPT.content')}</label>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="flex-1 w-full p-3 md:p-4 text-sm font-mono border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none bg-white leading-relaxed min-h-0"
              placeholder="# Enter your presentation content here..."
            />
          </div>

          <div className="p-3 md:p-5 border-t border-gray-100 bg-white flex-shrink-0">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-2.5 md:py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-white shadow-lg transition-all text-sm md:text-base
                ${isGenerating ? 'bg-indigo-400 cursor-wait' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95'}
              `}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  <span className="hidden sm:inline">{t('apps.makePPT.generatingSlides')}</span>
                  <span className="sm:hidden">{t('apps.makePPT.generating')}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">{t('apps.makePPT.generatePresentation')}</span>
                  <span className="sm:hidden">{t('apps.makePPT.generate')}</span>
                </>
              )}
            </button>
          </div>
        </div >
      </div >
    </div >
  );
};

