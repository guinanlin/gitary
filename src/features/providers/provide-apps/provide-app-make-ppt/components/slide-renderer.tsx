import React from 'react';
import { SlideContent, Theme, SlideLayout } from '../types';

interface SlideRendererProps {
  slide: SlideContent;
  theme: Theme;
  scale?: number;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, theme, scale = 1 }) => {
  const containerStyle: React.CSSProperties = {
    width: '960px',
    height: '540px',
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    maxWidth: '100%',
    maxHeight: '100%',
  };

  const CommonClasses = `w-full h-full p-12 flex flex-col ${theme.bg} ${theme.text} transition-colors duration-300`;

  const renderContent = () => {
    switch (slide.layout) {
      case SlideLayout.TITLE:
        return (
          <div className={`${CommonClasses} justify-center items-center text-center`}>
            <h1 className={`text-6xl mb-6 ${theme.fontHeading} ${theme.accent}`}>{slide.title}</h1>
            {slide.subtitle && <p className={`text-3xl opacity-80 ${theme.fontBody}`}>{slide.subtitle}</p>}
            {slide.footer && <div className="absolute bottom-8 text-sm opacity-50">{slide.footer}</div>}
          </div>
        );

      case SlideLayout.TWO_COLUMN:
        return (
          <div className={`${CommonClasses}`}>
             <h2 className={`text-4xl mb-8 ${theme.fontHeading} ${theme.accent}`}>{slide.title}</h2>
             <div className="flex-1 grid grid-cols-2 gap-8">
                <div className={`${theme.secondaryBg} p-6 rounded-lg`}>
                  <ul className={`space-y-4 text-xl ${theme.fontBody}`}>
                    {slide.content.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className={`mr-2 ${theme.accent}`}>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`${theme.secondaryBg} p-6 rounded-lg`}>
                  {slide.contentRight && (
                    <ul className={`space-y-4 text-xl ${theme.fontBody}`}>
                      {slide.contentRight.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className={`mr-2 ${theme.accent}`}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
             </div>
             {slide.footer && <div className="mt-8 text-sm opacity-50">{slide.footer}</div>}
          </div>
        );
      
      case SlideLayout.QUOTE:
        return (
           <div className={`${CommonClasses} justify-center relative`}>
             <div className="absolute top-12 left-12 text-9xl opacity-10 font-serif">"</div>
             <blockquote className={`text-5xl text-center leading-tight ${theme.fontHeading}`}>
               {slide.content[0] || slide.title}
             </blockquote>
             <p className={`text-right mt-8 text-2xl ${theme.accent} ${theme.fontBody}`}>
               — {slide.subtitle || "Source"}
             </p>
           </div>
        );
        
      case SlideLayout.BIG_NUMBER:
        return (
          <div className={`${CommonClasses} justify-center items-center text-center`}>
            <div className={`text-9xl font-bold mb-4 ${theme.accent} ${theme.fontHeading}`}>
              {slide.content[0]}
            </div>
            <h2 className={`text-4xl ${theme.fontBody}`}>{slide.title}</h2>
             {slide.footer && <div className="absolute bottom-8 text-sm opacity-50">{slide.footer}</div>}
          </div>
        );

      case SlideLayout.BULLET_LIST:
      default:
        return (
          <div className={`${CommonClasses}`}>
            <h2 className={`text-4xl mb-8 border-b-2 pb-4 ${theme.accent} border-opacity-30 ${theme.fontHeading}`}>
              {slide.title}
            </h2>
            <div className="flex-1">
              <ul className={`space-y-4 text-2xl ${theme.fontBody}`}>
                {slide.content.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-3 opacity-60">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {slide.footer && <div className="mt-auto pt-4 text-sm opacity-50">{slide.footer}</div>}
          </div>
        );
    }
  };

  return (
    <div style={containerStyle} className="shadow-2xl rounded-sm relative">
      {renderContent()}
    </div>
  );
};


