/**
 * Manuscript Reader Component
 * 
 * A specialized component for reading manuscripts in the anonymous review interface.
 * Provides optimal typography, navigation, and annotation capabilities while
 * maintaining anonymity protection.
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Bookmark,
  MessageSquare,
  Highlight,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings
} from 'lucide-react';

interface ManuscriptSection {
  id: string;
  title: string;
  content: string;
  page?: number;
  annotations?: Annotation[];
}

interface Annotation {
  id: string;
  type: 'highlight' | 'comment' | 'bookmark' | 'concern';
  text: string;
  comment?: string;
  position: {
    start: number;
    end: number;
  };
  timestamp: Date;
  anonymousId: string;
}

interface ManuscriptReaderProps {
  manuscript: {
    id: string;
    title: string;
    sections: ManuscriptSection[];
    totalPages?: number;
    wordCount?: number;
  };
  anonymousId: string;
  onAnnotation?: (annotation: Omit<Annotation, 'id' | 'timestamp' | 'anonymousId'>) => void;
  onSectionChange?: (sectionId: string) => void;
}

/**
 * Reading settings panel
 */
function ReadingSettings({
  fontSize,
  lineHeight,
  theme,
  onFontSizeChange,
  onLineHeightChange,
  onThemeChange,
}: {
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onThemeChange: (theme: 'light' | 'dark' | 'sepia') => void;
}) {
  return (
    <Card className="absolute right-4 top-4 w-64 z-10">
      <CardContent className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Font Size</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFontSizeChange(Math.max(12, fontSize - 1))}
            >
              -
            </Button>
            <span className="text-sm min-w-12 text-center">{fontSize}px</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFontSizeChange(Math.min(20, fontSize + 1))}
            >
              +
            </Button>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Line Height</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLineHeightChange(Math.max(1.2, lineHeight - 0.1))}
            >
              -
            </Button>
            <span className="text-sm min-w-12 text-center">{lineHeight.toFixed(1)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLineHeightChange(Math.min(2.0, lineHeight + 0.1))}
            >
              +
            </Button>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Theme</label>
          <div className="grid grid-cols-3 gap-1">
            {(['light', 'dark', 'sepia'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => onThemeChange(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Section navigation component
 */
function SectionNavigation({
  sections,
  currentSection,
  onSectionChange,
}: {
  sections: ManuscriptSection[];
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sections.map((section, index) => (
        <Button
          key={section.id}
          variant={currentSection === section.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSectionChange(section.id)}
          className="text-xs"
        >
          {section.title}
        </Button>
      ))}
    </div>
  );
}

/**
 * Annotation toolbar
 */
function AnnotationToolbar({
  onAnnotationType,
  activeType,
}: {
  onAnnotationType: (type: 'highlight' | 'comment' | 'bookmark' | 'concern') => void;
  activeType?: string;
}) {
  const tools = [
    { type: 'highlight' as const, icon: Highlight, label: 'Highlight', color: 'text-yellow-600' },
    { type: 'comment' as const, icon: MessageSquare, label: 'Comment', color: 'text-blue-600' },
    { type: 'bookmark' as const, icon: Bookmark, label: 'Bookmark', color: 'text-green-600' },
    { type: 'concern' as const, icon: Eye, label: 'Concern', color: 'text-red-600' },
  ];

  return (
    <div className="flex items-center gap-1">
      {tools.map((tool) => (
        <Button
          key={tool.type}
          variant={activeType === tool.type ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onAnnotationType(tool.type)}
          className={activeType === tool.type ? '' : tool.color}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}

/**
 * Main manuscript reader component
 */
export function ManuscriptReader({
  manuscript,
  anonymousId,
  onAnnotation,
  onSectionChange,
}: ManuscriptReaderProps) {
  const [currentSection, setCurrentSection] = useState(manuscript.sections[0]?.id || '');
  const [zoom, setZoom] = useState(100);
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [activeAnnotationType, setActiveAnnotationType] = useState<string>();
  const [selectedText, setSelectedText] = useState<{ text: string; range: Range } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const currentSectionData = manuscript.sections.find(s => s.id === currentSection);

  const handleSectionChange = useCallback((sectionId: string) => {
    setCurrentSection(sectionId);
    onSectionChange?.(sectionId);
  }, [onSectionChange]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      setSelectedText({
        text: selection.toString(),
        range: range.cloneRange()
      });
    } else {
      setSelectedText(null);
    }
  }, []);

  const handleAnnotation = useCallback((type: 'highlight' | 'comment' | 'bookmark' | 'concern') => {
    if (!selectedText) return;

    const annotation = {
      type,
      text: selectedText.text,
      position: {
        start: selectedText.range.startOffset,
        end: selectedText.range.endOffset,
      },
    };

    onAnnotation?.(annotation);
    setSelectedText(null);
  }, [selectedText, onAnnotation]);

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-amber-50 text-amber-900',
  };

  return (
    <div className="relative h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-16 text-center">{zoom}%</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <AnnotationToolbar
            onAnnotationType={handleAnnotation}
            activeType={activeAnnotationType}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {manuscript.sections.indexOf(currentSectionData!) + 1} of {manuscript.sections.length}
          </span>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="p-3 border-b">
        <SectionNavigation
          sections={manuscript.sections}
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
        />
      </div>

      {/* Reading Settings (conditionally shown) */}
      {showSettings && (
        <ReadingSettings
          fontSize={fontSize}
          lineHeight={lineHeight}
          theme={theme}
          onFontSizeChange={setFontSize}
          onLineHeightChange={setLineHeight}
          onThemeChange={setTheme}
        />
      )}

      {/* Main Content */}
      <ScrollArea className="h-[calc(100%-120px)]">
        <div
          ref={contentRef}
          className={`p-6 ${themeClasses[theme]} transition-colors`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${10000 / zoom}%`,
          }}
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
        >
          {currentSectionData && (
            <article className="max-w-4xl mx-auto">
              <header className="mb-8">
                <h1 className="text-2xl font-bold mb-4">
                  {currentSectionData.title}
                </h1>
              </header>
              
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: currentSectionData.content }}
              />
            </article>
          )}
          
          {selectedText && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20">
              <Card className="p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    "{selectedText.text.substring(0, 30)}..."
                  </span>
                  <Separator orientation="vertical" className="h-6" />
                  <AnnotationToolbar
                    onAnnotationType={handleAnnotation}
                    activeType={activeAnnotationType}
                  />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={manuscript.sections.indexOf(currentSectionData!) === 0}
          onClick={() => {
            const currentIndex = manuscript.sections.indexOf(currentSectionData!);
            if (currentIndex > 0) {
              handleSectionChange(manuscript.sections[currentIndex - 1].id);
            }
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={manuscript.sections.indexOf(currentSectionData!) === manuscript.sections.length - 1}
          onClick={() => {
            const currentIndex = manuscript.sections.indexOf(currentSectionData!);
            if (currentIndex < manuscript.sections.length - 1) {
              handleSectionChange(manuscript.sections[currentIndex + 1].id);
            }
          }}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}