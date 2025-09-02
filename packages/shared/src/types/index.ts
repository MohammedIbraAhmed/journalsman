// Core domain types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'author' | 'reviewer' | 'editor' | 'admin';
  publisherId?: string; // For multi-tenant support
  orcidId?: string;
  image?: string; // Profile image from OAuth provider
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// NextAuth extended types
export interface AuthUser extends User {
  accounts?: Account[];
  sessions?: Session[];
}

// Extended session user type for NextAuth
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  orcidId?: string;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface Publisher {
  id: string;
  name: string;
  domain: string;
  institutionalDetails: InstitutionalDetails;
  billingInfo: BillingInfo;
  settings: PublisherSettings;
  adminUsers: string[]; // User IDs with publisher admin access
  journals: string[]; // Journal IDs owned by this publisher
  createdAt: Date;
  updatedAt: Date;
}

export interface InstitutionalDetails {
  type: 'university' | 'research_institute' | 'commercial' | 'nonprofit';
  country: string;
  address: Address;
  contactInfo: ContactInfo;
  verification: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: Date;
    documents: string[]; // URLs to verification documents
  };
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
}

export interface ContactInfo {
  primaryEmail: string;
  phoneNumber?: string;
  website?: string;
}

export interface BillingInfo {
  planType: 'basic' | 'professional' | 'enterprise';
  maxJournals: number;
  pricePerMonth: number;
  billingCycle: 'monthly' | 'annual';
  paymentMethod?: {
    type: 'credit_card' | 'bank_transfer';
    lastFour?: string;
    expiryDate?: string;
  };
  nextBillingDate: Date;
  isActive: boolean;
}

export interface PublisherSettings {
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    customCSS?: string;
  };
  features: {
    peerReview: boolean;
    openAccess: boolean;
    preprints: boolean;
    automaticPublishing: boolean;
    crossrefIntegration: boolean;
  };
  notifications: {
    emailUpdates: boolean;
    slackWebhook?: string;
    dashboardAlerts: boolean;
  };
}

// New Journal model
export interface Journal {
  id: string;
  publisherId: string;
  name: string;
  shortName: string; // For URLs and identifiers
  description: string;
  subdomain?: string; // Custom subdomain like journal.synfind.com
  customDomain?: string; // Full custom domain like journal.university.edu
  branding: JournalBranding;
  configuration: JournalConfiguration;
  editorialBoard: EditorialBoardMember[];
  statistics: JournalStatistics;
  status: 'draft' | 'active' | 'suspended' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalBranding {
  logo?: string;
  coverImage?: string;
  primaryColor?: string; // Inherits from publisher if not set
  secondaryColor?: string;
  customCSS?: string;
  theme: 'default' | 'modern' | 'academic' | 'minimal';
}

export interface JournalConfiguration {
  submissionSettings: {
    acceptManuscripts: boolean;
    allowedFileTypes: string[];
    maxFileSize: number; // in MB
    requireCoverLetter: boolean;
    requireAbstract: boolean;
    maxAbstractWords: number;
    requireKeywords: boolean;
    maxKeywords: number;
  };
  reviewSettings: {
    reviewType: 'single_blind' | 'double_blind' | 'open';
    reviewerCount: number;
    reviewTimeLimit: number; // in days
    autoAssignReviewers: boolean;
    requireReviewerComments: boolean;
  };
  publishingSettings: {
    openAccess: boolean;
    embargoPeriod: number; // in months, 0 for immediate
    licensingType: 'CC_BY' | 'CC_BY_SA' | 'CC_BY_NC' | 'CC_BY_ND' | 'ALL_RIGHTS_RESERVED';
    digitalObjectIdentifier: boolean; // DOI assignment
  };
  workflowSettings: {
    autoAcknowledgeSubmission: boolean;
    plagiarismCheck: boolean;
    aiDetection: boolean;
    statisticalReview: boolean;
  };
}

export interface EditorialBoardMember {
  userId: string;
  role: 'editor_in_chief' | 'associate_editor' | 'section_editor' | 'reviewer' | 'editorial_assistant';
  specialization?: string[];
  joinedAt: Date;
  isActive: boolean;
}

export interface JournalStatistics {
  totalSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
  averageReviewTime: number; // in days
  currentActiveSubmissions: number;
  publishedArticles: number;
  totalViews: number;
  totalDownloads: number;
  lastUpdated: Date;
}

// Analytics and Metrics types
export interface AnalyticsMetrics {
  submissionVolume: SubmissionVolumeMetrics;
  processingTimes: ProcessingTimeMetrics;
  editorialEfficiency: EditorialEfficiencyMetrics;
  publisherOverview: PublisherOverviewMetrics;
  realTimeEvents: AnalyticsEvent[];
  lastUpdated: Date;
}

export interface SubmissionVolumeMetrics {
  daily: TimeSeriesData[];
  weekly: TimeSeriesData[];
  monthly: TimeSeriesData[];
  byJournal: JournalVolumeData[];
  totalSubmissions: number;
  growthRate: number;
  peakSubmissionDays: string[];
}

export interface ProcessingTimeMetrics {
  averageSubmissionToDecision: number;
  averageReviewTime: number;
  bottleneckAnalysis: BottleneckData[];
  historicalComparison: TimeComparisonData[];
  targetMetrics: {
    submissionToDecisionTarget: number; // 90 days
    reviewTimeTarget: number; // 30 days
  };
}

export interface EditorialEfficiencyMetrics {
  reviewerResponseRates: ReviewerEfficiencyData[];
  editorialTeamWorkload: EditorialWorkloadData[];
  decisionTimelines: DecisionTimelineData[];
  performanceTrends: PerformanceTrendData[];
}

export interface PublisherOverviewMetrics {
  totalJournals: number;
  activeSubmissions: number;
  monthlyRevenue: number;
  operationalEfficiency: number;
  complianceScore: number;
  industryBenchmarks: BenchmarkData[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface JournalVolumeData {
  journalId: string;
  journalName: string;
  submissionCount: number;
  acceptanceRate: number;
  averageProcessingTime: number;
}

export interface BottleneckData {
  stage: 'submission' | 'review' | 'editing' | 'publishing';
  averageTime: number;
  maxTime: number;
  affectedSubmissions: number;
  recommendations: string[];
}

export interface TimeComparisonData {
  period: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

export interface ReviewerEfficiencyData {
  reviewerId: string;
  reviewerName: string;
  responseRate: number;
  averageReviewTime: number;
  totalReviews: number;
  qualityScore: number;
}

export interface EditorialWorkloadData {
  editorId: string;
  editorName: string;
  activeSubmissions: number;
  avgDecisionTime: number;
  workloadCapacity: number;
  efficiencyScore: number;
}

export interface DecisionTimelineData {
  submissionId: string;
  submissionDate: Date;
  decisionDate?: Date;
  currentStage: string;
  daysInProcess: number;
  targetDays: number;
  isOverdue: boolean;
}

export interface PerformanceTrendData {
  metric: string;
  trend: 'improving' | 'declining' | 'stable';
  value: number;
  previousValue: number;
  benchmarkValue: number;
}

export interface BenchmarkData {
  metric: string;
  currentValue: number;
  industryAverage: number;
  topQuartile: number;
  targetValue: number;
}

export interface AnalyticsEvent {
  id: string;
  type: 'submission' | 'review' | 'decision' | 'publication';
  timestamp: Date;
  journalId: string;
  submissionId?: string;
  data: Record<string, any>;
}

export interface AnalyticsDashboardConfig {
  publisherId: string;
  refreshInterval: number; // milliseconds
  enableRealTime: boolean;
  displayMetrics: string[];
  chartTypes: Record<string, 'line' | 'bar' | 'pie' | 'area'>;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Branding and Theme types
export interface JournalBrandingConfig {
  id: string;
  journalId: string;
  logo?: BrandingAsset;
  colorScheme: BrandingColorScheme;
  typography: BrandingTypography;
  customCSS?: string;
  domain?: CustomDomainConfig;
  isActive: boolean;
  accessibility: AccessibilityValidation;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingAsset {
  id: string;
  type: 'logo' | 'favicon' | 'banner' | 'watermark';
  url: string;
  filename: string;
  mimeType: string;
  size: number; // in bytes
  dimensions: {
    width: number;
    height: number;
  };
  variants?: BrandingAssetVariant[];
  uploadedAt: Date;
}

export interface BrandingAssetVariant {
  size: 'small' | 'medium' | 'large' | 'original';
  url: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface BrandingColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  borders: string;
  hover: string;
  focus: string;
  success: string;
  warning: string;
  error: string;
  contrastValidation: ContrastValidation;
}

export interface ContrastValidation {
  isValid: boolean;
  scores: {
    primaryOnBackground: number;
    secondaryOnBackground: number;
    textOnPrimary: number;
    textOnSecondary: number;
  };
  wcagLevel: 'AA' | 'AAA' | 'FAIL';
  validatedAt: Date;
}

export interface BrandingTypography {
  headingFont: TypographyFont;
  bodyFont: TypographyFont;
  monoFont: TypographyFont;
  scale: TypographyScale;
  customFonts?: CustomFont[];
}

export interface TypographyFont {
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  source: 'system' | 'google' | 'custom';
  fallbacks: string[];
}

export interface TypographyScale {
  baseSize: number; // in px
  scaleRatio: number;
  lineHeight: {
    tight: number;
    normal: number;
    loose: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface CustomFont {
  name: string;
  files: {
    weight: number;
    style: 'normal' | 'italic';
    url: string;
    format: 'woff2' | 'woff' | 'ttf' | 'otf';
  }[];
  license: string;
  attribution?: string;
}

export interface CustomDomainConfig {
  id: string;
  journalId: string;
  subdomain?: string; // e.g., "journal" for "journal.synfind.com"
  customDomain?: string; // e.g., "journal.university.edu"
  sslStatus: 'pending' | 'active' | 'failed' | 'expired';
  sslProvider: 'lets_encrypt' | 'custom';
  dnsValidation: DnsValidationStatus;
  setupStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  setupAttempts: number;
  lastSetupAttempt?: Date;
  setupInstructions?: DnsSetupInstructions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DnsValidationStatus {
  isValid: boolean;
  requiredRecords: DnsRecord[];
  currentRecords: DnsRecord[];
  validatedAt: Date;
  errors: string[];
}

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
}

export interface DnsSetupInstructions {
  provider: string;
  steps: DnsSetupStep[];
  estimatedTime: number; // in minutes
  supportUrl?: string;
}

export interface DnsSetupStep {
  stepNumber: number;
  title: string;
  description: string;
  action: 'add_record' | 'modify_record' | 'verify_record' | 'wait';
  record?: DnsRecord;
  screenshot?: string;
  estimatedTime: number; // in minutes
}

export interface AccessibilityValidation {
  isCompliant: boolean;
  wcagLevel: 'AA' | 'AAA' | 'FAIL';
  violations: AccessibilityViolation[];
  lastValidated: Date;
  autoFixSuggestions: AccessibilityFix[];
}

export interface AccessibilityViolation {
  id: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  element: string;
  description: string;
  fix: string;
  helpUrl: string;
}

export interface AccessibilityFix {
  violationId: string;
  fixType: 'automatic' | 'suggested' | 'manual';
  description: string;
  cssChanges?: string;
  colorChanges?: Partial<BrandingColorScheme>;
}

export interface EditorialCustomization {
  id: string;
  journalId: string;
  submissionGuidelines: RichTextContent;
  reviewCriteria: ReviewCriteriaTemplate[];
  communicationTemplates: CommunicationTemplate[];
  authorPortalConfig: AuthorPortalConfig;
  institutionalCompliance: InstitutionalComplianceConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RichTextContent {
  html: string;
  markdown: string;
  plainText: string;
  wordCount: number;
  lastEditedBy: string;
  lastEditedAt: Date;
}

export interface ReviewCriteriaTemplate {
  id: string;
  name: string;
  description: string;
  criteria: ReviewCriterion[];
  scoringSystem: 'binary' | 'scale' | 'weighted';
  maxScore?: number;
  passingScore?: number;
  isDefault: boolean;
}

export interface ReviewCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  type: 'yes_no' | 'scale_1_5' | 'scale_1_10' | 'text' | 'checklist';
  options?: string[];
  isRequired: boolean;
}

export interface CommunicationTemplate {
  id: string;
  type: 'submission_confirmation' | 'review_assignment' | 'decision_notification' | 'revision_request' | 'acceptance_notification' | 'rejection_notification';
  subject: string;
  content: RichTextContent;
  variables: TemplateVariable[];
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'date' | 'number' | 'url';
  example: string;
}

export interface AuthorPortalConfig {
  welcomeMessage: RichTextContent;
  instructionsLink?: string;
  supportContact: ContactInfo;
  showProgress: boolean;
  showReviewTimeline: boolean;
  allowWithdrawals: boolean;
  customFields: CustomFieldConfig[];
}

export interface CustomFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'date';
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
  displayOrder: number;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  fileTypes?: string[];
  maxFileSize?: number; // in bytes
}

export interface InstitutionalComplianceConfig {
  dataRetentionPolicy: string;
  privacyNotice: RichTextContent;
  ethicsStatement: RichTextContent;
  fundingDisclosure: RichTextContent;
  conflictOfInterestPolicy: RichTextContent;
  customPolicies: CustomPolicyConfig[];
}

export interface CustomPolicyConfig {
  id: string;
  name: string;
  content: RichTextContent;
  isRequired: boolean;
  acknowledgmentRequired: boolean;
  displayOrder: number;
}

export interface ContactInfo {
  primaryEmail: string;
  phoneNumber?: string;
  website?: string;
}

export interface BrandingPreview {
  journalId: string;
  brandingConfig: JournalBrandingConfig;
  previewUrl: string;
  screenshotUrls: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
  generatedAt: Date;
  validUntil: Date;
}

export interface BrandingAnalytics {
  journalId: string;
  completionRate: number;
  setupTime: number; // in minutes
  customizationScores: {
    logo: number;
    colors: number;
    typography: number;
    domain: number;
    editorial: number;
  };
  accessibilityScore: number;
  performanceImpact: number;
  userSatisfactionRating: number;
  lastUpdated: Date;
}

// Manuscript Submission System Types
export interface ManuscriptSubmission {
  id: string;
  trackingNumber: string;
  journalId: string;
  authorId: string;
  title: string;
  abstract: string;
  keywords: string[];
  authors: SubmissionAuthor[];
  manuscriptFile: SubmissionFile;
  supplementaryFiles: SupplementaryFile[];
  status: SubmissionStatus;
  submissionDate: Date;
  lastModified: Date;
  reviewTimeline: ReviewTimeline;
  metadata: SubmissionMetadata;
  workflowStep: SubmissionStep;
  isDraft: boolean;
}

export interface SubmissionAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  affiliation: InstitutionalAffiliation;
  orcid?: string;
  isCorrespondingAuthor: boolean;
  isSubmittingAuthor: boolean;
  authorOrder: number;
  contributionRoles: ContributionRole[];
}

export interface InstitutionalAffiliation {
  id: string;
  name: string;
  department?: string;
  country: string;
  isVerified: boolean;
  verificationDate?: Date;
  rorId?: string; // Research Organization Registry ID
}

export interface ContributionRole {
  type: 'conceptualization' | 'methodology' | 'investigation' | 'resources' | 
        'data-curation' | 'writing-original' | 'writing-review' | 'visualization' | 
        'supervision' | 'project-administration' | 'funding-acquisition';
  description?: string;
}

export interface SubmissionFile {
  id: string;
  filename: string;
  originalName: string;
  fileType: ManuscriptFileType;
  size: number;
  mimeType: string;
  checksum: string;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  chunkInfo: ChunkUploadInfo;
  storageUrl: string;
  previewUrl?: string;
  metadata: FileMetadata;
  validation: FileValidationResult;
  versions: FileVersion[];
}

export interface SupplementaryFile extends Omit<SubmissionFile, 'fileType'> {
  fileType: SupplementaryFileType;
  category: 'dataset' | 'image' | 'video' | 'code' | 'document' | 'other';
  description: string;
  isRequired: boolean;
}

export interface ChunkUploadInfo {
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  resumeToken?: string;
  lastChunkTime: Date;
  retryCount: number;
  maxRetries: number;
}

export interface FileMetadata {
  wordCount?: number;
  pageCount?: number;
  language: string;
  encoding?: string;
  createdDate?: Date;
  author?: string;
  title?: string;
  subject?: string;
  hasEmbeddedFonts?: boolean;
  hasImages?: boolean;
  hasTables?: boolean;
  hasFormulas?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  validatedAt: Date;
  fileFormat: string;
  detectedMimeType: string;
  violations: ValidationViolation[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  virusScanResult: VirusScanResult;
}

export interface ValidationViolation {
  id: string;
  type: 'format' | 'content' | 'security' | 'size' | 'structure';
  severity: 'error' | 'warning';
  message: string;
  location?: string;
  correctionSuggestion: string;
  helpUrl?: string;
}

export interface ValidationWarning {
  type: 'formatting' | 'references' | 'accessibility' | 'quality';
  message: string;
  suggestion: string;
}

export interface ValidationSuggestion {
  type: 'conversion' | 'optimization' | 'enhancement';
  message: string;
  actionLabel: string;
  automated: boolean;
}

export interface VirusScanResult {
  scanned: boolean;
  scanDate?: Date;
  isClean: boolean;
  threats?: string[];
  scanEngine: string;
  scanVersion: string;
}

export interface FileVersion {
  id: string;
  version: number;
  uploadDate: Date;
  size: number;
  checksum: string;
  changes: string[];
  authorId: string;
  isActive: boolean;
}

export interface ReviewTimeline {
  submissionDate: Date;
  acknowledgedDate?: Date;
  screeningCompletedDate?: Date;
  reviewersAssignedDate?: Date;
  reviewsCompletedDate?: Date;
  decisionDate?: Date;
  estimatedDecisionDate: Date;
  actualProcessingDays: number;
  estimatedProcessingDays: number;
}

export interface SubmissionMetadata {
  submissionType: 'original-research' | 'review' | 'commentary' | 'letter' | 'other';
  researchArea: string[];
  fundingInformation: FundingInfo[];
  conflictOfInterest: ConflictDeclaration;
  ethicsApproval?: EthicsApproval;
  dataAvailability: DataAvailabilityStatement;
  previousSubmissions: PreviousSubmission[];
  specialRequirements: string[];
}

export interface FundingInfo {
  funder: string;
  grantNumber?: string;
  recipient: string;
  amount?: number;
  currency?: string;
}

export interface ConflictDeclaration {
  hasConflicts: boolean;
  description?: string;
  financialInterests: string[];
  relationships: string[];
  declaredBy: string;
  declaredDate: Date;
}

export interface EthicsApproval {
  required: boolean;
  approved?: boolean;
  approvalNumber?: string;
  institution?: string;
  approvalDate?: Date;
  exemptionReason?: string;
}

export interface DataAvailabilityStatement {
  type: 'publicly-available' | 'available-on-request' | 'restricted' | 'not-applicable';
  location?: string;
  accessRequirements?: string;
  embargoDate?: Date;
  statement: string;
}

export interface PreviousSubmission {
  journalName: string;
  submissionDate: Date;
  decision: 'rejected' | 'withdrawn' | 'under-review';
  manuscriptId?: string;
  changesFromPrevious: string;
}

export type SubmissionStatus = 
  | 'draft' 
  | 'submitted' 
  | 'acknowledged' 
  | 'screening' 
  | 'under-review' 
  | 'revision-requested' 
  | 'revision-submitted' 
  | 'accepted' 
  | 'rejected' 
  | 'withdrawn';

export type SubmissionStep = 
  | 'manuscript-upload'
  | 'author-details' 
  | 'manuscript-details' 
  | 'supplementary-files' 
  | 'declarations' 
  | 'review-submit';

export type ManuscriptFileType = 'pdf' | 'docx' | 'latex' | 'tex';

export type SupplementaryFileType = 
  | 'dataset' 
  | 'image' 
  | 'video' 
  | 'code' 
  | 'document' 
  | 'spreadsheet' 
  | 'presentation' 
  | 'archive';

export type UploadStatus = 
  | 'pending' 
  | 'uploading' 
  | 'processing' 
  | 'validating' 
  | 'completed' 
  | 'failed' 
  | 'paused' 
  | 'cancelled';

// Submission Wizard Configuration
export interface SubmissionWizardConfig {
  journalId: string;
  steps: WizardStep[];
  requirements: SubmissionRequirements;
  templates: SubmissionTemplates;
  settings: WizardSettings;
}

export interface WizardStep {
  id: SubmissionStep;
  title: string;
  description: string;
  isRequired: boolean;
  estimatedTimeMinutes: number;
  helpText: string;
  validationRules: ValidationRule[];
  fields: FormField[];
}

export interface SubmissionRequirements {
  maxFileSize: number; // in bytes
  allowedFormats: ManuscriptFileType[];
  maxSupplementaryFiles: number;
  requiredFields: string[];
  minimumWordCount?: number;
  maximumWordCount?: number;
  referenceStyle?: string;
  languageRequirements: string[];
}

export interface SubmissionTemplates {
  coverLetter?: string;
  authorGuidelines: string;
  reviewerSuggestions?: string;
  conflictOfInterestForm: string;
  copyrightForm?: string;
}

export interface WizardSettings {
  autoSaveInterval: number; // in seconds
  sessionTimeout: number; // in minutes
  allowMultipleAuthors: boolean;
  requireOrcid: boolean;
  enableCollaboration: boolean;
  showProgressIndicator: boolean;
  allowDraftSaving: boolean;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'url' | 'pattern' | 'length' | 'custom';
  value?: any;
  message: string;
  condition?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'file' | 'date';
  label: string;
  placeholder?: string;
  helpText?: string;
  options?: FormOption[];
  validation: ValidationRule[];
  conditionalDisplay?: string;
}

export interface FormOption {
  value: string;
  label: string;
  description?: string;
}

// Submission Analytics and Tracking
export interface SubmissionAnalytics {
  submissionId: string;
  events: SubmissionEvent[];
  performance: SubmissionPerformance;
  userBehavior: UserBehaviorMetrics;
  technicalMetrics: TechnicalMetrics;
}

export interface SubmissionEvent {
  id: string;
  type: 'step-started' | 'step-completed' | 'draft-saved' | 'file-uploaded' | 
        'validation-failed' | 'validation-passed' | 'submission-submitted' | 
        'error-occurred' | 'help-accessed';
  timestamp: Date;
  step?: SubmissionStep;
  details: Record<string, any>;
  userId: string;
  sessionId: string;
}

export interface SubmissionPerformance {
  totalTime: number; // in seconds
  stepTimes: Record<SubmissionStep, number>;
  uploadTime: number;
  validationTime: number;
  abandonmentPoint?: SubmissionStep;
  completionRate: number;
  errorRate: number;
}

export interface UserBehaviorMetrics {
  revisitedSteps: SubmissionStep[];
  helpSectionsAccessed: string[];
  errorsEncountered: string[];
  draftsSaved: number;
  sessionCount: number;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
}

export interface TechnicalMetrics {
  uploadSpeed: number; // bytes per second
  chunkFailures: number;
  retryCount: number;
  networkInterruptions: number;
  processingTime: number;
  memoryUsage?: number;
  errorLogs: string[];
}

// Notification and Communication Types
export interface SubmissionNotification {
  id: string;
  submissionId: string;
  recipientId: string;
  type: NotificationType;
  channel: 'email' | 'in-app' | 'sms';
  subject: string;
  content: string;
  templateId?: string;
  templateData: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export type NotificationType = 
  | 'submission-received' 
  | 'submission-acknowledged' 
  | 'screening-complete' 
  | 'reviewers-assigned' 
  | 'review-reminder' 
  | 'decision-ready' 
  | 'revision-requested' 
  | 'accepted' 
  | 'rejected';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}