# Data Models

Based on the Synfind brief requirements, here are the core data models for the academic publishing platform:

## Publisher

**Purpose:** Root tenant entity managing multiple journals with organizational hierarchy and billing

**Key Attributes:**
- id: string - Unique publisher identifier
- name: string - Publisher organization name  
- domain: string - Custom domain for white-label access
- subscriptionTier: enum - Current subscription level (starter, professional, enterprise)
- billingInfo: object - Stripe customer and subscription details
- settings: object - Publisher-wide configuration and branding

### TypeScript Interface

```typescript
interface Publisher {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  creditBalance: number;
  billingInfo: {
    stripeCustomerId: string;
    subscriptionId?: string;
    billingEmail: string;
  };
  settings: {
    branding: {
      logoUrl?: string;
      primaryColor: string;
      secondaryColor: string;
    };
    defaultLanguage: string;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Relationships
- One-to-many with Journal entities
- One-to-many with User entities (publisher staff)
- One-to-many with CreditTransaction entities

## Journal

**Purpose:** Individual journal configuration within a publisher, managing editorial workflow and submission settings

**Key Attributes:**
- id: string - Unique journal identifier
- publisherId: string - Parent publisher reference
- title: string - Journal name and ISSN details
- submissionSettings: object - Submission workflow configuration
- aiEvaluationSettings: object - AI screening preferences and thresholds

### TypeScript Interface

```typescript
interface Journal {
  id: string;
  publisherId: string;
  title: string;
  issn?: string;
  slug: string;
  description: string;
  scope: string;
  submissionSettings: {
    acceptedFileTypes: string[];
    maxFileSize: number;
    requiresAbstract: boolean;
    requiresKeywords: boolean;
    minKeywords: number;
    maxKeywords: number;
  };
  aiEvaluationSettings: {
    enableInitialScreening: boolean;
    plagiarismThreshold: number;
    aiContentThreshold: number;
    noveltyThreshold: number;
    autoRejectBelow: number;
    autoAcceptAbove: number;
  };
  editorialBoard: {
    editorInChief: string; // User ID
    associateEditors: string[];
    reviewingEditors: string[];
  };
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

### Relationships
- Many-to-one with Publisher entity
- One-to-many with Submission entities
- Many-to-many with User entities (editorial roles)

## Submission

**Purpose:** Core manuscript entity tracking complete submission lifecycle from author upload through publication decision

**Key Attributes:**
- id: string - Unique submission identifier
- journalId: string - Target journal reference
- authorId: string - Submitting author reference
- manuscriptData: object - Title, abstract, keywords, and metadata
- files: array - Document files and supplementary materials
- status: enum - Current workflow status
- aiEvaluationResults: object - AI screening scores and recommendations

### TypeScript Interface

```typescript
interface Submission {
  id: string;
  journalId: string;
  authorId: string;
  submissionNumber: string; // Human-readable identifier
  manuscriptData: {
    title: string;
    abstract: string;
    keywords: string[];
    manuscriptType: 'research-article' | 'review' | 'case-study' | 'editorial';
    wordCount: number;
    language: string;
  };
  authors: Array<{
    userId?: string;
    name: string;
    email: string;
    affiliation: string;
    orcid?: string;
    isCorresponding: boolean;
    contributionRoles: string[];
  }>;
  files: Array<{
    id: string;
    type: 'manuscript' | 'figure' | 'table' | 'supplementary';
    filename: string;
    size: number;
    r2Key: string; // Cloudflare R2 object key
    uploadedAt: Date;
  }>;
  status: 'submitted' | 'under-initial-review' | 'under-peer-review' | 
          'revision-requested' | 'accepted' | 'rejected' | 'withdrawn';
  aiEvaluationResults?: {
    overallScore: number;
    noveltyScore: number;
    methodologyScore: number;
    integrityScore: number;
    plagiarismScore: number;
    aiContentScore: number;
    recommendation: 'accept' | 'review' | 'reject';
    completedAt: Date;
    reportUrl?: string;
  };
  reviewRounds: ReviewRound[];
  creditTransactions: string[]; // IDs of credit transactions for services
  submittedAt: Date;
  updatedAt: Date;
}
```

### Relationships
- Many-to-one with Journal entity
- Many-to-one with User entity (author)
- One-to-many with ReviewRound entities
- One-to-many with CreditTransaction entities

## User

**Purpose:** Unified user entity supporting multiple roles (authors, reviewers, editors, publishers) with role-based permissions

**Key Attributes:**
- id: string - Unique user identifier
- profile: object - Personal and professional information
- roles: array - Role assignments across different publishers/journals
- preferences: object - User interface and notification preferences
- expertise: array - Research areas and keywords for reviewer matching

### TypeScript Interface

```typescript
interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName?: string;
    title?: string;
    affiliation?: string;
    orcid?: string;
    profileImageUrl?: string;
    bio?: string;
  };
  roles: Array<{
    publisherId?: string;
    journalId?: string;
    role: 'author' | 'reviewer' | 'editor' | 'publisher-admin' | 'super-admin';
    permissions: string[];
    assignedAt: Date;
  }>;
  expertise: Array<{
    subject: string;
    keywords: string[];
    confidenceLevel: 1 | 2 | 3 | 4 | 5;
  }>;
  preferences: {
    language: string;
    timezone: string;
    emailNotifications: {
      submissionUpdates: boolean;
      reviewInvitations: boolean;
      editorialNotifications: boolean;
      systemAnnouncements: boolean;
    };
    reviewPreferences: {
      maxActiveReviews: number;
      preferredReviewTime: number; // days
      specializations: string[];
    };
  };
  accountStatus: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Relationships
- Many-to-many with Publisher entities (via roles)
- Many-to-many with Journal entities (via roles)
- One-to-many with Submission entities (as author)
- One-to-many with Review entities (as reviewer)

## CreditTransaction

**Purpose:** Track credit purchases, consumption, and revenue sharing for the service marketplace economy

**Key Attributes:**
- id: string - Unique transaction identifier
- publisherId: string - Publisher account reference
- type: enum - Transaction type (purchase, consumption, refund)
- amount: number - Credit amount (positive for purchases, negative for consumption)
- serviceType: string - Type of service consumed (if applicable)
- metadata: object - Transaction-specific details and references

### TypeScript Interface

```typescript
interface CreditTransaction {
  id: string;
  publisherId: string;
  type: 'purchase' | 'consumption' | 'refund' | 'bonus' | 'transfer';
  amount: number; // Credits (can be negative for consumption)
  costInUSD: number; // Monetary value
  serviceType?: 'similarity-check' | 'ai-detection' | 'translation' | 
               'infographic' | 'express-review' | 'citation-prediction';
  relatedEntityId?: string; // Submission ID, Service Request ID, etc.
  metadata: {
    stripePaymentIntentId?: string;
    submissionId?: string;
    serviceProviderId?: string;
    revenueSharing?: {
      platformShare: number;
      providerShare: number;
      reviewerShare?: number;
    };
    packageInfo?: {
      packageType: string;
      bonusCredits: number;
      discountPercent: number;
    };
  };
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processedAt?: Date;
  createdAt: Date;
}
```

### Relationships
- Many-to-one with Publisher entity
- Many-to-one with Submission entity (for service consumption)
