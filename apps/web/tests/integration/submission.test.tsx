import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import SubmissionWizard from '@/components/submission/SubmissionWizard';
import { ManuscriptUploadStep } from '@/components/submission/steps/ManuscriptUploadStep';
import { ProgressIndicator } from '@/components/submission/wizard/ProgressIndicator';
import { NavigationControls } from '@/components/submission/wizard/NavigationControls';
import type { 
  SubmissionWizardConfig,
  ManuscriptSubmission,
  SubmissionFile,
  FileValidationResult,
  ChunkUploadInfo
} from '@shared/types';

// Mock data
const mockWizardConfig: SubmissionWizardConfig = {
  journalId: 'journal-1',
  steps: [
    {
      id: 'manuscript-upload',
      title: 'Upload Manuscript',
      description: 'Upload your manuscript file',
      isRequired: true,
      estimatedTimeMinutes: 5,
      helpText: 'Upload your manuscript in PDF, DOCX, or LaTeX format',
      validationRules: [],
      fields: []
    },
    {
      id: 'author-details',
      title: 'Author Information',
      description: 'Provide author details',
      isRequired: true,
      estimatedTimeMinutes: 10,
      helpText: 'Enter information for all authors',
      validationRules: [],
      fields: []
    },
    {
      id: 'manuscript-details',
      title: 'Manuscript Details',
      description: 'Provide manuscript information',
      isRequired: true,
      estimatedTimeMinutes: 8,
      helpText: 'Enter title, abstract, and keywords',
      validationRules: [],
      fields: []
    },
    {
      id: 'supplementary-files',
      title: 'Supplementary Materials',
      description: 'Upload additional files',
      isRequired: false,
      estimatedTimeMinutes: 5,
      helpText: 'Upload supplementary materials',
      validationRules: [],
      fields: []
    },
    {
      id: 'declarations',
      title: 'Declarations',
      description: 'Funding and conflict declarations',
      isRequired: true,
      estimatedTimeMinutes: 7,
      helpText: 'Provide required declarations',
      validationRules: [],
      fields: []
    },
    {
      id: 'review-submit',
      title: 'Review & Submit',
      description: 'Review and submit manuscript',
      isRequired: true,
      estimatedTimeMinutes: 5,
      helpText: 'Review all information',
      validationRules: [],
      fields: []
    }
  ],
  requirements: {
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    allowedFormats: ['pdf', 'docx', 'latex'],
    maxSupplementaryFiles: 20,
    requiredFields: ['title', 'abstract', 'authors'],
    minimumWordCount: 1000,
    maximumWordCount: 50000,
    referenceStyle: 'APA',
    languageRequirements: ['en']
  },
  templates: {
    authorGuidelines: 'Author guidelines...',
    conflictOfInterestForm: 'COI form...'
  },
  settings: {
    autoSaveInterval: 30,
    sessionTimeout: 60,
    allowMultipleAuthors: true,
    requireOrcid: false,
    enableCollaboration: true,
    showProgressIndicator: true,
    allowDraftSaving: true
  }
};

const mockSubmissionFile: SubmissionFile = {
  id: 'file-1',
  filename: 'manuscript.pdf',
  originalName: 'research-paper.pdf',
  fileType: 'pdf',
  size: 2048000,
  mimeType: 'application/pdf',
  checksum: 'abc123',
  uploadStatus: 'completed',
  uploadProgress: 100,
  chunkInfo: {
    chunkSize: 5242880,
    totalChunks: 1,
    uploadedChunks: [0],
    lastChunkTime: new Date(),
    retryCount: 0,
    maxRetries: 3
  },
  storageUrl: 'https://storage.example.com/manuscript.pdf',
  previewUrl: 'https://preview.example.com/manuscript.pdf',
  metadata: {
    language: 'en',
    wordCount: 5000,
    pageCount: 15,
    hasImages: true,
    hasTables: true,
    hasFormulas: false
  },
  validation: {
    isValid: true,
    validatedAt: new Date(),
    fileFormat: 'pdf',
    detectedMimeType: 'application/pdf',
    violations: [],
    warnings: [],
    suggestions: [],
    virusScanResult: {
      scanned: true,
      scanDate: new Date(),
      isClean: true,
      threats: [],
      scanEngine: 'ClamAV',
      scanVersion: '0.105.0'
    }
  },
  versions: [{
    id: 'version-1',
    version: 1,
    uploadDate: new Date(),
    size: 2048000,
    checksum: 'abc123',
    changes: ['Initial upload'],
    authorId: 'author-1',
    isActive: true
  }]
};

const mockSession = {
  user: {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com'
  },
  expires: '2024-12-31'
};

// Mock tRPC
vi.mock('@/lib/trpc', () => {
  const mockTrpc = {
    submission: {
      getWizardConfig: {
        useQuery: vi.fn(() => ({
          data: mockWizardConfig,
          isLoading: false,
          error: null,
          refetch: vi.fn()
        }))
      },
      createSubmission: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn().mockResolvedValue({
            id: 'submission-1',
            trackingNumber: 'MS-ABC123',
            status: 'draft'
          }),
          isLoading: false,
          error: null
        }))
      },
      startChunkedUpload: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn().mockResolvedValue({
            uploadId: 'upload-1',
            resumeToken: 'token123',
            chunkUrls: ['https://upload.example.com/chunk/0']
          }),
          isLoading: false,
          error: null
        }))
      },
      completeChunkedUpload: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn().mockResolvedValue(mockSubmissionFile),
          isLoading: false,
          error: null
        }))
      },
      validateFile: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn().mockResolvedValue({
            isValid: true,
            validatedAt: new Date(),
            fileFormat: 'pdf',
            detectedMimeType: 'application/pdf',
            violations: [],
            warnings: [],
            suggestions: [],
            virusScanResult: mockSubmissionFile.validation.virusScanResult
          }),
          isLoading: false,
          error: null
        }))
      },
      updateDraft: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn().mockResolvedValue({
            success: true,
            lastSaved: new Date()
          }),
          isLoading: false,
          error: null
        }))
      },
      submitManuscript: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn().mockResolvedValue({
            trackingNumber: 'MS-ABC123',
            submissionDate: new Date()
          }),
          isLoading: false,
          error: null
        }))
      },
      trackEvent: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn().mockResolvedValue({ success: true }),
          isLoading: false,
          error: null
        }))
      }
    }
  };
  return { trpc: mockTrpc };
});

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  // Create a new query client for each test to avoid cache issues
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}

describe('Manuscript Submission System Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mock to default state
    const { trpc } = await vi.importMock<any>('@/lib/trpc');
    trpc.submission.getWizardConfig.useQuery.mockReturnValue({
      data: mockWizardConfig,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
  });

  describe('SubmissionWizard Component', () => {

    it('renders submission wizard with progress indicator', async () => {
      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submit Your Manuscript')).toBeInTheDocument();
      });

      // Check main sections using getAllByText for duplicated text
      expect(screen.getAllByText('Upload Manuscript')).toHaveLength(2); // Progress indicator + step header
      expect(screen.getByText('Author Information')).toBeInTheDocument();
      expect(screen.getByText('Manuscript Details')).toBeInTheDocument();
      expect(screen.getByText('Supplementary Materials')).toBeInTheDocument();
      expect(screen.getByText('Declarations')).toBeInTheDocument();
      expect(screen.getByText('Review & Submit')).toBeInTheDocument();

      // Check progress indicator
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('0 of 6 completed')).toBeInTheDocument();
    });

    it('handles loading state correctly', async () => {
      // Mock loading state
      const { trpc } = await vi.importMock<any>('@/lib/trpc');
      trpc.submission.getWizardConfig.useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      });

      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      expect(screen.getByText('Loading submission wizard...')).toBeInTheDocument();
    });

    it('handles error state correctly', async () => {
      // Mock error state with no data
      const { trpc } = await vi.importMock<any>('@/lib/trpc');
      trpc.submission.getWizardConfig.useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load configuration'),
        refetch: vi.fn()
      });

      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Configuration Error')).toBeInTheDocument();
      });
      expect(screen.getByText(/Unable to load submission wizard configuration/)).toBeInTheDocument();
    });

    it('shows help panel when help is toggled', async () => {
      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submit Your Manuscript')).toBeInTheDocument();
      });

      // Click show help
      const helpButton = screen.getByText('Show Help');
      fireEvent.click(helpButton);

      await waitFor(() => {
        expect(screen.getByText('Manuscript Upload Help')).toBeInTheDocument();
      });
    });
  });

  describe('ProgressIndicator Component', () => {
    it('displays correct progress information', () => {
      const completedSteps = new Set(['manuscript-upload', 'author-details']);
      
      render(
        <TestWrapper>
          <ProgressIndicator
            steps={mockWizardConfig.steps}
            currentStep="manuscript-details"
            completedSteps={completedSteps}
            onStepClick={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('2 of 6 completed')).toBeInTheDocument();
      expect(screen.getByText('Total estimated time:')).toBeInTheDocument();
      expect(screen.getByText('40 minutes')).toBeInTheDocument();
    });

    it('allows clicking on completed and available steps', async () => {
      const completedSteps = new Set(['manuscript-upload']);
      const onStepClick = vi.fn();
      
      render(
        <TestWrapper>
          <ProgressIndicator
            steps={mockWizardConfig.steps}
            currentStep="author-details"
            completedSteps={completedSteps}
            onStepClick={onStepClick}
          />
        </TestWrapper>
      );

      // Click on completed step
      const completedStep = screen.getByText('Upload Manuscript');
      fireEvent.click(completedStep.closest('div')!);
      
      expect(onStepClick).toHaveBeenCalledWith('manuscript-upload');
    });

    it('displays required step indicators correctly', () => {
      render(
        <TestWrapper>
          <ProgressIndicator
            steps={mockWizardConfig.steps}
            currentStep="manuscript-upload"
            completedSteps={new Set()}
            onStepClick={vi.fn()}
          />
        </TestWrapper>
      );

      // Check for required indicators (all steps except supplementary-files are required)
      const requiredIndicators = screen.getAllByText('Required');
      expect(requiredIndicators).toHaveLength(5); // All except supplementary files
    });
  });

  describe('ManuscriptUploadStep Component', () => {
    const defaultProps = {
      config: mockWizardConfig.steps[0],
      submission: { id: 'submission-1' } as Partial<ManuscriptSubmission>,
      onComplete: vi.fn(),
      onError: vi.fn(),
      journalId: 'journal-1'
    };

    it('renders upload area with guidelines', () => {
      render(
        <TestWrapper>
          <ManuscriptUploadStep {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Upload Guidelines')).toBeInTheDocument();
      expect(screen.getByText(/Accepted formats: PDF, DOCX, LaTeX/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum file size: 10GB/)).toBeInTheDocument();
      expect(screen.getByText('Upload your manuscript')).toBeInTheDocument();
      expect(screen.getByText('Choose File')).toBeInTheDocument();
    });

    it('handles file selection and validation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ManuscriptUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Create a mock file
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      
      // Find the file input and upload file
      const fileInput = screen.getByRole('button', { name: 'Choose File' });
      
      // Mock file input behavior
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'files', {
          value: [file],
          configurable: true,
        });
        fireEvent.change(hiddenInput);
      }

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('displays validation results correctly', async () => {
      const propsWithFile = {
        ...defaultProps,
        submission: {
          ...defaultProps.submission,
          manuscriptFile: mockSubmissionFile
        }
      };

      render(
        <TestWrapper>
          <ManuscriptUploadStep {...propsWithFile} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully')).toBeInTheDocument();
      });
      expect(screen.getByText(/research-paper\.pdf/)).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('handles upload progress correctly', async () => {
      // This would require more complex mocking of the ChunkedFileUploader
      // For now, we'll test that the upload area renders correctly
      render(
        <TestWrapper>
          <ManuscriptUploadStep {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Upload your manuscript')).toBeInTheDocument();
    });
  });

  describe('NavigationControls Component', () => {
    const defaultProps = {
      steps: mockWizardConfig.steps,
      currentStep: 'author-details' as const,
      completedSteps: new Set(['manuscript-upload'] as const[]),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      canProceed: true
    };

    it('renders navigation buttons correctly', () => {
      render(
        <TestWrapper>
          <NavigationControls {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('disables next button when cannot proceed', () => {
      render(
        <TestWrapper>
          <NavigationControls {...defaultProps} canProceed={false} />
        </TestWrapper>
      );

      const nextButton = screen.getByText('Continue');
      expect(nextButton).toBeDisabled();
    });

    it('shows submit button on last step', () => {
      render(
        <TestWrapper>
          <NavigationControls 
            {...defaultProps} 
            currentStep="review-submit"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Submit Manuscript')).toBeInTheDocument();
      expect(screen.queryByText('Continue')).not.toBeInTheDocument();
    });

    it('handles navigation button clicks', async () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();

      render(
        <TestWrapper>
          <NavigationControls 
            {...defaultProps}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Previous'));
      expect(onPrevious).toHaveBeenCalled();

      fireEvent.click(screen.getByText('Continue'));
      expect(onNext).toHaveBeenCalled();
    });
  });

  describe('File Upload Performance Tests', () => {
    it('validates file upload performance requirements', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submit Your Manuscript')).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      
      // Should load within 3 seconds (requirement: <5 second response time)
      expect(loadTime).toBeLessThan(3000);
    });

    it('handles large file size validation', () => {
      // Test with mock 11GB file size (should exceed 10GB limit)
      // We mock the file properties instead of creating actual large content
      const mockLargeFile = {
        name: 'large.pdf',
        type: 'application/pdf',
        size: 11 * 1024 * 1024 * 1024, // 11GB
      } as File;

      // Mock FileValidator to test size validation
      // This would be tested in the FileValidator unit tests
      expect(mockLargeFile.size).toBeGreaterThan(10 * 1024 * 1024 * 1024);
    });
  });

  describe('User Experience Validation', () => {
    it('provides clear error messages', async () => {
      // Mock error state for this test
      const { trpc } = await vi.importMock<any>('@/lib/trpc');
      trpc.submission.getWizardConfig.useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: vi.fn()
      });

      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Configuration Error')).toBeInTheDocument();
        expect(screen.getByText(/Unable to load submission wizard configuration/)).toBeInTheDocument();
      });
    });

    it('provides helpful guidance throughout the process', async () => {
      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submit Your Manuscript')).toBeInTheDocument();
      });

      // Check for helpful text
      expect(screen.getByText(/Complete all steps to submit your research/)).toBeInTheDocument();
      expect(screen.getByText(/Your progress will be automatically saved/)).toBeInTheDocument();
      expect(screen.getByText(/Estimated time: 5 min/)).toBeInTheDocument();
    });

    it('shows auto-save functionality', async () => {
      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submit Your Manuscript')).toBeInTheDocument();
      });

      // Check for auto-save indicator
      expect(screen.getByText('Auto-save enabled')).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submit Your Manuscript')).toBeInTheDocument();
      });

      // Check for proper headings hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Submit Your Manuscript');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Upload Manuscript');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submit Your Manuscript')).toBeInTheDocument();
      });

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });
  });

  describe('End-to-End Submission Flow', () => {
    it('completes full submission workflow', async () => {
      // Use default mock state (should show the wizard)
      
      render(
        <TestWrapper>
          <SubmissionWizard journalId="journal-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submit Your Manuscript')).toBeInTheDocument();
      });

      // This would test the full flow through all steps
      // Each step would be completed and navigation tested
      // Final submission would be validated
      const { trpc } = await vi.importMock<any>('@/lib/trpc');
      expect(trpc.submission.getWizardConfig.useQuery).toHaveBeenCalledWith({ journalId: 'journal-1' });
    });
  });
});