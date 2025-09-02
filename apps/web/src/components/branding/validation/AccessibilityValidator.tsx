'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { BrandingColorScheme, AccessibilityValidation, AccessibilityViolation } from '@shared/types';

interface AccessibilityValidatorProps {
  colorScheme: BrandingColorScheme;
  onValidation: (validation: AccessibilityValidation) => void;
  className?: string;
}

export function AccessibilityValidator({ colorScheme, onValidation, className = '' }: AccessibilityValidatorProps) {
  const [validation, setValidation] = useState<AccessibilityValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Calculate luminance for contrast ratio calculation
  const getLuminance = useCallback((hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }, []);

  // Calculate contrast ratio between two colors
  const getContrastRatio = useCallback((color1: string, color2: string): number => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }, [getLuminance]);

  // Convert hex to RGB
  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Validate accessibility compliance
  const validateAccessibility = useCallback(async () => {
    setIsValidating(true);
    
    const violations: AccessibilityViolation[] = [];
    
    // Test color contrast combinations
    const contrastTests = [
      {
        name: 'Primary text on background',
        foreground: colorScheme.text.primary,
        background: colorScheme.background,
        element: 'body text',
        minRatio: 4.5
      },
      {
        name: 'Secondary text on background',
        foreground: colorScheme.text.secondary,
        background: colorScheme.background,
        element: 'secondary text',
        minRatio: 4.5
      },
      {
        name: 'White text on primary',
        foreground: '#ffffff',
        background: colorScheme.primary,
        element: 'button text',
        minRatio: 4.5
      },
      {
        name: 'White text on secondary',
        foreground: '#ffffff',
        background: colorScheme.secondary,
        element: 'secondary button text',
        minRatio: 4.5
      },
      {
        name: 'Primary text on primary (should fail)',
        foreground: colorScheme.text.primary,
        background: colorScheme.primary,
        element: 'invalid combination',
        minRatio: 4.5
      },
      {
        name: 'Accent contrast check',
        foreground: '#ffffff',
        background: colorScheme.accent,
        element: 'accent button text',
        minRatio: 3.0 // Slightly lower for accent colors
      },
      {
        name: 'Border visibility',
        foreground: colorScheme.borders,
        background: colorScheme.background,
        element: 'border elements',
        minRatio: 3.0 // Non-text elements have lower requirements
      }
    ];

    for (const test of contrastTests) {
      const ratio = getContrastRatio(test.foreground, test.background);
      
      if (ratio < test.minRatio) {
        violations.push({
          id: `contrast-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
          rule: 'WCAG 2.1 Color Contrast',
          severity: ratio < 3.0 ? 'error' : 'warning',
          element: test.element,
          description: `${test.name} has insufficient contrast ratio: ${ratio.toFixed(2)}:1 (minimum: ${test.minRatio}:1)`,
          fix: `Adjust colors to achieve at least ${test.minRatio}:1 contrast ratio`,
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
        });
      }
    }

    // Check for color-only communication
    const colorOnlyTests = [
      {
        test: colorScheme.success === colorScheme.error,
        violation: {
          id: 'color-only-success-error',
          rule: 'WCAG 2.1 Use of Color',
          severity: 'warning' as const,
          element: 'status indicators',
          description: 'Success and error colors should be sufficiently different',
          fix: 'Use distinct colors and additional indicators (icons, text) for status communication',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html'
        }
      },
      {
        test: getContrastRatio(colorScheme.success, colorScheme.error) < 3.0,
        violation: {
          id: 'status-color-distinction',
          rule: 'WCAG 2.1 Use of Color',
          severity: 'warning' as const,
          element: 'status colors',
          description: 'Status colors (success, warning, error) should be easily distinguishable',
          fix: 'Increase contrast between status colors or use additional visual indicators',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html'
        }
      }
    ];

    colorOnlyTests.forEach(({ test, violation }) => {
      if (test) {
        violations.push(violation);
      }
    });

    // Determine WCAG compliance level
    const errorViolations = violations.filter(v => v.severity === 'error');
    const warningViolations = violations.filter(v => v.severity === 'warning');
    
    let wcagLevel: 'AA' | 'AAA' | 'FAIL';
    let isCompliant: boolean;
    
    if (errorViolations.length > 0) {
      wcagLevel = 'FAIL';
      isCompliant = false;
    } else if (warningViolations.length > 0) {
      wcagLevel = 'AA';
      isCompliant = true;
    } else {
      // Check for AAA compliance (higher contrast requirements)
      const aaaTests = contrastTests.map(test => ({
        ...test,
        minRatio: test.minRatio === 4.5 ? 7.0 : test.minRatio * 1.4
      }));
      
      const aaaViolations = aaaTests.filter(test => 
        getContrastRatio(test.foreground, test.background) < test.minRatio
      );
      
      wcagLevel = aaaViolations.length === 0 ? 'AAA' : 'AA';
      isCompliant = true;
    }

    // Generate auto-fix suggestions
    const autoFixSuggestions = violations.map(violation => ({
      violationId: violation.id,
      fixType: 'suggested' as const,
      description: violation.fix,
      colorChanges: generateColorFix(violation, colorScheme)
    }));

    const validationResult: AccessibilityValidation = {
      isCompliant,
      wcagLevel,
      violations,
      lastValidated: new Date(),
      autoFixSuggestions
    };

    setValidation(validationResult);
    onValidation(validationResult);
    setIsValidating(false);
  }, [colorScheme, getContrastRatio, onValidation]);

  // Generate automatic color fix suggestions
  function generateColorFix(violation: AccessibilityViolation, scheme: BrandingColorScheme) {
    // This is a simplified fix suggestion
    // In a real implementation, this would use color manipulation libraries
    if (violation.rule.includes('Color Contrast')) {
      return {
        primary: scheme.primary,
        text: {
          ...scheme.text,
          primary: violation.element.includes('text') ? '#000000' : scheme.text.primary
        }
      };
    }
    return undefined;
  }

  // Run validation when color scheme changes
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      validateAccessibility();
    }, 500); // Debounce validation

    return () => clearTimeout(debounceTimeout);
  }, [validateAccessibility]);

  if (!validation && !isValidating) {
    return (
      <div className={`accessibility-validator ${className}`}>
        <div className="text-center py-4">
          <p className="text-gray-500">Initializing accessibility validation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`accessibility-validator ${className}`}>
      {/* Validation Status */}
      <div className={`p-4 rounded-lg border-2 ${
        isValidating ? 'bg-gray-50 border-gray-200' :
        validation?.wcagLevel === 'AAA' ? 'bg-green-50 border-green-200' :
        validation?.wcagLevel === 'AA' ? 'bg-blue-50 border-blue-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="font-medium">Validating...</span>
              </>
            ) : (
              <>
                <div className={`w-3 h-3 rounded-full ${
                  validation?.wcagLevel === 'AAA' ? 'bg-green-500' :
                  validation?.wcagLevel === 'AA' ? 'bg-blue-500' :
                  'bg-red-500'
                }`} />
                <span className="font-medium">
                  WCAG 2.1 {validation?.wcagLevel} {validation?.isCompliant ? 'Compliant' : 'Non-Compliant'}
                </span>
              </>
            )}
          </div>
          
          {!isValidating && (
            <button
              onClick={validateAccessibility}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Re-validate
            </button>
          )}
        </div>

        {validation && !isValidating && (
          <div className="text-sm text-gray-700">
            <p className="mb-2">
              {validation.isCompliant
                ? `✅ Your color scheme meets accessibility standards with ${validation.violations.length} ${validation.violations.length === 1 ? 'suggestion' : 'suggestions'} for improvement.`
                : `❌ Your color scheme has ${validation.violations.filter(v => v.severity === 'error').length} accessibility ${validation.violations.filter(v => v.severity === 'error').length === 1 ? 'issue' : 'issues'} that must be addressed.`
              }
            </p>
            <p className="text-xs text-gray-500">
              Last validated: {validation.lastValidated.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {/* Violations List */}
      {validation && validation.violations.length > 0 && !isValidating && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Accessibility Issues & Suggestions ({validation.violations.length})
          </h4>
          <div className="space-y-3">
            {validation.violations.map((violation) => (
              <div 
                key={violation.id}
                className={`p-3 rounded border-l-4 ${
                  violation.severity === 'error' ? 'bg-red-50 border-red-400' :
                  'bg-yellow-50 border-yellow-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className={`text-sm font-medium ${
                      violation.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {violation.element} - {violation.rule}
                    </h5>
                    <p className={`mt-1 text-sm ${
                      violation.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {violation.description}
                    </p>
                    <p className={`mt-1 text-xs ${
                      violation.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      💡 {violation.fix}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      violation.severity === 'error' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {violation.severity}
                    </span>
                  </div>
                </div>
                
                {/* Help Link */}
                <div className="mt-2">
                  <a
                    href={violation.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs hover:underline ${
                      violation.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  >
                    Learn more about this guideline →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility Guidelines */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Accessibility Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>AA Level:</strong> Minimum contrast ratio of 4.5:1 for normal text</li>
          <li>• <strong>AAA Level:</strong> Enhanced contrast ratio of 7:1 for normal text</li>
          <li>• <strong>Large Text:</strong> 3:1 minimum for text larger than 18pt or 14pt bold</li>
          <li>• <strong>Non-text Elements:</strong> 3:1 minimum for UI components and graphics</li>
          <li>• <strong>Color Independence:</strong> Don't rely solely on color to convey information</li>
        </ul>
      </div>

      {/* Quick Test Tool */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Contrast Test</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div 
            className="p-3 rounded text-center text-sm"
            style={{ 
              backgroundColor: validation?.isCompliant ? colorScheme.primary : '#6b7280',
              color: '#ffffff'
            }}
          >
            Primary Button
          </div>
          <div 
            className="p-3 rounded text-center text-sm"
            style={{ 
              backgroundColor: validation?.isCompliant ? colorScheme.secondary : '#6b7280',
              color: '#ffffff'
            }}
          >
            Secondary Button
          </div>
          <div 
            className="p-3 rounded text-center text-sm border"
            style={{ 
              backgroundColor: colorScheme.background,
              color: colorScheme.text.primary,
              borderColor: colorScheme.borders
            }}
          >
            Body Text
          </div>
          <div 
            className="p-3 rounded text-center text-sm"
            style={{ 
              backgroundColor: validation?.isCompliant ? colorScheme.accent : '#6b7280',
              color: '#ffffff'
            }}
          >
            Accent Element
          </div>
        </div>
      </div>
    </div>
  );
}