'use client';

import React, { useState } from 'react';
import type { BrandingTypography, TypographyFont, TypographyScale } from '@shared/types';

interface TypographyEditorProps {
  typography: BrandingTypography;
  onChange: (typography: BrandingTypography) => void;
  className?: string;
}

// Academic-optimized font options
const ACADEMIC_FONTS = {
  serif: [
    { 
      family: 'Crimson Text', 
      source: 'google' as const,
      description: 'Traditional scholarly serif, excellent for research papers',
      weights: [400, 600, 700],
      styles: ['normal' as const, 'italic' as const]
    },
    { 
      family: 'Libre Baskerville', 
      source: 'google' as const,
      description: 'Classic academic serif with high readability',
      weights: [400, 700],
      styles: ['normal' as const, 'italic' as const]
    },
    { 
      family: 'Lora', 
      source: 'google' as const,
      description: 'Modern scholarly serif, balanced for digital reading',
      weights: [400, 500, 600, 700],
      styles: ['normal' as const, 'italic' as const]
    },
    { 
      family: 'PT Serif', 
      source: 'google' as const,
      description: 'Professional serif designed for academic publications',
      weights: [400, 700],
      styles: ['normal' as const, 'italic' as const]
    }
  ],
  sans: [
    { 
      family: 'Inter', 
      source: 'google' as const,
      description: 'Modern sans-serif optimized for UI and body text',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal' as const]
    },
    { 
      family: 'Source Sans Pro', 
      source: 'google' as const,
      description: 'Clean, academic sans-serif with excellent legibility',
      weights: [300, 400, 600, 700],
      styles: ['normal' as const, 'italic' as const]
    },
    { 
      family: 'IBM Plex Sans', 
      source: 'google' as const,
      description: 'Professional sans-serif with scientific heritage',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal' as const, 'italic' as const]
    },
    { 
      family: 'Nunito Sans', 
      source: 'google' as const,
      description: 'Friendly yet professional sans-serif',
      weights: [300, 400, 600, 700],
      styles: ['normal' as const]
    }
  ],
  mono: [
    { 
      family: 'Fira Code', 
      source: 'google' as const,
      description: 'Code font with programming ligatures',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal' as const]
    },
    { 
      family: 'JetBrains Mono', 
      source: 'google' as const,
      description: 'Developer-focused monospace with excellent readability',
      weights: [300, 400, 500, 600, 700, 800],
      styles: ['normal' as const, 'italic' as const]
    },
    { 
      family: 'Source Code Pro', 
      source: 'google' as const,
      description: 'Clean monospace for code and technical content',
      weights: [300, 400, 600, 700],
      styles: ['normal' as const]
    }
  ]
};

// Typography scale presets for academic journals
const TYPOGRAPHY_PRESETS = [
  {
    name: 'Traditional Academic',
    description: 'Classic academic typography with generous spacing',
    baseSize: 18,
    scaleRatio: 1.333, // Perfect Fourth
    lineHeight: { tight: 1.2, normal: 1.6, loose: 1.8 }
  },
  {
    name: 'Modern Research',
    description: 'Contemporary academic style with improved readability',
    baseSize: 16,
    scaleRatio: 1.25, // Major Third
    lineHeight: { tight: 1.25, normal: 1.5, loose: 1.75 }
  },
  {
    name: 'Compact Professional',
    description: 'Space-efficient while maintaining readability',
    baseSize: 15,
    scaleRatio: 1.2, // Minor Third
    lineHeight: { tight: 1.2, normal: 1.4, loose: 1.6 }
  }
];

export function TypographyEditor({ typography, onChange, className = '' }: TypographyEditorProps) {
  const [activePreview, setActivePreview] = useState<'heading' | 'body' | 'mono'>('heading');

  // Update font
  const handleFontChange = (fontType: 'headingFont' | 'bodyFont' | 'monoFont', font: TypographyFont) => {
    onChange({
      ...typography,
      [fontType]: font
    });
  };

  // Update typography scale
  const handleScaleChange = (scale: Partial<TypographyScale>) => {
    onChange({
      ...typography,
      scale: {
        ...typography.scale,
        ...scale
      }
    });
  };

  // Apply typography preset
  const applyPreset = (preset: typeof TYPOGRAPHY_PRESETS[0]) => {
    handleScaleChange({
      baseSize: preset.baseSize,
      scaleRatio: preset.scaleRatio,
      lineHeight: preset.lineHeight
    });
  };

  // Calculate font sizes based on scale
  const calculateFontSizes = () => {
    const { baseSize, scaleRatio } = typography.scale;
    return {
      xs: Math.round(baseSize / Math.pow(scaleRatio, 2)),
      sm: Math.round(baseSize / scaleRatio),
      base: baseSize,
      lg: Math.round(baseSize * scaleRatio),
      xl: Math.round(baseSize * Math.pow(scaleRatio, 2)),
      '2xl': Math.round(baseSize * Math.pow(scaleRatio, 3)),
      '3xl': Math.round(baseSize * Math.pow(scaleRatio, 4)),
      '4xl': Math.round(baseSize * Math.pow(scaleRatio, 5))
    };
  };

  // Font selection component
  const FontSelector = ({ 
    label, 
    fontType, 
    currentFont, 
    fontOptions 
  }: { 
    label: string; 
    fontType: 'headingFont' | 'bodyFont' | 'monoFont';
    currentFont: TypographyFont;
    fontOptions: typeof ACADEMIC_FONTS.serif;
  }) => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">{label}</h3>
      
      {/* Font Family Selection */}
      <div className="space-y-2">
        {fontOptions.map((font) => (
          <div key={font.family} className="flex items-center space-x-3">
            <input
              type="radio"
              id={`${fontType}-${font.family}`}
              checked={currentFont.family === font.family}
              onChange={() => handleFontChange(fontType, {
                family: font.family,
                source: font.source,
                weights: font.weights,
                styles: font.styles,
                fallbacks: getFallbacks(font.source, fontType)
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label 
              htmlFor={`${fontType}-${font.family}`}
              className="flex-1 cursor-pointer"
            >
              <div 
                className="text-sm font-medium"
                style={{ fontFamily: `${font.family}, ${getFallbacks(font.source, fontType).join(', ')}` }}
              >
                {font.family}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {font.description}
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Weight Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Available Weights
        </label>
        <div className="flex flex-wrap gap-2">
          {currentFont.weights.map(weight => (
            <span 
              key={weight}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              style={{ fontWeight: weight }}
            >
              {weight}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // Get appropriate fallback fonts
  const getFallbacks = (source: string, fontType: string): string[] => {
    if (fontType.includes('mono')) {
      return ['Monaco', 'Consolas', 'monospace'];
    }
    if (fontType.includes('heading')) {
      return ['Georgia', 'serif'];
    }
    return ['system-ui', 'sans-serif'];
  };

  const fontSizes = calculateFontSizes();

  return (
    <div className={`typography-editor ${className}`}>
      {/* Typography Presets */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TYPOGRAPHY_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 text-left transition-colors"
            >
              <div className="font-medium text-gray-900 mb-1">{preset.name}</div>
              <div className="text-sm text-gray-600 mb-3">{preset.description}</div>
              <div className="text-xs text-gray-500">
                Base: {preset.baseSize}px • Scale: {preset.scaleRatio} • Line Height: {preset.lineHeight.normal}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <FontSelector
          label="Heading Font"
          fontType="headingFont"
          currentFont={typography.headingFont}
          fontOptions={[...ACADEMIC_FONTS.serif, ...ACADEMIC_FONTS.sans]}
        />
        
        <FontSelector
          label="Body Font"
          fontType="bodyFont"
          currentFont={typography.bodyFont}
          fontOptions={[...ACADEMIC_FONTS.serif, ...ACADEMIC_FONTS.sans]}
        />
        
        <FontSelector
          label="Monospace Font"
          fontType="monoFont"
          currentFont={typography.monoFont}
          fontOptions={ACADEMIC_FONTS.mono}
        />
      </div>

      {/* Typography Scale Configuration */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography Scale</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Font Size
            </label>
            <input
              type="range"
              min="14"
              max="20"
              value={typography.scale.baseSize}
              onChange={(e) => handleScaleChange({ baseSize: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>14px</span>
              <span className="font-medium">{typography.scale.baseSize}px</span>
              <span>20px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scale Ratio
            </label>
            <select
              value={typography.scale.scaleRatio}
              onChange={(e) => handleScaleChange({ scaleRatio: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1.125">Minor Second (1.125)</option>
              <option value="1.2">Minor Third (1.2)</option>
              <option value="1.25">Major Third (1.25)</option>
              <option value="1.333">Perfect Fourth (1.333)</option>
              <option value="1.414">Augmented Fourth (1.414)</option>
              <option value="1.5">Perfect Fifth (1.5)</option>
              <option value="1.618">Golden Ratio (1.618)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Line Height (Normal)
            </label>
            <input
              type="range"
              min="1.2"
              max="2"
              step="0.1"
              value={typography.scale.lineHeight.normal}
              onChange={(e) => handleScaleChange({ 
                lineHeight: {
                  ...typography.scale.lineHeight,
                  normal: parseFloat(e.target.value)
                }
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1.2</span>
              <span className="font-medium">{typography.scale.lineHeight.normal}</span>
              <span>2.0</span>
            </div>
          </div>
        </div>

        {/* Font Size Preview */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Generated Font Sizes</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(fontSizes).map(([size, value]) => (
              <div key={size} className="flex justify-between">
                <span className="text-gray-600">{size}:</span>
                <span className="font-mono">{value}px</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Typography Preview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
        
        {/* Preview Controls */}
        <div className="flex space-x-4 mb-6">
          {[
            { key: 'heading', label: 'Headings' },
            { key: 'body', label: 'Body Text' },
            { key: 'mono', label: 'Code' }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setActivePreview(option.key as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activePreview === option.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Preview Content */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white">
          {activePreview === 'heading' && (
            <div style={{ fontFamily: `${typography.headingFont.family}, ${typography.headingFont.fallbacks.join(', ')}` }}>
              <h1 style={{ fontSize: `${fontSizes['4xl']}px`, lineHeight: typography.scale.lineHeight.tight, marginBottom: '1rem' }}>
                Journal Article Title
              </h1>
              <h2 style={{ fontSize: `${fontSizes['3xl']}px`, lineHeight: typography.scale.lineHeight.tight, marginBottom: '0.75rem' }}>
                Section Heading
              </h2>
              <h3 style={{ fontSize: `${fontSizes['2xl']}px`, lineHeight: typography.scale.lineHeight.normal, marginBottom: '0.5rem' }}>
                Subsection Heading
              </h3>
              <h4 style={{ fontSize: `${fontSizes.xl}px`, lineHeight: typography.scale.lineHeight.normal, marginBottom: '0.5rem' }}>
                Minor Heading
              </h4>
            </div>
          )}

          {activePreview === 'body' && (
            <div style={{ 
              fontFamily: `${typography.bodyFont.family}, ${typography.bodyFont.fallbacks.join(', ')}`,
              fontSize: `${fontSizes.base}px`,
              lineHeight: typography.scale.lineHeight.normal
            }}>
              <p className="mb-4">
                This is how body text will appear in your journal. Academic writing requires excellent readability
                and professional appearance. The selected typography should enhance the scholarly nature of your content
                while maintaining accessibility standards.
              </p>
              <p className="mb-4">
                <strong>Bold text</strong> and <em>italic text</em> should work harmoniously with the regular weight.
                Consider how citations, references, and other academic formatting elements will appear.
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>List items should be clearly readable</li>
                <li>With appropriate spacing and hierarchy</li>
                <li>Supporting various academic writing styles</li>
              </ul>
            </div>
          )}

          {activePreview === 'mono' && (
            <div style={{ 
              fontFamily: `${typography.monoFont.family}, ${typography.monoFont.fallbacks.join(', ')}`,
              fontSize: `${fontSizes.sm}px`,
              lineHeight: typography.scale.lineHeight.normal
            }}>
              <pre className="mb-4 p-4 bg-gray-100 rounded">
{`// Code examples and technical content
function calculateImpactFactor(citations, publications) {
  return citations / publications;
}

const journal = {
  name: "Academic Research Journal",
  impactFactor: calculateImpactFactor(1250, 89),
  issn: "1234-5678"
};`}
              </pre>
              <p>
                Inline code like <code>git commit -m "Add typography"</code> should be clearly distinguishable
                from regular body text while maintaining readability.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Accessibility & Performance Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Typography Guidelines</h3>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc ml-4 space-y-1">
                <li>All selected fonts are optimized for academic readability</li>
                <li>Typography maintains WCAG 2.1 AA compliance for accessibility</li>
                <li>Google Fonts are loaded asynchronously to minimize performance impact</li>
                <li>Font display: swap ensures immediate text visibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}