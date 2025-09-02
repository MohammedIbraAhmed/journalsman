'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { BrandingColorScheme, ContrastValidation } from '@shared/types';

interface ColorSchemeEditorProps {
  colorScheme: BrandingColorScheme;
  onChange: (colorScheme: BrandingColorScheme) => void;
  className?: string;
}

// Predefined color palettes for academic journals
const ACADEMIC_COLOR_PALETTES = [
  {
    name: 'Academic Blue',
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b'
  },
  {
    name: 'Scholarly Green',
    primary: '#059669',
    secondary: '#6b7280',
    accent: '#dc2626'
  },
  {
    name: 'Professional Purple',
    primary: '#7c3aed',
    secondary: '#78716c',
    accent: '#ea580c'
  },
  {
    name: 'Research Red',
    primary: '#dc2626',
    secondary: '#525252',
    accent: '#2563eb'
  },
  {
    name: 'Science Teal',
    primary: '#0d9488',
    secondary: '#71717a',
    accent: '#7c2d12'
  }
];

export function ColorSchemeEditor({ colorScheme, onChange, className = '' }: ColorSchemeEditorProps) {
  const [activeColorInput, setActiveColorInput] = useState<string | null>(null);
  const [contrastValidation, setContrastValidation] = useState<ContrastValidation>(
    colorScheme.contrastValidation
  );

  // Calculate contrast ratio between two colors
  const calculateContrast = useCallback((color1: string, color2: string): number => {
    // Simplified contrast calculation - in real implementation would use proper contrast ratio formula
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const brightness1 = (r1 * 299 + g1 * 587 + b1 * 114) / 1000;
    const brightness2 = (r2 * 299 + g2 * 587 + b2 * 114) / 1000;
    
    return brightness1 > brightness2 
      ? (brightness1 + 0.05) / (brightness2 + 0.05)
      : (brightness2 + 0.05) / (brightness1 + 0.05);
  }, []);

  // Validate accessibility when colors change
  useEffect(() => {
    const scores = {
      primaryOnBackground: calculateContrast(colorScheme.primary, colorScheme.background),
      secondaryOnBackground: calculateContrast(colorScheme.secondary, colorScheme.background),
      textOnPrimary: calculateContrast(colorScheme.text.primary, colorScheme.primary),
      textOnSecondary: calculateContrast(colorScheme.text.primary, colorScheme.secondary)
    };

    const minScore = Math.min(...Object.values(scores));
    const wcagLevel: 'AA' | 'AAA' | 'FAIL' = minScore >= 7 ? 'AAA' : minScore >= 4.5 ? 'AA' : 'FAIL';

    const validation: ContrastValidation = {
      isValid: wcagLevel !== 'FAIL',
      scores,
      wcagLevel,
      validatedAt: new Date()
    };

    setContrastValidation(validation);

    // Update the color scheme with validation results
    onChange({
      ...colorScheme,
      contrastValidation: validation
    });
  }, [colorScheme.primary, colorScheme.secondary, colorScheme.background, colorScheme.text, calculateContrast, onChange]);

  // Handle color input change
  const handleColorChange = (colorKey: string, value: string) => {
    const updatedColorScheme = { ...colorScheme };
    
    if (colorKey.includes('.')) {
      const [parent, child] = colorKey.split('.');
      (updatedColorScheme as any)[parent][child] = value;
    } else {
      (updatedColorScheme as any)[colorKey] = value;
    }
    
    onChange(updatedColorScheme);
  };

  // Apply predefined palette
  const applyPalette = (palette: typeof ACADEMIC_COLOR_PALETTES[0]) => {
    const updatedColorScheme: BrandingColorScheme = {
      ...colorScheme,
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      hover: adjustBrightness(palette.primary, -10),
      focus: adjustBrightness(palette.primary, -5)
    };
    
    onChange(updatedColorScheme);
  };

  // Utility function to adjust color brightness
  function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // Color input component
  const ColorInput = ({ label, colorKey, value }: { label: string; colorKey: string; value: string }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-3">
        <div 
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setActiveColorInput(colorKey)}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className={`color-scheme-editor ${className}`}>
      {/* Quick Palette Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Palettes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACADEMIC_COLOR_PALETTES.map((palette) => (
            <button
              key={palette.name}
              onClick={() => applyPalette(palette)}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex space-x-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: palette.primary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: palette.secondary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: palette.accent }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{palette.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Primary Colors */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Primary Colors</h3>
          <ColorInput label="Primary" colorKey="primary" value={colorScheme.primary} />
          <ColorInput label="Secondary" colorKey="secondary" value={colorScheme.secondary} />
          <ColorInput label="Accent" colorKey="accent" value={colorScheme.accent} />
        </div>

        {/* Background & Surface Colors */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Background & Surface</h3>
          <ColorInput label="Background" colorKey="background" value={colorScheme.background} />
          <ColorInput label="Surface" colorKey="surface" value={colorScheme.surface} />
          <ColorInput label="Borders" colorKey="borders" value={colorScheme.borders} />
        </div>

        {/* Text Colors */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Text Colors</h3>
          <ColorInput label="Primary Text" colorKey="text.primary" value={colorScheme.text.primary} />
          <ColorInput label="Secondary Text" colorKey="text.secondary" value={colorScheme.text.secondary} />
          <ColorInput label="Muted Text" colorKey="text.muted" value={colorScheme.text.muted} />
        </div>

        {/* Interactive States */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Interactive States</h3>
          <ColorInput label="Hover" colorKey="hover" value={colorScheme.hover} />
          <ColorInput label="Focus" colorKey="focus" value={colorScheme.focus} />
        </div>

        {/* Status Colors */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Status Colors</h3>
          <ColorInput label="Success" colorKey="success" value={colorScheme.success} />
          <ColorInput label="Warning" colorKey="warning" value={colorScheme.warning} />
          <ColorInput label="Error" colorKey="error" value={colorScheme.error} />
        </div>
      </div>

      {/* Accessibility Validation Results */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Accessibility Validation</h3>
        <div className={`p-4 rounded-lg border-2 ${
          contrastValidation.wcagLevel === 'AAA' ? 'bg-green-50 border-green-200' :
          contrastValidation.wcagLevel === 'AA' ? 'bg-blue-50 border-blue-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                contrastValidation.wcagLevel === 'AAA' ? 'bg-green-500' :
                contrastValidation.wcagLevel === 'AA' ? 'bg-blue-500' :
                'bg-red-500'
              }`} />
              <span className="font-medium">
                WCAG {contrastValidation.wcagLevel} Compliance
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {contrastValidation.isValid ? 'Passes' : 'Fails'} Accessibility Standards
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Primary on Background:</span>
              <span className="ml-2 font-mono">{contrastValidation.scores.primaryOnBackground.toFixed(2)}:1</span>
            </div>
            <div>
              <span className="text-gray-600">Secondary on Background:</span>
              <span className="ml-2 font-mono">{contrastValidation.scores.secondaryOnBackground.toFixed(2)}:1</span>
            </div>
            <div>
              <span className="text-gray-600">Text on Primary:</span>
              <span className="ml-2 font-mono">{contrastValidation.scores.textOnPrimary.toFixed(2)}:1</span>
            </div>
            <div>
              <span className="text-gray-600">Text on Secondary:</span>
              <span className="ml-2 font-mono">{contrastValidation.scores.textOnSecondary.toFixed(2)}:1</span>
            </div>
          </div>

          {!contrastValidation.isValid && (
            <div className="mt-3 p-3 bg-white rounded border">
              <h4 className="font-medium text-red-800 mb-2">Accessibility Issues</h4>
              <p className="text-sm text-red-700">
                Some color combinations don't meet WCAG 2.1 AA contrast requirements (4.5:1 minimum).
                Consider adjusting colors to improve accessibility.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Color Preview */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Color Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Light Theme Preview */}
          <div 
            className="p-6 rounded-lg border"
            style={{ 
              backgroundColor: colorScheme.background,
              borderColor: colorScheme.borders
            }}
          >
            <h4 
              className="text-lg font-semibold mb-2"
              style={{ color: colorScheme.text.primary }}
            >
              Sample Journal Article
            </h4>
            <p 
              className="text-sm mb-4"
              style={{ color: colorScheme.text.secondary }}
            >
              This is how your journal content will appear with the selected color scheme.
            </p>
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1 rounded text-sm font-medium text-white"
                style={{ backgroundColor: colorScheme.primary }}
              >
                Primary Button
              </button>
              <button 
                className="px-3 py-1 rounded text-sm font-medium text-white"
                style={{ backgroundColor: colorScheme.secondary }}
              >
                Secondary Button
              </button>
              <button 
                className="px-3 py-1 rounded text-sm font-medium text-white"
                style={{ backgroundColor: colorScheme.accent }}
              >
                Accent Button
              </button>
            </div>
          </div>

          {/* Surface Preview */}
          <div 
            className="p-6 rounded-lg border"
            style={{ 
              backgroundColor: colorScheme.surface,
              borderColor: colorScheme.borders
            }}
          >
            <h4 
              className="text-lg font-semibold mb-2"
              style={{ color: colorScheme.text.primary }}
            >
              Card Component
            </h4>
            <p 
              className="text-sm mb-4"
              style={{ color: colorScheme.text.secondary }}
            >
              Cards and elevated surfaces will use this surface color.
            </p>
            <div className="flex items-center space-x-2">
              <span 
                className="px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: colorScheme.success,
                  color: 'white'
                }}
              >
                Success
              </span>
              <span 
                className="px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: colorScheme.warning,
                  color: 'white'
                }}
              >
                Warning
              </span>
              <span 
                className="px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: colorScheme.error,
                  color: 'white'
                }}
              >
                Error
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}