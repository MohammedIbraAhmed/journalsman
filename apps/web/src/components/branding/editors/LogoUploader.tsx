'use client';

import React, { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import type { BrandingAsset } from '@shared/types';

interface LogoUploaderProps {
  journalId: string;
  currentLogo?: BrandingAsset;
  onUpload: (asset: BrandingAsset) => void;
  className?: string;
}

const ACCEPTED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function LogoUploader({ journalId, currentLogo, onUpload, className = '' }: LogoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentLogo?.url || null);

  // Upload asset mutation
  const uploadAssetMutation = trpc.branding.uploadAsset.useMutation({
    onSuccess: (asset) => {
      setPreview(asset.url);
      onUpload(asset);
      setUploadError(null);
    },
    onError: (error) => {
      setUploadError(error.message);
    }
  });

  // Handle file validation
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a PNG, JPG, SVG, or WebP image file.'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size must be less than 5MB.'
      };
    }

    return { isValid: true };
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      await uploadAssetMutation.mutateAsync({
        journalId,
        type: 'logo',
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          buffer: file // In real implementation, this would be properly handled
        }
      });
    } catch (error) {
      // Error handled by mutation onError
    }
  }, [journalId, uploadAssetMutation]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Remove logo
  const handleRemove = () => {
    setPreview(null);
    setUploadError(null);
    // In real implementation, this would call a delete mutation
    onUpload({} as BrandingAsset);
  };

  return (
    <div className={`logo-uploader ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadError
            ? 'border-red-300 bg-red-50'
            : preview
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Loading State */}
        {uploadAssetMutation.isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && !uploadAssetMutation.isLoading && (
          <div className="mb-4">
            <img
              src={preview}
              alt="Logo preview"
              className="mx-auto max-h-24 max-w-full object-contain"
            />
            <div className="mt-2 flex justify-center space-x-2">
              <button
                onClick={handleRemove}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Upload Instructions */}
        {!preview && (
          <>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <label htmlFor="logo-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload your journal logo
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PNG, JPG, SVG, or WebP up to 5MB
                </span>
              </label>
              <input
                id="logo-upload"
                name="logo-upload"
                type="file"
                accept={ACCEPTED_FILE_TYPES.join(',')}
                onChange={handleInputChange}
                className="sr-only"
              />
            </div>
            <div className="mt-4">
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                Choose File
              </label>
              <p className="mt-2 text-xs text-gray-500">
                Or drag and drop your logo here
              </p>
            </div>
          </>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}
      </div>

      {/* Logo Guidelines */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Logo Guidelines</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <svg className="h-4 w-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Recommended dimensions: 300×100px (3:1 ratio) for horizontal logos</span>
          </div>
          <div className="flex items-start space-x-2">
            <svg className="h-4 w-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Use high contrast colors for better accessibility</span>
          </div>
          <div className="flex items-start space-x-2">
            <svg className="h-4 w-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>SVG format recommended for crisp display at all sizes</span>
          </div>
          <div className="flex items-start space-x-2">
            <svg className="h-4 w-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Include transparent background for flexible placement</span>
          </div>
        </div>
      </div>

      {/* Current Logo Info */}
      {currentLogo && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Current Logo Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Filename:</span> {currentLogo.filename}
            </div>
            <div>
              <span className="font-medium">Size:</span> {(currentLogo.size / 1024).toFixed(1)} KB
            </div>
            <div>
              <span className="font-medium">Dimensions:</span> {currentLogo.dimensions.width}×{currentLogo.dimensions.height}px
            </div>
            <div>
              <span className="font-medium">Format:</span> {currentLogo.mimeType.split('/')[1].toUpperCase()}
            </div>
          </div>
          {currentLogo.variants && currentLogo.variants.length > 0 && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-700">Available Variants:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {currentLogo.variants.map((variant, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {variant.size} ({variant.dimensions.width}×{variant.dimensions.height})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}