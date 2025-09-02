'use client';

import type { ChunkUploadInfo, UploadStatus } from '@shared/types';

export interface ChunkedUploadConfig {
  chunkSize: number; // Size of each chunk in bytes (default: 5MB)
  maxConcurrentChunks: number; // Max concurrent chunk uploads (default: 3)
  maxRetries: number; // Max retries per chunk (default: 3)
  retryDelay: number; // Delay between retries in ms (default: 1000)
  onProgress?: (progress: ChunkUploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  onError?: (error: ChunkUploadError) => void;
  onComplete?: (result: ChunkUploadResult) => void;
  onPause?: () => void;
  onResume?: () => void;
}

export interface ChunkUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  uploadedChunks: number;
  totalChunks: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
  currentChunk: number;
}

export interface ChunkUploadError {
  type: 'network' | 'server' | 'validation' | 'abort';
  message: string;
  chunkIndex?: number;
  retryable: boolean;
}

export interface ChunkUploadResult {
  fileId: string;
  filename: string;
  size: number;
  checksum: string;
  uploadTime: number; // milliseconds
  chunksUploaded: number;
  retryCount: number;
}

export interface ChunkUploadState {
  status: UploadStatus;
  progress: ChunkUploadProgress;
  uploadedChunks: Set<number>;
  failedChunks: Set<number>;
  retryCount: number;
  startTime: number;
  pausedTime?: number;
  resumeToken?: string;
}

export class ChunkedFileUploader {
  private file: File;
  private config: Required<ChunkedUploadConfig>;
  private state: ChunkUploadState;
  private chunks: Blob[];
  private uploadPromises: Map<number, Promise<void>>;
  private abortController: AbortController;

  constructor(file: File, config: Partial<ChunkedUploadConfig> = {}) {
    this.file = file;
    this.config = {
      chunkSize: config.chunkSize || 5 * 1024 * 1024, // 5MB
      maxConcurrentChunks: config.maxConcurrentChunks || 3,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      onProgress: config.onProgress || (() => {}),
      onChunkComplete: config.onChunkComplete || (() => {}),
      onError: config.onError || (() => {}),
      onComplete: config.onComplete || (() => {}),
      onPause: config.onPause || (() => {}),
      onResume: config.onResume || (() => {}),
    };

    this.chunks = this.createChunks();
    this.uploadPromises = new Map();
    this.abortController = new AbortController();

    this.state = {
      status: 'pending',
      progress: {
        uploadedBytes: 0,
        totalBytes: file.size,
        uploadedChunks: 0,
        totalChunks: this.chunks.length,
        percentage: 0,
        speed: 0,
        remainingTime: 0,
        currentChunk: 0
      },
      uploadedChunks: new Set(),
      failedChunks: new Set(),
      retryCount: 0,
      startTime: 0
    };
  }

  private createChunks(): Blob[] {
    const chunks: Blob[] = [];
    const chunkCount = Math.ceil(this.file.size / this.config.chunkSize);
    
    for (let i = 0; i < chunkCount; i++) {
      const start = i * this.config.chunkSize;
      const end = Math.min(start + this.config.chunkSize, this.file.size);
      chunks.push(this.file.slice(start, end));
    }
    
    return chunks;
  }

  private updateProgress(): void {
    const uploadedBytes = Array.from(this.state.uploadedChunks)
      .reduce((total, chunkIndex) => total + this.chunks[chunkIndex].size, 0);
    
    const elapsedTime = (Date.now() - this.state.startTime) / 1000;
    const speed = elapsedTime > 0 ? uploadedBytes / elapsedTime : 0;
    const remainingBytes = this.file.size - uploadedBytes;
    const remainingTime = speed > 0 ? remainingBytes / speed : 0;

    this.state.progress = {
      uploadedBytes,
      totalBytes: this.file.size,
      uploadedChunks: this.state.uploadedChunks.size,
      totalChunks: this.chunks.length,
      percentage: (uploadedBytes / this.file.size) * 100,
      speed,
      remainingTime,
      currentChunk: Math.max(...Array.from(this.state.uploadedChunks), -1) + 1
    };

    this.config.onProgress(this.state.progress);
  }

  private async uploadChunk(chunkIndex: number, retryCount = 0): Promise<void> {
    try {
      const chunk = this.chunks[chunkIndex];
      const chunkData = await this.blobToBase64(chunk);
      
      // Mock API call - replace with actual tRPC call
      const response = await fetch('/api/trpc/submission.uploadChunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: 'current-submission-id',
          chunkIndex,
          totalChunks: this.chunks.length,
          chunkData,
          filename: this.file.name,
          fileSize: this.file.size,
          chunkSize: chunk.size,
          resumeToken: this.state.resumeToken
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`Chunk ${chunkIndex} upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.state.uploadedChunks.add(chunkIndex);
        this.state.failedChunks.delete(chunkIndex);
        this.config.onChunkComplete(chunkIndex, this.chunks.length);
        this.updateProgress();
      } else {
        throw new Error(`Chunk ${chunkIndex} processing failed`);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Upload was aborted, not a real error
      }

      if (retryCount < this.config.maxRetries) {
        console.warn(`Chunk ${chunkIndex} failed, retrying (${retryCount + 1}/${this.config.maxRetries})`);
        await this.delay(this.config.retryDelay * (retryCount + 1));
        return this.uploadChunk(chunkIndex, retryCount + 1);
      }

      this.state.failedChunks.add(chunkIndex);
      this.state.retryCount++;
      
      const uploadError: ChunkUploadError = {
        type: error instanceof TypeError ? 'network' : 'server',
        message: error instanceof Error ? error.message : 'Unknown error',
        chunkIndex,
        retryable: retryCount < this.config.maxRetries
      };

      this.config.onError(uploadError);
      throw error;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async runConcurrentUploads(): Promise<void> {
    const pendingChunks = Array.from(
      { length: this.chunks.length }, 
      (_, i) => i
    ).filter(i => 
      !this.state.uploadedChunks.has(i) && 
      !this.uploadPromises.has(i)
    );

    // Limit concurrent uploads
    const chunksToUpload = pendingChunks.slice(0, this.config.maxConcurrentChunks);
    
    for (const chunkIndex of chunksToUpload) {
      const promise = this.uploadChunk(chunkIndex)
        .finally(() => this.uploadPromises.delete(chunkIndex));
      
      this.uploadPromises.set(chunkIndex, promise);
    }

    // Wait for at least one chunk to complete before scheduling more
    if (this.uploadPromises.size > 0) {
      await Promise.race(Array.from(this.uploadPromises.values()));
      
      // Continue with remaining chunks if not all are complete
      if (this.state.uploadedChunks.size < this.chunks.length && 
          this.state.status === 'uploading') {
        await this.runConcurrentUploads();
      }
    }
  }

  async start(): Promise<ChunkUploadResult> {
    if (this.state.status !== 'pending' && this.state.status !== 'paused') {
      throw new Error(`Cannot start upload in ${this.state.status} state`);
    }

    this.state.status = 'uploading';
    this.state.startTime = Date.now();
    
    try {
      await this.runConcurrentUploads();
      
      if (this.state.uploadedChunks.size === this.chunks.length) {
        this.state.status = 'completed';
        
        const result: ChunkUploadResult = {
          fileId: crypto.randomUUID(),
          filename: this.file.name,
          size: this.file.size,
          checksum: await this.calculateChecksum(),
          uploadTime: Date.now() - this.state.startTime,
          chunksUploaded: this.state.uploadedChunks.size,
          retryCount: this.state.retryCount
        };

        this.config.onComplete(result);
        return result;
      } else {
        throw new Error('Upload incomplete: some chunks failed');
      }
      
    } catch (error) {
      this.state.status = 'failed';
      throw error;
    }
  }

  pause(): void {
    if (this.state.status === 'uploading') {
      this.state.status = 'paused';
      this.state.pausedTime = Date.now();
      this.abortController.abort();
      this.abortController = new AbortController();
      this.config.onPause();
    }
  }

  resume(): Promise<ChunkUploadResult> {
    if (this.state.status === 'paused') {
      this.state.status = 'pending';
      if (this.state.pausedTime) {
        this.state.startTime += Date.now() - this.state.pausedTime;
        this.state.pausedTime = undefined;
      }
      this.config.onResume();
      return this.start();
    }
    throw new Error('Cannot resume: upload is not paused');
  }

  cancel(): void {
    this.state.status = 'cancelled';
    this.abortController.abort();
    this.uploadPromises.clear();
  }

  getState(): ChunkUploadState {
    return { ...this.state };
  }

  private async calculateChecksum(): Promise<string> {
    // Simple checksum calculation using Web Crypto API
    const buffer = await this.file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Static method to resume an existing upload
  static fromResumeToken(file: File, resumeToken: string, uploadedChunks: number[], config: Partial<ChunkedUploadConfig> = {}): ChunkedFileUploader {
    const uploader = new ChunkedFileUploader(file, config);
    uploader.state.resumeToken = resumeToken;
    uploader.state.uploadedChunks = new Set(uploadedChunks);
    uploader.state.status = 'paused';
    return uploader;
  }
}