# Database Schema

```sql
-- MongoDB collections schema (represented as SQL-like DDL for clarity)

-- Publishers (tenant isolation root)
CREATE COLLECTION publishers {
  _id: ObjectId,
  name: String,
  slug: String UNIQUE,
  domain: String,
  subscriptionTier: ENUM('starter', 'professional', 'enterprise'),
  creditBalance: Number DEFAULT 0,
  billingInfo: {
    stripeCustomerId: String,
    subscriptionId: String,
    billingEmail: String
  },
  settings: {
    branding: {
      logoUrl: String,
      primaryColor: String DEFAULT '#6366f1',
      secondaryColor: String DEFAULT '#8b5cf6'
    },
    defaultLanguage: String DEFAULT 'en',
    timezone: String DEFAULT 'UTC'
  },
  createdAt: Date,
  updatedAt: Date
}

-- Journals (with publisher tenant reference)
CREATE COLLECTION journals {
  _id: ObjectId,
  publisherId: ObjectId REF publishers,
  title: String,
  slug: String,
  issn: String,
  aiEvaluationSettings: {
    enableInitialScreening: Boolean DEFAULT true,
    plagiarismThreshold: Number DEFAULT 15,
    aiContentThreshold: Number DEFAULT 10,
    autoRejectBelow: Number DEFAULT 30,
    autoAcceptAbove: Number DEFAULT 85
  },
  status: ENUM('active', 'inactive', 'archived') DEFAULT 'active'
}

-- Users (multi-tenant role assignments)
CREATE COLLECTION users {
  _id: ObjectId,
  email: String UNIQUE,
  profile: {
    firstName: String,
    lastName: String,
    orcid: String,
    affiliation: String
  },
  roles: [{
    publisherId: ObjectId REF publishers,
    journalId: ObjectId REF journals,
    role: ENUM('author', 'reviewer', 'editor', 'publisher-admin'),
    permissions: [String],
    assignedAt: Date
  }]
}

-- Submissions (core academic content)
CREATE COLLECTION submissions {
  _id: ObjectId,
  journalId: ObjectId REF journals,
  authorId: ObjectId REF users,
  submissionNumber: String,
  manuscriptData: {
    title: String,
    abstract: String,
    keywords: [String],
    wordCount: Number
  },
  files: [{
    r2Key: String,
    filename: String,
    size: Number,
    contentType: String
  }],
  status: ENUM('submitted', 'under-review', 'accepted', 'rejected'),
  aiEvaluationResults: {
    overallScore: Number,
    noveltyScore: Number,
    integrityScore: Number,
    recommendation: ENUM('accept', 'review', 'reject')
  }
}

-- Indexes for performance
CREATE INDEX journals_publisher_idx ON journals (publisherId);
CREATE INDEX submissions_journal_status_idx ON submissions (journalId, status);
CREATE INDEX users_email_idx ON users (email);
CREATE TEXT INDEX submissions_content_idx ON submissions (manuscriptData.title, manuscriptData.abstract);
```
