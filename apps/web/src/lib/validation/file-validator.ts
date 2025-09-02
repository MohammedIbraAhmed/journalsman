'use client';

import type { FileValidationResult, ValidationViolation, ValidationWarning, ValidationSuggestion, ManuscriptFileType } from '@shared/types';

export interface FileValidationConfig {
  maxFileSize: number; // in bytes
  allowedFormats: ManuscriptFileType[];
  validateContent: boolean;
  scanVirus: boolean;
  strictMode: boolean; // More rigorous validation for submission
}

export interface FileTypeSignature {
  format: ManuscriptFileType;
  mimeTypes: string[];
  extensions: string[];
  magicNumbers: number[][]; // File header signatures
  contentValidation?: (file: File) => Promise<ValidationResult>;
}

interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export class FileValidator {
  private config: FileValidationConfig;
  private supportedFormats: Map<ManuscriptFileType, FileTypeSignature>;

  constructor(config: FileValidationConfig) {
    this.config = config;
    this.supportedFormats = this.initializeFileTypeSignatures();
  }

  private initializeFileTypeSignatures(): Map<ManuscriptFileType, FileTypeSignature> {
    return new Map([
      ['pdf', {
        format: 'pdf',
        mimeTypes: ['application/pdf'],
        extensions: ['.pdf'],
        magicNumbers: [[0x25, 0x50, 0x44, 0x46]], // %PDF
        contentValidation: this.validatePdfContent.bind(this)
      }],
      ['docx', {
        format: 'docx',
        mimeTypes: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword'
        ],
        extensions: ['.docx', '.doc'],
        magicNumbers: [
          [0x50, 0x4B, 0x03, 0x04], // DOCX (ZIP format)
          [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] // DOC (OLE format)
        ],
        contentValidation: this.validateDocxContent.bind(this)
      }],
      ['latex', {
        format: 'latex',
        mimeTypes: ['text/x-tex', 'application/x-latex', 'text/plain'],
        extensions: ['.tex', '.latex'],
        magicNumbers: [], // Text files don't have magic numbers
        contentValidation: this.validateLatexContent.bind(this)
      }],
      ['tex', {
        format: 'tex',
        mimeTypes: ['text/x-tex', 'text/plain'],
        extensions: ['.tex'],
        magicNumbers: [],
        contentValidation: this.validateLatexContent.bind(this)
      }]
    ]);
  }

  async validateFile(file: File): Promise<FileValidationResult> {
    const violations: ValidationViolation[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // 1. Basic file validation
      const basicValidation = this.validateBasicProperties(file);
      violations.push(...basicValidation.violations);
      warnings.push(...basicValidation.warnings);
      suggestions.push(...basicValidation.suggestions);

      // 2. File type detection and validation
      const formatValidation = await this.validateFileFormat(file);
      violations.push(...formatValidation.violations);
      warnings.push(...formatValidation.warnings);
      suggestions.push(...formatValidation.suggestions);

      // 3. Content validation (if format is supported and valid)
      if (violations.length === 0 && this.config.validateContent) {
        const contentValidation = await this.validateFileContent(file);
        violations.push(...contentValidation.violations);
        warnings.push(...contentValidation.warnings);
        suggestions.push(...contentValidation.suggestions);
      }

      // 4. Virus scanning (mock implementation)
      const virusScanResult = await this.performVirusScan(file);

      return {
        isValid: violations.filter(v => v.severity === 'error').length === 0,
        validatedAt: new Date(),
        fileFormat: await this.detectFileFormat(file),
        detectedMimeType: file.type || await this.detectMimeType(file),
        violations,
        warnings,
        suggestions,
        virusScanResult
      };

    } catch (error) {
      // Handle validation errors
      violations.push({
        id: crypto.randomUUID(),
        type: 'format',
        severity: 'error',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        correctionSuggestion: 'Please try uploading the file again or contact support',
        helpUrl: 'https://help.journalsman.com/file-validation'
      });

      return {
        isValid: false,
        validatedAt: new Date(),
        fileFormat: 'pdf', // Default
        detectedMimeType: file.type || 'application/octet-stream',
        violations,
        warnings,
        suggestions,
        virusScanResult: {
          scanned: false,
          isClean: false,
          scanEngine: 'None',
          scanVersion: '0.0.0'
        }
      };
    }
  }

  private validateBasicProperties(file: File): ValidationResult {
    const violations: ValidationViolation[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // File size validation
    if (file.size > this.config.maxFileSize) {
      violations.push({
        id: 'file-size-exceeded',
        type: 'size',
        severity: 'error',
        message: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.config.maxFileSize)})`,
        correctionSuggestion: 'Please reduce file size by optimizing images or splitting into multiple files',
        helpUrl: 'https://help.journalsman.com/file-size-limits'
      });
    } else if (file.size > this.config.maxFileSize * 0.8) {
      warnings.push({
        type: 'formatting',
        message: `File size is quite large (${this.formatFileSize(file.size)})`,
        suggestion: 'Consider optimizing the file to improve upload speed'
      });
    }

    // File name validation
    if (file.name.length > 255) {
      violations.push({
        id: 'filename-too-long',
        type: 'format',
        severity: 'error',
        message: 'Filename is too long (maximum 255 characters)',
        correctionSuggestion: 'Please rename the file with a shorter name'
      });
    }

    // Check for special characters in filename
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(file.name)) {
      violations.push({
        id: 'invalid-filename-chars',
        type: 'format',
        severity: 'error',
        message: 'Filename contains invalid characters',
        correctionSuggestion: 'Please rename the file to remove special characters'
      });
    }

    // Empty file check
    if (file.size === 0) {
      violations.push({
        id: 'empty-file',
        type: 'content',
        severity: 'error',
        message: 'File is empty',
        correctionSuggestion: 'Please select a valid file with content'
      });
    }

    return { isValid: violations.length === 0, violations, warnings, suggestions };
  }

  private async validateFileFormat(file: File): Promise<ValidationResult> {
    const violations: ValidationViolation[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      const detectedFormat = await this.detectFileFormat(file);
      const detectedMimeType = await this.detectMimeType(file);

      // Check if format is allowed
      if (!this.config.allowedFormats.includes(detectedFormat)) {
        violations.push({
          id: 'unsupported-format',
          type: 'format',
          severity: 'error',
          message: `File format "${detectedFormat}" is not supported`,
          correctionSuggestion: `Please upload a file in one of these formats: ${this.config.allowedFormats.join(', ')}`,
          helpUrl: 'https://help.journalsman.com/supported-formats'
        });

        // Suggest conversion if possible
        suggestions.push({
          type: 'conversion',
          message: `Consider converting your file to ${this.config.allowedFormats[0]} format`,
          actionLabel: `Convert to ${this.config.allowedFormats[0].toUpperCase()}`,
          automated: false
        });
      }

      // Validate MIME type consistency
      const formatSignature = this.supportedFormats.get(detectedFormat);
      if (formatSignature && !formatSignature.mimeTypes.includes(detectedMimeType)) {
        warnings.push({
          type: 'formatting',
          message: 'File extension and content type do not match',
          suggestion: 'Verify that the file has not been corrupted or incorrectly renamed'
        });
      }

    } catch (error) {
      violations.push({
        id: 'format-detection-failed',
        type: 'format',
        severity: 'error',
        message: 'Could not detect file format',
        correctionSuggestion: 'Please ensure the file is not corrupted and try again'
      });
    }

    return { isValid: violations.length === 0, violations, warnings, suggestions };
  }

  private async validateFileContent(file: File): Promise<ValidationResult> {
    const format = await this.detectFileFormat(file);
    const formatSignature = this.supportedFormats.get(format);

    if (formatSignature?.contentValidation) {
      return await formatSignature.contentValidation(file);
    }

    return { isValid: true, violations: [], warnings: [], suggestions: [] };
  }

  private async validatePdfContent(file: File): Promise<ValidationResult> {
    const violations: ValidationViolation[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // Read file header to validate PDF structure
      const header = await this.readFileHeader(file, 1024);
      const headerText = new TextDecoder('utf-8', { fatal: false }).decode(header);

      // Check PDF version
      const versionMatch = headerText.match(/%PDF-(\d+\.\d+)/);
      if (!versionMatch) {
        violations.push({
          id: 'invalid-pdf-header',
          type: 'structure',
          severity: 'error',
          message: 'Invalid PDF file structure',
          correctionSuggestion: 'Please ensure the file is a valid PDF document'
        });
      } else {
        const version = parseFloat(versionMatch[1]);
        if (version < 1.4) {
          warnings.push({
            type: 'formatting',
            message: `PDF version ${version} is quite old`,
            suggestion: 'Consider updating to a newer PDF version for better compatibility'
          });
        }
      }

      // Check for password protection (simplified)
      if (headerText.includes('/Encrypt')) {
        violations.push({
          id: 'encrypted-pdf',
          type: 'security',
          severity: 'error',
          message: 'PDF file is password protected',
          correctionSuggestion: 'Please remove password protection from the PDF file'
        });
      }

      // Check for embedded fonts (good practice)
      if (!headerText.includes('/FontDescriptor')) {
        suggestions.push({
          type: 'optimization',
          message: 'Consider embedding fonts for better compatibility',
          actionLabel: 'Learn about font embedding',
          automated: false
        });
      }

    } catch (error) {
      warnings.push({
        type: 'quality',
        message: 'Could not perform detailed PDF content validation',
        suggestion: 'Basic format validation passed, but detailed analysis was not possible'
      });
    }

    return { isValid: violations.length === 0, violations, warnings, suggestions };
  }

  private async validateDocxContent(file: File): Promise<ValidationResult> {
    const violations: ValidationViolation[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // Basic DOCX validation (simplified)
      const header = await this.readFileHeader(file, 100);
      
      // Check for ZIP signature (DOCX is a ZIP file)
      if (header[0] !== 0x50 || header[1] !== 0x4B) {
        violations.push({
          id: 'invalid-docx-format',
          type: 'structure',
          severity: 'error',
          message: 'Invalid DOCX file format',
          correctionSuggestion: 'Please ensure the file is a valid Microsoft Word document'
        });
      }

      // Suggest PDF conversion for better compatibility
      suggestions.push({
        type: 'conversion',
        message: 'Consider converting to PDF for better compatibility and formatting preservation',
        actionLabel: 'Convert to PDF',
        automated: false
      });

    } catch (error) {
      warnings.push({
        type: 'quality',
        message: 'Could not perform detailed DOCX content validation',
        suggestion: 'Basic format validation passed'
      });
    }

    return { isValid: violations.length === 0, violations, warnings, suggestions };
  }

  private async validateLatexContent(file: File): Promise<ValidationResult> {
    const violations: ValidationViolation[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      const content = await this.readFileAsText(file);

      // Check for document class
      if (!content.includes('\\documentclass')) {
        violations.push({
          id: 'missing-documentclass',
          type: 'structure',
          severity: 'error',
          message: 'LaTeX file is missing \\documentclass declaration',
          correctionSuggestion: 'Please add \\documentclass{article} or similar at the beginning of your file'
        });
      }

      // Check for document environment
      if (!content.includes('\\begin{document}') || !content.includes('\\end{document}')) {
        violations.push({
          id: 'missing-document-env',
          type: 'structure',
          severity: 'error',
          message: 'LaTeX file is missing document environment',
          correctionSuggestion: 'Please ensure your file has \\begin{document} and \\end{document}'
        });
      }

      // Check for common issues
      const unbalancedBraces = this.checkUnbalancedBraces(content);
      if (unbalancedBraces > 0) {
        warnings.push({
          type: 'formatting',
          message: `Found ${unbalancedBraces} potentially unbalanced brace(s)`,
          suggestion: 'Review your LaTeX syntax for matching braces'
        });
      }

      // Check for bibliography
      if (content.includes('\\cite') && !content.includes('\\bibliography') && !content.includes('\\bibitem')) {
        warnings.push({
          type: 'references',
          message: 'Citations found but no bibliography detected',
          suggestion: 'Ensure you have included your bibliography file or \\bibitem entries'
        });
      }

      // Suggest PDF compilation
      suggestions.push({
        type: 'conversion',
        message: 'Consider compiling to PDF for submission to ensure formatting consistency',
        actionLabel: 'Compile to PDF',
        automated: false
      });

    } catch (error) {
      warnings.push({
        type: 'quality',
        message: 'Could not read LaTeX file content for detailed validation',
        suggestion: 'File appears to be in correct format but content analysis failed'
      });
    }

    return { isValid: violations.length === 0, violations, warnings, suggestions };
  }

  private async detectFileFormat(file: File): Promise<string> {
    try {
      // Try to detect from file extension first
      const extension = this.getFileExtension(file.name).toLowerCase();
      for (const [format, signature] of this.supportedFormats.entries()) {
        if (signature.extensions.includes(extension)) {
          // Verify with magic numbers if available
          if (signature.magicNumbers.length > 0) {
            const header = await this.readFileHeader(file, 16);
            if (this.checkMagicNumbers(header, signature.magicNumbers)) {
              return format;
            }
          } else {
            return format; // For text files without magic numbers
          }
        }
      }

      // Fall back to MIME type detection
      const detectedMime = await this.detectMimeType(file);
      for (const [format, signature] of this.supportedFormats.entries()) {
        if (signature.mimeTypes.includes(detectedMime)) {
          return format;
        }
      }

    } catch (error) {
      console.warn('File format detection failed:', error);
    }

    return 'pdf'; // Default fallback
  }

  private async detectMimeType(file: File): Promise<string> {
    if (file.type) {
      return file.type;
    }

    // Try to detect from file content
    try {
      const header = await this.readFileHeader(file, 16);
      
      // PDF
      if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
        return 'application/pdf';
      }
      
      // DOCX/ZIP
      if (header[0] === 0x50 && header[1] === 0x4B) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      
      // DOC
      if (header[0] === 0xD0 && header[1] === 0xCF && header[2] === 0x11 && header[3] === 0xE0) {
        return 'application/msword';
      }

    } catch (error) {
      console.warn('MIME type detection failed:', error);
    }

    return 'application/octet-stream';
  }

  private async readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file.slice(0, bytes));
    });
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file, 'utf-8');
    });
  }

  private checkMagicNumbers(header: Uint8Array, magicNumbers: number[][]): boolean {
    return magicNumbers.some(signature => {
      if (signature.length > header.length) return false;
      return signature.every((byte, index) => header[index] === byte);
    });
  }

  private checkUnbalancedBraces(content: string): number {
    let braceCount = 0;
    let unbalanced = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '{' && (i === 0 || content[i - 1] !== '\\')) {
        braceCount++;
      } else if (char === '}' && (i === 0 || content[i - 1] !== '\\')) {
        braceCount--;
        if (braceCount < 0) {
          unbalanced++;
          braceCount = 0;
        }
      }
    }
    
    return unbalanced + Math.abs(braceCount);
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private async performVirusScan(file: File): Promise<{ scanned: boolean; scanDate?: Date; isClean: boolean; threats?: string[]; scanEngine: string; scanVersion: string; }> {
    // Mock virus scanning - in production, integrate with actual antivirus service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          scanned: true,
          scanDate: new Date(),
          isClean: true,
          threats: [],
          scanEngine: 'ClamAV',
          scanVersion: '0.105.0'
        });
      }, 1000); // Simulate scan time
    });
  }
}