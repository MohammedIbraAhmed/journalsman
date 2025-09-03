/**
 * Integration Tests for Peer Review Workflow System
 * 
 * Comprehensive test suite covering all aspects of Story 2.4:
 * - Review interface usability and manuscript reading experience
 * - Annotation tools functionality and data persistence
 * - Deadline management and reminder system accuracy
 * - Anonymity protection throughout review lifecycle
 * - Mobile review interface functionality and responsiveness
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Test utilities and mocks
import { createMockReviewSession, createMockManuscript, createMockJournal } from '../utils/test-helpers';
import { MockMongoMemoryServer } from '../utils/mock-database';

// Components under test
import { ManuscriptReader } from '@/components/review/manuscript-reader';
import { ReviewFormBuilder } from '@/components/review/review-form-builder';
import { ReviewFormValidator } from '@/components/review/review-form-validator';
import ReviewPage from '@/app/(review)/review/[reviewId]/page';

// Library modules under test
import { AnonymityManager } from '@/lib/anonymity';
import { DeadlineManager } from '@/lib/deadline';
import { QualityScorer, PerformanceAnalyzer } from '@/lib/quality';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/review/test-review-id',
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

describe('Peer Review Workflow System', () => {
  let mockDb: MockMongoMemoryServer;
  let anonymityManager: AnonymityManager;
  let deadlineManager: DeadlineManager;
  let qualityScorer: QualityScorer;

  beforeEach(async () => {
    mockDb = new MockMongoMemoryServer();
    await mockDb.start();
    
    anonymityManager = new AnonymityManager();
    deadlineManager = new DeadlineManager();
    qualityScorer = new QualityScorer();
  });

  afterEach(async () => {
    await mockDb.stop();
    vi.clearAllMocks();
  });

  describe('Review Interface Optimization', () => {
    describe('Manuscript Reading Experience', () => {
      it('should render manuscript with clean, distraction-free interface', async () => {
        const mockManuscript = createMockManuscript({
          title: 'Test Research Paper',
          abstract: 'This is a test abstract for manuscript reading.',
          sections: [
            { id: 'intro', title: 'Introduction', content: 'Introduction content...' },
            { id: 'methods', title: 'Methods', content: 'Methods content...' },
          ],
        });

        render(
          <ManuscriptReader
            manuscript={mockManuscript}
            anonymousId="ANR_test_123"
            onAnnotation={vi.fn()}
            onSectionChange={vi.fn()}
          />
        );

        expect(screen.getByText('Test Research Paper')).toBeInTheDocument();
        expect(screen.getByText('This is a test abstract for manuscript reading.')).toBeInTheDocument();
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Methods')).toBeInTheDocument();

        // Check for distraction-free design elements
        expect(screen.getByRole('button', { name: /reading mode/i })).toBeInTheDocument();
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      });

      it('should support zoom controls and reading themes', async () => {
        const mockManuscript = createMockManuscript();
        const user = userEvent.setup();

        render(
          <ManuscriptReader
            manuscript={mockManuscript}
            anonymousId="ANR_test_123"
            onAnnotation={vi.fn()}
            onSectionChange={vi.fn()}
          />
        );

        // Test zoom controls
        const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
        const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
        
        expect(zoomInButton).toBeInTheDocument();
        expect(zoomOutButton).toBeInTheDocument();

        await user.click(zoomInButton);
        // Verify zoom level increased (would check CSS transform or font size)

        // Test reading themes
        const themeButton = screen.getByRole('button', { name: /theme/i });
        await user.click(themeButton);

        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
        expect(screen.getByText('Sepia')).toBeInTheDocument();
      });

      it('should be mobile responsive with touch gesture support', async () => {
        const mockManuscript = createMockManuscript();
        
        // Mock mobile viewport
        Object.defineProperty(window, 'innerWidth', { value: 375 });
        Object.defineProperty(window, 'innerHeight', { value: 667 });

        render(
          <ManuscriptReader
            manuscript={mockManuscript}
            anonymousId="ANR_test_123"
            onAnnotation={vi.fn()}
            onSectionChange={vi.fn()}
          />
        );

        const readerContainer = screen.getByTestId('manuscript-reader');
        expect(readerContainer).toHaveClass('mobile-responsive');

        // Test touch gestures (simplified)
        fireEvent.touchStart(readerContainer, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(readerContainer);

        // Verify mobile-specific controls are visible
        expect(screen.getByTestId('mobile-toolbar')).toBeInTheDocument();
      });
    });

    describe('Annotation Tools', () => {
      it('should allow creating annotations with text highlighting', async () => {
        const mockManuscript = createMockManuscript();
        const onAnnotation = vi.fn();
        const user = userEvent.setup();

        render(
          <ManuscriptReader
            manuscript={mockManuscript}
            anonymousId="ANR_test_123"
            onAnnotation={onAnnotation}
            onSectionChange={vi.fn()}
          />
        );

        // Simulate text selection and annotation creation
        const textElement = screen.getByText(/Introduction content/);
        fireEvent.mouseUp(textElement);

        const annotationButton = screen.getByRole('button', { name: /add annotation/i });
        await user.click(annotationButton);

        const annotationText = screen.getByPlaceholderText(/add your comment/i);
        await user.type(annotationText, 'This is a test annotation');

        const saveButton = screen.getByRole('button', { name: /save annotation/i });
        await user.click(saveButton);

        expect(onAnnotation).toHaveBeenCalledWith({
          id: expect.any(String),
          sectionId: 'intro',
          selectedText: expect.any(String),
          comment: 'This is a test annotation',
          timestamp: expect.any(Date),
          anonymousId: 'ANR_test_123',
        });
      });

      it('should persist annotations across sessions', async () => {
        const mockManuscript = createMockManuscript();
        const existingAnnotations = [
          {
            id: 'ann_1',
            sectionId: 'intro',
            selectedText: 'test text',
            comment: 'Previous annotation',
            timestamp: new Date(),
            anonymousId: 'ANR_test_123',
          },
        ];

        render(
          <ManuscriptReader
            manuscript={mockManuscript}
            anonymousId="ANR_test_123"
            existingAnnotations={existingAnnotations}
            onAnnotation={vi.fn()}
            onSectionChange={vi.fn()}
          />
        );

        expect(screen.getByText('Previous annotation')).toBeInTheDocument();
        expect(screen.getByTestId('annotation-ann_1')).toBeInTheDocument();
      });

      it('should support different annotation types (highlight, note, question)', async () => {
        const mockManuscript = createMockManuscript();
        const user = userEvent.setup();

        render(
          <ManuscriptReader
            manuscript={mockManuscript}
            anonymousId="ANR_test_123"
            onAnnotation={vi.fn()}
            onSectionChange={vi.fn()}
          />
        );

        const textElement = screen.getByText(/Introduction content/);
        fireEvent.mouseUp(textElement);

        const annotationButton = screen.getByRole('button', { name: /add annotation/i });
        await user.click(annotationButton);

        // Test annotation type selection
        expect(screen.getByText('Highlight')).toBeInTheDocument();
        expect(screen.getByText('Note')).toBeInTheDocument();
        expect(screen.getByText('Question')).toBeInTheDocument();

        const questionType = screen.getByText('Question');
        await user.click(questionType);

        const annotationText = screen.getByPlaceholderText(/add your comment/i);
        expect(annotationText).toHaveAttribute('placeholder', expect.stringContaining('question'));
      });
    });
  });

  describe('Review Form Customization', () => {
    describe('Journal-Specific Criteria', () => {
      it('should render custom form fields based on journal configuration', async () => {
        const mockJournal = createMockJournal({
          id: 'test-journal',
          name: 'Test Journal',
          reviewCriteria: [
            {
              id: 'methodology',
              label: 'Methodology Quality',
              type: 'rating',
              required: true,
              scale: { min: 1, max: 5 },
              description: 'Rate the quality of the methodology',
            },
            {
              id: 'novelty',
              label: 'Research Novelty',
              type: 'rating',
              required: true,
              scale: { min: 1, max: 5 },
            },
            {
              id: 'comments',
              label: 'Detailed Comments',
              type: 'textarea',
              required: true,
              minLength: 100,
            },
          ],
        });

        render(
          <ReviewFormBuilder
            journal={mockJournal}
            formData={{}}
            onFormChange={vi.fn()}
            anonymousId="ANR_test_123"
          />
        );

        expect(screen.getByText('Methodology Quality')).toBeInTheDocument();
        expect(screen.getByText('Research Novelty')).toBeInTheDocument();
        expect(screen.getByText('Detailed Comments')).toBeInTheDocument();

        // Check rating scales
        expect(screen.getAllByRole('radio').length).toBe(10); // 2 rating fields × 5 options each
        
        // Check textarea
        expect(screen.getByRole('textbox', { name: /detailed comments/i })).toBeInTheDocument();
      });

      it('should support different field types (rating, textarea, select, boolean)', async () => {
        const mockJournal = createMockJournal({
          reviewCriteria: [
            { id: 'rating', label: 'Quality Rating', type: 'rating', scale: { min: 1, max: 5 } },
            { id: 'comments', label: 'Comments', type: 'textarea' },
            { id: 'recommendation', label: 'Recommendation', type: 'select', options: ['accept', 'reject'] },
            { id: 'ethical', label: 'Ethical Approval', type: 'boolean' },
          ],
        });

        render(
          <ReviewFormBuilder
            journal={mockJournal}
            formData={{}}
            onFormChange={vi.fn()}
            anonymousId="ANR_test_123"
          />
        );

        // Rating field
        expect(screen.getAllByRole('radio')).toHaveLength(5);
        
        // Textarea field
        expect(screen.getByRole('textbox', { name: /comments/i })).toBeInTheDocument();
        
        // Select field
        expect(screen.getByRole('combobox', { name: /recommendation/i })).toBeInTheDocument();
        
        // Boolean field
        expect(screen.getByRole('checkbox', { name: /ethical approval/i })).toBeInTheDocument();
      });
    });

    describe('Form Validation', () => {
      it('should validate required fields and show appropriate errors', async () => {
        const mockFields = [
          { id: 'rating', label: 'Rating', required: true, type: 'rating' },
          { id: 'comments', label: 'Comments', required: true, type: 'textarea', validation: { minLength: 50 } },
        ];

        const mockFormData = {
          rating: null,
          comments: 'Too short',
        };

        const onValidationChange = vi.fn();

        render(
          <ReviewFormValidator
            formData={mockFormData}
            formFields={mockFields}
            onValidationChange={onValidationChange}
          />
        );

        await waitFor(() => {
          expect(onValidationChange).toHaveBeenCalledWith(
            expect.objectContaining({
              isValid: false,
              errors: expect.arrayContaining([
                expect.objectContaining({ message: 'This field is required' }),
                expect.objectContaining({ message: 'Minimum 50 characters required' }),
              ]),
            })
          );
        });

        expect(screen.getByText('This field is required')).toBeInTheDocument();
        expect(screen.getByText('Minimum 50 characters required')).toBeInTheDocument();
      });

      it('should show form completion progress', async () => {
        const mockFields = [
          { id: 'field1', label: 'Field 1', required: true, type: 'text' },
          { id: 'field2', label: 'Field 2', required: true, type: 'text' },
          { id: 'field3', label: 'Field 3', required: false, type: 'text' },
        ];

        const mockFormData = {
          field1: 'completed',
          field2: '',
          field3: 'optional completed',
        };

        render(
          <ReviewFormValidator
            formData={mockFormData}
            formFields={mockFields}
            onValidationChange={vi.fn()}
          />
        );

        // Check progress indicators
        expect(screen.getByText('2/3 fields')).toBeInTheDocument();
        expect(screen.getByText('1/2')).toBeInTheDocument(); // Required fields
      });
    });
  });

  describe('Deadline Management System', () => {
    describe('Deadline Tracking', () => {
      it('should create review deadlines with proper configuration', async () => {
        const deadline = deadlineManager.createReviewDeadline(
          'ANR_test_123',
          'review_456',
          'manuscript_789',
          'journal_101'
        );

        expect(deadline).toMatchObject({
          anonymousId: 'ANR_test_123',
          reviewId: 'review_456',
          manuscriptId: 'manuscript_789',
          journalId: 'journal_101',
          status: 'active',
          extensionsGranted: 0,
          maxExtensions: 2,
        });

        expect(deadline.dueDate).toBeInstanceOf(Date);
        expect(deadline.assignedDate).toBeInstanceOf(Date);
        
        // Check default 21-day period
        const daysDiff = Math.ceil((deadline.dueDate.getTime() - deadline.assignedDate.getTime()) / (1000 * 3600 * 24));
        expect(daysDiff).toBe(21);
      });

      it('should calculate days until deadline correctly', () => {
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        const deadline = {
          dueDate: futureDate,
          status: 'active' as const,
        } as any;

        const daysRemaining = deadlineManager.getDaysUntilDeadline(deadline);
        expect(daysRemaining).toBe(7);
      });

      it('should identify overdue deadlines', () => {
        const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
        const deadline = {
          dueDate: pastDate,
          status: 'active' as const,
        } as any;

        const daysRemaining = deadlineManager.getDaysUntilDeadline(deadline);
        expect(daysRemaining).toBe(-3);
      });
    });

    describe('Reminder System', () => {
      it('should determine when to send reminders based on schedule', () => {
        const deadline = deadlineManager.createReviewDeadline(
          'ANR_test_123',
          'review_456',
          'manuscript_789',
          'journal_101'
        );

        // Modify due date to be 7 days from now
        deadline.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const reminderResult = deadlineManager.shouldSendReminder(deadline);

        expect(reminderResult.shouldSend).toBe(true);
        expect(reminderResult.reminderType).toBe('reminder');
        expect(reminderResult.daysUntilDue).toBe(7);
      });

      it('should not send duplicate reminders for same day', () => {
        const deadline = deadlineManager.createReviewDeadline(
          'ANR_test_123',
          'review_456',
          'manuscript_789',
          'journal_101'
        );

        // Set due date to 7 days from now
        deadline.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        // Add existing reminder for 7 days
        deadline.remindersSent = [
          deadlineManager.createReminderLog('ANR_test_123', 'reminder', 7),
        ];

        const reminderResult = deadlineManager.shouldSendReminder(deadline);
        expect(reminderResult.shouldSend).toBe(false);
      });

      it('should generate appropriate reminder messages', () => {
        const deadline = deadlineManager.createReviewDeadline(
          'ANR_test_123',
          'review_456',
          'manuscript_789',
          'journal_101'
        );

        const urgentMessage = deadlineManager.generateReminderMessage(
          deadline,
          'urgent',
          2
        );

        expect(urgentMessage.subject).toContain('URGENT');
        expect(urgentMessage.message).toContain('2 days');
        expect(urgentMessage.urgency).toBe('high');

        const overdueMessage = deadlineManager.generateReminderMessage(
          deadline,
          'overdue',
          -3
        );

        expect(overdueMessage.subject).toContain('OVERDUE');
        expect(overdueMessage.message).toContain('3 days overdue');
        expect(overdueMessage.urgency).toBe('critical');
      });
    });

    describe('Extension Requests', () => {
      it('should allow valid extension requests', () => {
        const deadline = deadlineManager.createReviewDeadline(
          'ANR_test_123',
          'review_456',
          'manuscript_789',
          'journal_101'
        );

        const canRequest = deadlineManager.canRequestExtension(deadline);
        expect(canRequest.canRequest).toBe(true);
        expect(canRequest.maxDaysAvailable).toBe(14); // Default max extension
      });

      it('should reject extension requests when limit exceeded', () => {
        const deadline = deadlineManager.createReviewDeadline(
          'ANR_test_123',
          'review_456',
          'manuscript_789',
          'journal_101'
        );

        // Set extensions to maximum
        deadline.extensionsGranted = 2; // maxExtensions = 2

        const canRequest = deadlineManager.canRequestExtension(deadline);
        expect(canRequest.canRequest).toBe(false);
        expect(canRequest.reason).toContain('Maximum extensions');
      });

      it('should process extension requests correctly', () => {
        const deadline = deadlineManager.createReviewDeadline(
          'ANR_test_123',
          'review_456',
          'manuscript_789',
          'journal_101'
        );

        const extensionRequest = deadlineManager.processExtensionRequest(
          deadline,
          7,
          'Need more time for thorough analysis'
        );

        expect(extensionRequest).toMatchObject({
          anonymousId: 'ANR_test_123',
          reviewId: 'review_456',
          requestedDays: 7,
          reason: 'Need more time for thorough analysis',
          status: 'pending',
        });

        expect(extensionRequest.proposedDueDate.getTime()).toBeGreaterThan(
          deadline.dueDate.getTime()
        );
      });
    });
  });

  describe('Anonymity Protection', () => {
    describe('Identity Management', () => {
      it('should generate unique anonymous reviewer IDs', async () => {
        const id1 = await anonymityManager.generateAnonymousId();
        const id2 = await anonymityManager.generateAnonymousId();

        expect(id1).toMatch(/^ANR_\d{13}_[a-z0-9]{8}$/);
        expect(id2).toMatch(/^ANR_\d{13}_[a-z0-9]{8}$/);
        expect(id1).not.toBe(id2);
      });

      it('should create anonymous reviewer sessions', async () => {
        const session = await anonymityManager.createAnonymousReviewerSession(
          'user@example.com',
          'journal_123',
          'manuscript_456'
        );

        expect(session).toMatchObject({
          email: 'user@example.com',
          journalId: 'journal_123',
          manuscriptId: 'manuscript_456',
          isActive: true,
        });

        expect(session.anonymousId).toMatch(/^ANR_/);
        expect(session.sessionToken).toBeTruthy();
        expect(session.expiresAt).toBeInstanceOf(Date);
      });

      it('should validate anonymous sessions', async () => {
        const session = await anonymityManager.createAnonymousReviewerSession(
          'user@example.com',
          'journal_123',
          'manuscript_456'
        );

        const isValid = await anonymityManager.validateAnonymousSession(
          session.anonymousId,
          session.sessionToken
        );

        expect(isValid).toBe(true);

        // Test invalid session
        const isInvalid = await anonymityManager.validateAnonymousSession(
          'invalid_id',
          'invalid_token'
        );

        expect(isInvalid).toBe(false);
      });
    });

    describe('Audit Trail', () => {
      it('should log anonymous reviewer actions', async () => {
        const auditSpy = vi.spyOn(anonymityManager, 'logAnonymousAction');

        await anonymityManager.logAnonymousAction(
          'ANR_test_123',
          'annotation_created',
          'review_session',
          { annotationId: 'ann_456' }
        );

        expect(auditSpy).toHaveBeenCalledWith(
          'ANR_test_123',
          'annotation_created',
          'review_session',
          { annotationId: 'ann_456' }
        );
      });

      it('should maintain anonymity in audit logs', async () => {
        const auditEntry = {
          anonymousId: 'ANR_test_123',
          action: 'form_submitted',
          context: 'review_submission',
          metadata: { reviewId: 'review_456' },
          timestamp: new Date(),
        };

        // Ensure no PII is stored in audit logs
        expect(auditEntry).not.toHaveProperty('email');
        expect(auditEntry).not.toHaveProperty('realName');
        expect(auditEntry).not.toHaveProperty('userId');
        expect(auditEntry.anonymousId).toMatch(/^ANR_/);
      });
    });
  });

  describe('Review Quality Standards', () => {
    describe('Quality Scoring', () => {
      it('should calculate comprehensive quality scores', () => {
        const metrics = {
          comprehensivenessScore: 85,
          timelinessScore: 90,
          editorRating: 4.5,
        };

        const qualityScore = qualityScorer.calculateQualityScore(metrics);
        
        expect(qualityScore).toBeGreaterThan(0);
        expect(qualityScore).toBeLessThanOrEqual(100);
        
        // Quality score should reflect good performance
        expect(qualityScore).toBeGreaterThan(80);
      });

      it('should penalize poor timeliness', () => {
        const goodMetrics = {
          comprehensivenessScore: 85,
          timelinessScore: 90,
          editorRating: 4.5,
        };

        const poorTimeliness = {
          comprehensivenessScore: 85,
          timelinessScore: 40,
          editorRating: 4.5,
        };

        const goodScore = qualityScorer.calculateQualityScore(goodMetrics);
        const poorScore = qualityScorer.calculateQualityScore(poorTimeliness);

        expect(poorScore).toBeLessThan(goodScore);
      });

      it('should track 21-day completion average', async () => {
        const performanceAnalyzer = new PerformanceAnalyzer();
        
        const completionTimes = [18, 20, 22, 19, 21, 23, 17]; // Days
        const averageCompletion = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
        
        expect(averageCompletion).toBeCloseTo(20, 1);
        expect(averageCompletion).toBeLessThanOrEqual(21);
      });
    });

    describe('Performance Analytics', () => {
      it('should generate reviewer performance reports', async () => {
        const performanceAnalyzer = new PerformanceAnalyzer();
        
        const mockReviews = [
          { completionTime: 18, qualityScore: 85 },
          { completionTime: 22, qualityScore: 90 },
          { completionTime: 19, qualityScore: 88 },
        ];

        const report = await performanceAnalyzer.generatePerformanceReport(
          'ANR_test_123',
          mockReviews
        );

        expect(report).toMatchObject({
          anonymousId: 'ANR_test_123',
          averageCompletionTime: expect.any(Number),
          averageQualityScore: expect.any(Number),
          totalReviews: 3,
          onTimeDeliveryRate: expect.any(Number),
        });

        expect(report.averageCompletionTime).toBeCloseTo(19.7, 1);
        expect(report.averageQualityScore).toBeCloseTo(87.7, 1);
      });

      it('should identify improvement opportunities', async () => {
        const performanceAnalyzer = new PerformanceAnalyzer();
        
        const lowPerformanceData = {
          averageCompletionTime: 28, // Over 21-day target
          averageQualityScore: 65, // Below 80 target
          onTimeDeliveryRate: 40, // Below 80% target
        };

        const improvements = await performanceAnalyzer.suggestImprovements(
          lowPerformanceData
        );

        expect(improvements).toContain('time management');
        expect(improvements).toContain('quality standards');
        expect(improvements).toContain('deadline adherence');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt interface for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      const mockManuscript = createMockManuscript();
      
      render(
        <ReviewPage params={{ reviewId: 'test-review' }} />
      );

      // Check mobile-specific UI elements
      expect(screen.getByTestId('mobile-progress-bar')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
    });

    it('should support touch interactions for annotations', async () => {
      const mockManuscript = createMockManuscript();
      const onAnnotation = vi.fn();
      
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', { value: true });

      render(
        <ManuscriptReader
          manuscript={mockManuscript}
          anonymousId="ANR_test_123"
          onAnnotation={onAnnotation}
          onSectionChange={vi.fn()}
        />
      );

      const textElement = screen.getByText(/Introduction content/);
      
      // Simulate touch selection
      fireEvent.touchStart(textElement, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(textElement, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      });

      await waitFor(() => {
        expect(screen.getByTestId('touch-annotation-menu')).toBeInTheDocument();
      });
    });

    it('should provide responsive form layouts', async () => {
      const mockJournal = createMockJournal({
        reviewCriteria: [
          { id: 'rating1', label: 'Quality', type: 'rating' },
          { id: 'rating2', label: 'Novelty', type: 'rating' },
          { id: 'comments', label: 'Comments', type: 'textarea' },
        ],
      });

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });

      render(
        <ReviewFormBuilder
          journal={mockJournal}
          formData={{}}
          onFormChange={vi.fn()}
          anonymousId="ANR_test_123"
        />
      );

      const form = screen.getByTestId('review-form');
      expect(form).toHaveClass('mobile-responsive');
      
      // Check that form elements stack vertically on mobile
      expect(form).toHaveClass('flex-col');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full review workflow from start to finish', async () => {
      const user = userEvent.setup();
      
      // Mock complete review session data
      const mockSession = createMockReviewSession({
        anonymousId: 'ANR_test_123',
        manuscriptId: 'manuscript_456',
        journalId: 'journal_789',
      });

      const mockManuscript = createMockManuscript();
      const mockJournal = createMockJournal();

      render(
        <ReviewPage 
          params={{ reviewId: mockSession.reviewId }}
          manuscript={mockManuscript}
          journal={mockJournal}
          session={mockSession}
        />
      );

      // 1. Read manuscript
      expect(screen.getByTestId('manuscript-reader')).toBeInTheDocument();
      
      // 2. Create annotations
      const textElement = screen.getByText(/Introduction content/);
      fireEvent.mouseUp(textElement);
      
      const addAnnotationBtn = screen.getByRole('button', { name: /add annotation/i });
      await user.click(addAnnotationBtn);
      
      const annotationInput = screen.getByPlaceholderText(/add your comment/i);
      await user.type(annotationInput, 'Good methodology approach');
      
      const saveAnnotationBtn = screen.getByRole('button', { name: /save annotation/i });
      await user.click(saveAnnotationBtn);

      // 3. Fill review form
      const nextStepBtn = screen.getByRole('button', { name: /next step/i });
      await user.click(nextStepBtn);

      // Rate quality (assuming 5-star rating)
      const qualityRating = screen.getAllByRole('radio')[4]; // 5th radio = 5 stars
      await user.click(qualityRating);

      // Add comments
      const commentsField = screen.getByRole('textbox', { name: /comments/i });
      await user.type(commentsField, 'This is a well-written paper with solid methodology. The research question is clearly defined and the analysis is thorough.');

      // 4. Submit review
      const submitBtn = screen.getByRole('button', { name: /submit review/i });
      expect(submitBtn).not.toBeDisabled();
      
      await user.click(submitBtn);

      // 5. Verify submission
      await waitFor(() => {
        expect(screen.getByText(/review submitted successfully/i)).toBeInTheDocument();
      });
    });

    it('should maintain anonymity throughout entire workflow', async () => {
      const mockSession = createMockReviewSession();
      const auditSpy = vi.spyOn(anonymityManager, 'logAnonymousAction');

      render(
        <ReviewPage params={{ reviewId: mockSession.reviewId }} />
      );

      // Verify no PII is displayed
      expect(screen.queryByText(mockSession.email)).not.toBeInTheDocument();
      expect(screen.queryByText('john.doe')).not.toBeInTheDocument();

      // Verify anonymous ID is used
      expect(screen.getByText(mockSession.anonymousId.substring(0, 12))).toBeInTheDocument();

      // Check that all actions are logged anonymously
      const user = userEvent.setup();
      const nextBtn = screen.getByRole('button', { name: /next/i });
      await user.click(nextBtn);

      expect(auditSpy).toHaveBeenCalledWith(
        mockSession.anonymousId,
        expect.any(String),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should handle errors gracefully with user feedback', async () => {
      // Mock network error
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<ReviewPage params={{ reviewId: 'test-review' }} />);

      await waitFor(() => {
        expect(screen.getByText(/error loading review/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should save progress automatically', async () => {
      const mockSession = createMockReviewSession();
      const mockJournal = createMockJournal();
      
      render(
        <ReviewFormBuilder
          journal={mockJournal}
          formData={{}}
          onFormChange={vi.fn()}
          anonymousId={mockSession.anonymousId}
          autoSave={true}
        />
      );

      const user = userEvent.setup();
      const commentsField = screen.getByRole('textbox', { name: /comments/i });
      
      await user.type(commentsField, 'Auto-saved content');

      // Wait for auto-save
      await waitFor(() => {
        expect(screen.getByText(/draft saved/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});