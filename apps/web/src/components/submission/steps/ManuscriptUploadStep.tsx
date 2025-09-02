'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { ChunkedFileUploader } from '@/lib/upload/chunked-upload';
import { FileValidator } from '@/lib/validation/file-validator';
import type { 
  WizardStep, 
  ManuscriptSubmission, 
  SubmissionFile, 
  FileValidationResult,
  ManuscriptFileType 
} from '@shared/types';

interface ManuscriptUploadStepProps {
  config: WizardStep;
  submission: Partial<ManuscriptSubmission>;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
  journalId: string;
}

interface UploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
  speed: number;
  remainingTime: number;
  currentChunk: number;
  totalChunks: number;
}

export function ManuscriptUploadStep({ 
  config, 
  submission, 
  onComplete, 
  onError, 
  journalId 
}: ManuscriptUploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<SubmissionFile | null>(
    submission.manuscriptFile || null
  );
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploaderRef = useRef<ChunkedFileUploader | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // tRPC mutations
  const startUploadMutation = trpc.submission.startChunkedUpload.useMutation();
  const completeUploadMutation = trpc.submission.completeChunkedUpload.useMutation();
  const validateFileMutation = trpc.submission.validateFile.useMutation();

  const ALLOWED_FORMATS: ManuscriptFileType[] = ['pdf', 'docx', 'latex'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

  // File validation configuration
  const validationConfig = {
    maxFileSize: MAX_FILE_SIZE,
    allowedFormats: ALLOWED_FORMATS,
    validateContent: true,
    scanVirus: true,
    strictMode: true
  };

  useEffect(() => {
    // Notify parent if file is already uploaded
    if (uploadedFile) {
      onComplete({ manuscriptFile: uploadedFile });
    }
  }, [uploadedFile, onComplete]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    setValidationResult(null);
    validateFile(file);
  }, []);

  const validateFile = async (file: File) => {
    setIsValidating(true);
    try {
      const validator = new FileValidator(validationConfig);
      const result = await validator.validateFile(file);
      setValidationResult(result);
      
      if (!result.isValid) {
        const errorMessages = result.violations
          .filter(v => v.severity === 'error')
          .map(v => v.message);
        onError(`File validation failed: ${errorMessages.join(', ')}`);
      } else {
        onError(''); // Clear any previous errors
      }
    } catch (error) {
      console.error('File validation error:', error);
      onError('File validation failed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const startFileUpload = async (file: File) => {
    if (!validationResult?.isValid) {
      onError('Please select a valid file before uploading');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Initialize chunked upload
      const uploadConfig = await startUploadMutation.mutateAsync({
        submissionId: submission.id || 'temp',
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        chunkSize: 5 * 1024 * 1024 // 5MB chunks
      });

      // Create chunked uploader
      const uploader = new ChunkedFileUploader(file, {
        chunkSize: 5 * 1024 * 1024,
        maxConcurrentChunks: 3,
        maxRetries: 3,
        onProgress: (progress) => {
          setUploadProgress({
            percentage: progress.percentage,
            uploadedBytes: progress.uploadedBytes,
            totalBytes: progress.totalBytes,
            speed: progress.speed,
            remainingTime: progress.remainingTime,
            currentChunk: progress.currentChunk,
            totalChunks: progress.totalChunks
          });
        },
        onError: (error) => {
          setUploadError(error.message);
          onError(`Upload failed: ${error.message}`);
          setIsUploading(false);
        },
        onComplete: async (result) => {
          try {
            // Complete the upload on server
            const submissionFile = await completeUploadMutation.mutateAsync({
              submissionId: submission.id || 'temp',
              uploadId: uploadConfig.uploadId,
              filename: file.name,
              totalChunks: result.chunksUploaded,
              expectedChecksum: result.checksum
            });

            setUploadedFile(submissionFile);
            setIsUploading(false);
            setUploadProgress(null);
            onComplete({ manuscriptFile: submissionFile });
            
          } catch (error) {
            console.error('Upload completion error:', error);
            setUploadError('Failed to complete upload');
            onError('Failed to complete upload. Please try again.');
            setIsUploading(false);
          }
        }
      });

      uploaderRef.current = uploader;
      await uploader.start();

    } catch (error) {
      console.error('Upload start error:', error);
      setUploadError('Failed to start upload');
      onError('Failed to start upload. Please try again.');
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragActive(true);
    }
  }, [isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [isUploading, handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const pauseUpload = () => {
    if (uploaderRef.current) {
      uploaderRef.current.pause();
      setIsUploading(false);
    }
  };

  const resumeUpload = async () => {
    if (uploaderRef.current) {
      setIsUploading(true);
      try {
        await uploaderRef.current.resume();
      } catch (error) {
        console.error('Resume error:', error);
        setIsUploading(false);
      }
    }
  };

  const cancelUpload = () => {
    if (uploaderRef.current) {
      uploaderRef.current.cancel();
      setIsUploading(false);
      setUploadProgress(null);
      setSelectedFile(null);
      setUploadError(null);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setSelectedFile(null);
    setValidationResult(null);
    setUploadProgress(null);
    onComplete({ manuscriptFile: null });
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="manuscript-upload-step">
      {/* Help Text */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Upload Guidelines</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Accepted formats: PDF, DOCX, LaTeX (.tex)</li>
          <li>• Maximum file size: 10GB</li>
          <li>• Files are automatically validated for format and content</li>
          <li>• Upload resumes automatically if interrupted</li>
        </ul>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <div
          ref={dropZoneRef}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : isUploading
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading && uploadProgress ? (
            /* Upload Progress */
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              
              <div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  Uploading {selectedFile?.name}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {formatFileSize(uploadProgress.uploadedBytes)} of {formatFileSize(uploadProgress.totalBytes)}
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span>{Math.round(uploadProgress.percentage)}% complete</span>
                  <span>
                    {formatFileSize(uploadProgress.speed)}/s • {formatTime(uploadProgress.remainingTime)} remaining
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mb-4">
                  Chunk {uploadProgress.currentChunk} of {uploadProgress.totalChunks}
                </div>
              </div>
              
              {/* Upload controls */}
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={pauseUpload}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Pause
                </button>
                <button
                  onClick={cancelUpload}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedFile ? (
            /* File Selected - Ready to Upload */
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{selectedFile.name}</div>
                <div className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</div>
              </div>
              
              {/* Validation Status */}
              {isValidating ? (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Validating file...</span>
                </div>
              ) : validationResult ? (
                <div className="space-y-3">
                  {validationResult.isValid ? (
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>File validation passed</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 text-sm text-red-600 mb-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>File validation failed</span>
                      </div>
                      <div className="text-xs text-red-600 space-y-1">
                        {validationResult.violations.map((violation, index) => (
                          <div key={index}>{violation.message}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div className="text-xs text-yellow-600 space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start space-x-1">
                          <svg className="h-3 w-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{warning.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              
              {/* Action buttons */}
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setValidationResult(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Choose Different File
                </button>
                {validationResult?.isValid && (
                  <button
                    onClick={() => startFileUpload(selectedFile)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Start Upload
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Initial Upload State */
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-gray-400"
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
              </div>
              
              <div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  Upload your manuscript
                </div>
                <div className="text-sm text-gray-600">
                  Drag and drop your file here, or click to browse
                </div>
              </div>
              
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Choose File
              </button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept=".pdf,.docx,.doc,.tex,.latex"
            onChange={handleFileInputChange}
          />
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="mt-1 text-sm text-red-700">{uploadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded File Display */}
      {uploadedFile && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  File uploaded successfully
                </h3>
                <p className="text-sm text-green-700">
                  {uploadedFile.originalName} ({formatFileSize(uploadedFile.size)})
                </p>
              </div>
            </div>
            
            <button
              onClick={removeFile}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Remove
            </button>
          </div>
          
          {/* File details */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-800">Format:</span>
              <span className="ml-2 text-green-700">{uploadedFile.fileType.toUpperCase()}</span>
            </div>
            <div>
              <span className="font-medium text-green-800">Status:</span>
              <span className="ml-2 text-green-700">
                {uploadedFile.validation.isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            {uploadedFile.metadata.pageCount && (
              <div>
                <span className="font-medium text-green-800">Pages:</span>
                <span className="ml-2 text-green-700">{uploadedFile.metadata.pageCount}</span>
              </div>
            )}
            {uploadedFile.metadata.wordCount && (
              <div>
                <span className="font-medium text-green-800">Words:</span>
                <span className="ml-2 text-green-700">{uploadedFile.metadata.wordCount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}