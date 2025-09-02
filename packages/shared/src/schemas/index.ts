import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['author', 'reviewer', 'editor', 'admin']),
  publisherId: z.string().optional(),
  orcidId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Address and Contact schemas
export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string().optional(),
  zipCode: z.string(),
  country: z.string(),
});

export const contactInfoSchema = z.object({
  primaryEmail: z.string().email(),
  phoneNumber: z.string().optional(),
  website: z.string().url().optional(),
});

export const institutionalDetailsSchema = z.object({
  type: z.enum(['university', 'research_institute', 'commercial', 'nonprofit']),
  country: z.string(),
  address: addressSchema,
  contactInfo: contactInfoSchema,
  verification: z.object({
    status: z.enum(['pending', 'verified', 'rejected']),
    verifiedAt: z.date().optional(),
    documents: z.array(z.string().url()),
  }),
});

export const billingInfoSchema = z.object({
  planType: z.enum(['basic', 'professional', 'enterprise']),
  maxJournals: z.number().int().positive(),
  pricePerMonth: z.number().positive(),
  billingCycle: z.enum(['monthly', 'annual']),
  paymentMethod: z.object({
    type: z.enum(['credit_card', 'bank_transfer']),
    lastFour: z.string().optional(),
    expiryDate: z.string().optional(),
  }).optional(),
  nextBillingDate: z.date(),
  isActive: z.boolean(),
});

// Updated Publisher validation schemas
export const publisherSettingsSchema = z.object({
  branding: z.object({
    logo: z.string().optional(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    customCSS: z.string().optional(),
  }),
  features: z.object({
    peerReview: z.boolean(),
    openAccess: z.boolean(),
    preprints: z.boolean(),
    automaticPublishing: z.boolean(),
    crossrefIntegration: z.boolean(),
  }),
  notifications: z.object({
    emailUpdates: z.boolean(),
    slackWebhook: z.string().url().optional(),
    dashboardAlerts: z.boolean(),
  }),
});

export const publisherSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  institutionalDetails: institutionalDetailsSchema,
  billingInfo: billingInfoSchema,
  settings: publisherSettingsSchema,
  adminUsers: z.array(z.string()),
  journals: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPublisherSchema = publisherSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  journals: true,
});

// Journal validation schemas
export const journalBrandingSchema = z.object({
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  customCSS: z.string().optional(),
  theme: z.enum(['default', 'modern', 'academic', 'minimal']),
});

export const journalConfigurationSchema = z.object({
  submissionSettings: z.object({
    acceptManuscripts: z.boolean(),
    allowedFileTypes: z.array(z.string()),
    maxFileSize: z.number().positive(),
    requireCoverLetter: z.boolean(),
    requireAbstract: z.boolean(),
    maxAbstractWords: z.number().int().positive(),
    requireKeywords: z.boolean(),
    maxKeywords: z.number().int().positive(),
  }),
  reviewSettings: z.object({
    reviewType: z.enum(['single_blind', 'double_blind', 'open']),
    reviewerCount: z.number().int().positive(),
    reviewTimeLimit: z.number().int().positive(),
    autoAssignReviewers: z.boolean(),
    requireReviewerComments: z.boolean(),
  }),
  publishingSettings: z.object({
    openAccess: z.boolean(),
    embargoPeriod: z.number().int().min(0),
    licensingType: z.enum(['CC_BY', 'CC_BY_SA', 'CC_BY_NC', 'CC_BY_ND', 'ALL_RIGHTS_RESERVED']),
    digitalObjectIdentifier: z.boolean(),
  }),
  workflowSettings: z.object({
    autoAcknowledgeSubmission: z.boolean(),
    plagiarismCheck: z.boolean(),
    aiDetection: z.boolean(),
    statisticalReview: z.boolean(),
  }),
});

export const editorialBoardMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['editor_in_chief', 'associate_editor', 'section_editor', 'reviewer', 'editorial_assistant']),
  specialization: z.array(z.string()).optional(),
  joinedAt: z.date(),
  isActive: z.boolean(),
});

export const journalStatisticsSchema = z.object({
  totalSubmissions: z.number().int().min(0),
  acceptedSubmissions: z.number().int().min(0),
  rejectedSubmissions: z.number().int().min(0),
  averageReviewTime: z.number().min(0),
  currentActiveSubmissions: z.number().int().min(0),
  publishedArticles: z.number().int().min(0),
  totalViews: z.number().int().min(0),
  totalDownloads: z.number().int().min(0),
  lastUpdated: z.date(),
});

export const journalSchema = z.object({
  id: z.string(),
  publisherId: z.string(),
  name: z.string(),
  shortName: z.string(),
  description: z.string(),
  subdomain: z.string().optional(),
  customDomain: z.string().optional(),
  branding: journalBrandingSchema,
  configuration: journalConfigurationSchema,
  editorialBoard: z.array(editorialBoardMemberSchema),
  statistics: journalStatisticsSchema,
  status: z.enum(['draft', 'active', 'suspended', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createJournalSchema = journalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  statistics: true,
  editorialBoard: true,
});