/**
 * Test Utilities and Mock Data Helpers
 * 
 * Provides mock data and helper functions for testing the peer review workflow
 */

import { ObjectId } from 'mongodb';

// Mock data interfaces matching our real types
export interface MockManuscript {
  id: string;
  title: string;
  abstract: string;
  authors: Array<{ name: string; affiliation: string }>;
  sections: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  figures?: Array<{
    id: string;
    title: string;
    caption: string;
    url: string;
  }>;
  tables?: Array<{
    id: string;
    title: string;
    caption: string;
    data: any[][];
  }>;
  references: Array<{
    id: string;
    citation: string;
  }>;
  metadata: {
    submissionDate: Date;
    journalId: string;
    manuscriptType: string;
    keywords: string[];
  };
}

export interface MockJournal {
  id: string;
  name: string;
  abbreviation: string;
  reviewCriteria: Array<{
    id: string;
    label: string;
    type: 'rating' | 'textarea' | 'select' | 'boolean' | 'recommendation';
    required: boolean;
    description?: string;
    scale?: { min: number; max: number };
    options?: string[];
    validation?: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    };
  }>;
  reviewGuidelines: string;
  deadlinePolicy: {
    standardPeriod: number;
    maxExtensions: number;
    reminderSchedule: number[];
  };
}

export interface MockReviewSession {
  id: string;
  anonymousId: string;
  reviewId: string;
  manuscriptId: string;
  journalId: string;
  email: string;
  sessionToken: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  reviewStatus: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: {
    manuscriptRead: boolean;
    annotationsCreated: number;
    formCompleted: boolean;
    submitted: boolean;
  };
}

/**
 * Create mock manuscript data
 */
export function createMockManuscript(overrides?: Partial<MockManuscript>): MockManuscript {
  const defaultManuscript: MockManuscript = {
    id: `manuscript_${Date.now()}`,
    title: 'Novel Approaches to Machine Learning in Healthcare Applications',
    abstract: 'This paper presents innovative machine learning techniques for healthcare data analysis, focusing on predictive models for patient outcomes. Our methodology demonstrates significant improvements over existing approaches.',
    authors: [
      { name: 'Dr. Jane Smith', affiliation: 'University of Technology' },
      { name: 'Dr. John Doe', affiliation: 'Medical Research Institute' },
    ],
    sections: [
      {
        id: 'intro',
        title: 'Introduction',
        content: 'Introduction content discussing the background and motivation for this research. The healthcare industry has seen rapid advancement in data analytics capabilities...',
      },
      {
        id: 'methods',
        title: 'Methods',
        content: 'Methods section detailing the experimental design and analytical approaches used in this study. We employed a comprehensive dataset of patient records...',
      },
      {
        id: 'results',
        title: 'Results',
        content: 'Results section presenting the key findings of our analysis. The machine learning models achieved an accuracy of 94.2% in predicting patient outcomes...',
      },
      {
        id: 'discussion',
        title: 'Discussion',
        content: 'Discussion of results and their implications for clinical practice. Our findings suggest that machine learning can significantly enhance healthcare decision-making...',
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        content: 'Conclusions and future directions for research. This work demonstrates the potential for AI-driven healthcare analytics to improve patient care...',
      },
    ],
    figures: [
      {
        id: 'fig1',
        title: 'Figure 1: Model Performance Comparison',
        caption: 'Comparison of accuracy metrics across different machine learning models',
        url: '/mock-figures/fig1.png',
      },
    ],
    tables: [
      {
        id: 'table1',
        title: 'Table 1: Dataset Characteristics',
        caption: 'Summary statistics of the patient dataset used in analysis',
        data: [
          ['Metric', 'Value', 'Range'],
          ['Sample Size', '10,000', '5,000-15,000'],
          ['Features', '45', '30-60'],
          ['Accuracy', '94.2%', '90-98%'],
        ],
      },
    ],
    references: [
      {
        id: 'ref1',
        citation: 'Smith, J. et al. (2023). Machine Learning in Healthcare. Nature Medicine, 15(3), 123-145.',
      },
      {
        id: 'ref2',
        citation: 'Doe, J. et al. (2022). Predictive Analytics for Patient Outcomes. JAMA, 308(12), 234-256.',
      },
    ],
    metadata: {
      submissionDate: new Date('2024-01-15'),
      journalId: 'journal_healthcare_ml',
      manuscriptType: 'Original Research',
      keywords: ['machine learning', 'healthcare', 'predictive analytics', 'patient outcomes'],
    },
  };

  return { ...defaultManuscript, ...overrides };
}

/**
 * Create mock journal configuration
 */
export function createMockJournal(overrides?: Partial<MockJournal>): MockJournal {
  const defaultJournal: MockJournal = {
    id: `journal_${Date.now()}`,
    name: 'International Journal of Healthcare Technology',
    abbreviation: 'IJHT',
    reviewCriteria: [
      {
        id: 'methodology_quality',
        label: 'Methodology Quality',
        type: 'rating',
        required: true,
        description: 'Evaluate the rigor and appropriateness of the research methodology',
        scale: { min: 1, max: 5 },
      },
      {
        id: 'research_novelty',
        label: 'Research Novelty and Significance',
        type: 'rating',
        required: true,
        description: 'Assess the originality and potential impact of the research',
        scale: { min: 1, max: 5 },
      },
      {
        id: 'data_quality',
        label: 'Data Quality and Analysis',
        type: 'rating',
        required: true,
        description: 'Evaluate the quality of data and statistical analysis',
        scale: { min: 1, max: 5 },
      },
      {
        id: 'presentation_quality',
        label: 'Presentation and Clarity',
        type: 'rating',
        required: true,
        description: 'Assess the clarity of writing and presentation of results',
        scale: { min: 1, max: 5 },
      },
      {
        id: 'ethical_considerations',
        label: 'Ethical Approval Obtained',
        type: 'boolean',
        required: true,
        description: 'Confirm that appropriate ethical approvals were obtained',
      },
      {
        id: 'detailed_comments',
        label: 'Detailed Comments for Authors',
        type: 'textarea',
        required: true,
        description: 'Provide specific feedback to help authors improve their manuscript',
        validation: {
          minLength: 100,
          maxLength: 2000,
        },
      },
      {
        id: 'recommendation',
        label: 'Overall Recommendation',
        type: 'recommendation',
        required: true,
        description: 'Your overall recommendation for this manuscript',
        options: ['accept', 'minor_revisions', 'major_revisions', 'reject'],
      },
      {
        id: 'confidential_comments',
        label: 'Confidential Comments to Editor',
        type: 'textarea',
        required: false,
        description: 'Comments visible only to the editor (optional)',
        validation: {
          maxLength: 1000,
        },
      },
    ],
    reviewGuidelines: `
      Please evaluate this manuscript based on the following criteria:
      1. Scientific rigor and methodology
      2. Novelty and significance of findings
      3. Quality of data analysis and interpretation
      4. Clarity of presentation and writing
      5. Ethical considerations and compliance
      
      Provide constructive feedback that will help authors improve their work.
      Be specific in your comments and suggestions.
    `,
    deadlinePolicy: {
      standardPeriod: 21,
      maxExtensions: 2,
      reminderSchedule: [14, 7, 3, 1],
    },
  };

  return { ...defaultJournal, ...overrides };
}

/**
 * Create mock review session
 */
export function createMockReviewSession(overrides?: Partial<MockReviewSession>): MockReviewSession {
  const anonymousId = `ANR_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const reviewId = `review_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const defaultSession: MockReviewSession = {
    id: new ObjectId().toString(),
    anonymousId,
    reviewId,
    manuscriptId: `manuscript_${Date.now()}`,
    journalId: `journal_${Date.now()}`,
    email: 'reviewer@example.com',
    sessionToken: `token_${Math.random().toString(36).substring(2, 20)}`,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
    reviewStatus: 'in_progress',
    progress: {
      manuscriptRead: false,
      annotationsCreated: 0,
      formCompleted: false,
      submitted: false,
    },
  };

  return { ...defaultSession, ...overrides };
}

/**
 * Create mock annotation data
 */
export function createMockAnnotation(overrides?: any) {
  return {
    id: `ann_${Date.now()}`,
    sectionId: 'intro',
    selectedText: 'sample text',
    comment: 'This is a test annotation',
    timestamp: new Date(),
    anonymousId: 'ANR_test_123',
    type: 'note',
    ...overrides,
  };
}

/**
 * Create mock form data
 */
export function createMockFormData(journal: MockJournal, complete = false) {
  const formData: Record<string, any> = {};

  journal.reviewCriteria.forEach(criterion => {
    switch (criterion.type) {
      case 'rating':
        formData[criterion.id] = complete ? 4 : null;
        break;
      case 'textarea':
        formData[criterion.id] = complete 
          ? 'This is a comprehensive review comment that meets the minimum length requirements and provides detailed feedback.'
          : '';
        break;
      case 'select':
      case 'recommendation':
        formData[criterion.id] = complete 
          ? (criterion.options?.[0] || 'accept')
          : null;
        break;
      case 'boolean':
        formData[criterion.id] = complete ? true : null;
        break;
      default:
        formData[criterion.id] = complete ? 'test value' : '';
    }
  });

  return formData;
}

/**
 * Create mock deadline data
 */
export function createMockDeadline(overrides?: any) {
  const now = new Date();
  const dueDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days from now

  return {
    id: new ObjectId().toString(),
    anonymousId: 'ANR_test_123',
    reviewId: 'review_456',
    manuscriptId: 'manuscript_789',
    journalId: 'journal_101',
    assignedDate: now,
    dueDate,
    originalDueDate: new Date(dueDate),
    extensionsGranted: 0,
    maxExtensions: 2,
    remindersSent: [],
    status: 'active',
    anonymityProtected: true,
    ...overrides,
  };
}

/**
 * Create mock quality metrics
 */
export function createMockQualityMetrics(overrides?: any) {
  return {
    comprehensivenessScore: 85,
    timelinessScore: 90,
    clarityScore: 88,
    constructivenessScore: 92,
    editorRating: 4.2,
    ...overrides,
  };
}

/**
 * Mock database operations
 */
export const mockDbOperations = {
  findOne: vi.fn(),
  findMany: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
  deleteOne: vi.fn(),
  aggregate: vi.fn(),
};

/**
 * Setup test environment
 */
export function setupTestEnvironment() {
  // Mock window resize for responsive testing
  const mockResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  vi.stubGlobal('ResizeObserver', mockResizeObserver);

  // Mock IntersectionObserver for scroll-based features
  const mockIntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  
  vi.stubGlobal('localStorage', localStorageMock);

  // Mock fetch for API calls
  vi.stubGlobal('fetch', vi.fn());

  return {
    mockResizeObserver,
    mockIntersectionObserver,
    localStorageMock,
  };
}

/**
 * Cleanup test environment
 */
export function cleanupTestEnvironment() {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
}