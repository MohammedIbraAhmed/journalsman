'use client';

import React, { useState, useEffect } from 'react';
import type { JournalBrandingConfig, BrandingPreview as BrandingPreviewType } from '@shared/types';
import { trpc } from '@/lib/trpc';

interface BrandingPreviewProps {
  journalId: string;
  brandingConfig: JournalBrandingConfig;
  isVisible: boolean;
  className?: string;
}

export function BrandingPreview({ journalId, brandingConfig, isVisible, className = '' }: BrandingPreviewProps) {
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewData, setPreviewData] = useState<BrandingPreviewType | null>(null);

  // Generate preview mutation
  const generatePreviewMutation = trpc.branding.generatePreview.useMutation({
    onSuccess: (preview) => {
      setPreviewData(preview);
    },
    onError: (error) => {
      console.error('Failed to generate preview:', error);
    }
  });

  // Generate preview when config changes
  useEffect(() => {
    if (isVisible && brandingConfig) {
      generatePreviewMutation.mutate({
        journalId,
        config: brandingConfig
      });
    }
  }, [isVisible, brandingConfig, journalId, generatePreviewMutation]);

  // Device dimensions for preview
  const deviceDimensions = {
    desktop: { width: 1200, height: 800, label: 'Desktop (1200×800)' },
    tablet: { width: 768, height: 1024, label: 'Tablet (768×1024)' },
    mobile: { width: 375, height: 667, label: 'Mobile (375×667)' }
  };

  // Apply branding styles to preview
  const previewStyles = {
    '--color-primary': brandingConfig.colorScheme.primary,
    '--color-secondary': brandingConfig.colorScheme.secondary,
    '--color-accent': brandingConfig.colorScheme.accent,
    '--color-background': brandingConfig.colorScheme.background,
    '--color-surface': brandingConfig.colorScheme.surface,
    '--color-text-primary': brandingConfig.colorScheme.text.primary,
    '--color-text-secondary': brandingConfig.colorScheme.text.secondary,
    '--color-text-muted': brandingConfig.colorScheme.text.muted,
    '--color-borders': brandingConfig.colorScheme.borders,
    '--font-heading': `${brandingConfig.typography.headingFont.family}, ${brandingConfig.typography.headingFont.fallbacks.join(', ')}`,
    '--font-body': `${brandingConfig.typography.bodyFont.family}, ${brandingConfig.typography.bodyFont.fallbacks.join(', ')}`,
    '--font-mono': `${brandingConfig.typography.monoFont.family}, ${brandingConfig.typography.monoFont.fallbacks.join(', ')}`,
    '--font-size-base': `${brandingConfig.typography.scale.baseSize}px`,
    '--line-height-normal': brandingConfig.typography.scale.lineHeight.normal,
  } as React.CSSProperties;

  if (!isVisible) {
    return (
      <div className={`branding-preview ${className}`}>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Generate a preview to see your branding applied</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`branding-preview ${className}`}>
      {/* Device Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        
        <div className="flex space-x-2">
          {Object.entries(deviceDimensions).map(([device, dims]) => (
            <button
              key={device}
              onClick={() => setActiveDevice(device as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                activeDevice === device
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {device === 'desktop' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              {device === 'tablet' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                </svg>
              )}
              {device === 'mobile' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a1 1 0 001-1V4a1 1 0 00-1-1H7a1 1 0 00-1 1v16a1 1 0 001 1z" />
                </svg>
              )}
              <span className="capitalize">{device}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {generatePreviewMutation.isLoading && (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Generating preview...</p>
          </div>
        </div>
      )}

      {/* Preview Frame */}
      {!generatePreviewMutation.isLoading && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="bg-white rounded-lg shadow-lg mx-auto overflow-hidden" style={{
            width: Math.min(deviceDimensions[activeDevice].width, 1200),
            maxWidth: '100%',
            aspectRatio: `${deviceDimensions[activeDevice].width} / ${deviceDimensions[activeDevice].height}`
          }}>
            {/* Mock Journal Interface */}
            <div className="h-full" style={previewStyles}>
              {/* Header */}
              <header className="p-4 border-b" style={{ 
                backgroundColor: 'var(--color-surface)', 
                borderColor: 'var(--color-borders)' 
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {brandingConfig.logo && (
                      <img
                        src={brandingConfig.logo.url}
                        alt="Journal Logo"
                        className="h-8 w-auto"
                      />
                    )}
                    <h1 
                      className="text-xl font-bold"
                      style={{ 
                        color: 'var(--color-text-primary)', 
                        fontFamily: 'var(--font-heading)' 
                      }}
                    >
                      Academic Research Journal
                    </h1>
                  </div>
                  <nav className="hidden md:flex space-x-6">
                    {['Home', 'Articles', 'Submit', 'About'].map(item => (
                      <a
                        key={item}
                        href="#"
                        className="font-medium hover:opacity-75"
                        style={{ 
                          color: 'var(--color-text-secondary)',
                          fontFamily: 'var(--font-body)'
                        }}
                      >
                        {item}
                      </a>
                    ))}
                  </nav>
                </div>
              </header>

              {/* Main Content */}
              <main className="p-6" style={{ backgroundColor: 'var(--color-background)' }}>
                {/* Hero Section */}
                <section className="mb-8">
                  <h2 
                    className="text-3xl font-bold mb-4"
                    style={{ 
                      color: 'var(--color-text-primary)', 
                      fontFamily: 'var(--font-heading)' 
                    }}
                  >
                    Welcome to Our Journal
                  </h2>
                  <p 
                    className="text-lg mb-6"
                    style={{ 
                      color: 'var(--color-text-secondary)', 
                      fontFamily: 'var(--font-body)',
                      lineHeight: 'var(--line-height-normal)'
                    }}
                  >
                    Publishing cutting-edge research and scholarly articles across multiple disciplines.
                    Our peer-reviewed journal maintains the highest academic standards.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      className="px-6 py-2 rounded font-medium text-white"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Submit Article
                    </button>
                    <button 
                      className="px-6 py-2 rounded font-medium text-white"
                      style={{ backgroundColor: 'var(--color-secondary)' }}
                    >
                      Browse Issues
                    </button>
                    <button 
                      className="px-6 py-2 rounded font-medium text-white"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                      Subscribe
                    </button>
                  </div>
                </section>

                {/* Article Cards */}
                <section>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ 
                      color: 'var(--color-text-primary)', 
                      fontFamily: 'var(--font-heading)' 
                    }}
                  >
                    Latest Articles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                      <article 
                        key={i}
                        className="p-4 rounded-lg border"
                        style={{ 
                          backgroundColor: 'var(--color-surface)', 
                          borderColor: 'var(--color-borders)' 
                        }}
                      >
                        <h4 
                          className="font-semibold mb-2"
                          style={{ 
                            color: 'var(--color-text-primary)', 
                            fontFamily: 'var(--font-heading)' 
                          }}
                        >
                          Research Article Title {i}
                        </h4>
                        <p 
                          className="text-sm mb-3"
                          style={{ 
                            color: 'var(--color-text-secondary)', 
                            fontFamily: 'var(--font-body)' 
                          }}
                        >
                          Authors: Dr. Smith, Prof. Johnson, Dr. Wilson
                        </p>
                        <p 
                          className="text-sm mb-4"
                          style={{ 
                            color: 'var(--color-text-muted)', 
                            fontFamily: 'var(--font-body)' 
                          }}
                        >
                          This is a preview of the article abstract showing how text content
                          will appear with your selected typography and color scheme...
                        </p>
                        <div className="flex items-center justify-between">
                          <span 
                            className="px-2 py-1 rounded text-xs text-white"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            Open Access
                          </span>
                          <button 
                            className="text-sm hover:opacity-75"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            Read More →
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                {/* Status Elements Preview */}
                <section className="mt-8 p-4 rounded-lg border" style={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: 'var(--color-borders)' 
                }}>
                  <h4 className="font-semibold mb-3" style={{ 
                    color: 'var(--color-text-primary)', 
                    fontFamily: 'var(--font-heading)' 
                  }}>
                    Status Indicators
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span 
                      className="px-3 py-1 rounded-full text-sm text-white"
                      style={{ backgroundColor: brandingConfig.colorScheme.success }}
                    >
                      Accepted
                    </span>
                    <span 
                      className="px-3 py-1 rounded-full text-sm text-white"
                      style={{ backgroundColor: brandingConfig.colorScheme.warning }}
                    >
                      Under Review
                    </span>
                    <span 
                      className="px-3 py-1 rounded-full text-sm text-white"
                      style={{ backgroundColor: brandingConfig.colorScheme.error }}
                    >
                      Revision Required
                    </span>
                  </div>
                </section>
              </main>
            </div>
          </div>

          {/* Device Info */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Showing {deviceDimensions[activeDevice].label} preview
          </div>
        </div>
      )}

      {/* Preview Actions */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-gray-600">
          Preview automatically updates when you modify your branding configuration.
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => generatePreviewMutation.mutate({ journalId, config: brandingConfig })}
            disabled={generatePreviewMutation.isLoading}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 text-sm"
          >
            Refresh Preview
          </button>
          
          {previewData && (
            <a
              href={previewData.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Open Full Preview
            </a>
          )}
        </div>
      </div>

      {/* Accessibility Reminder */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <div className="flex items-start space-x-2">
          <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">Accessibility Compliant</p>
            <p className="text-sm text-green-700">
              This preview maintains WCAG 2.1 {brandingConfig.accessibility.wcagLevel} compliance
              {brandingConfig.accessibility.violations.length > 0 && 
                ` with ${brandingConfig.accessibility.violations.length} minor suggestions for improvement`
              }.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}