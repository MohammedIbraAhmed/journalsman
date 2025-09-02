# Core Workflows

Here are the key system workflows that illustrate critical user journeys and component interactions:

## Manuscript Submission and AI Evaluation Workflow

```mermaid
sequenceDiagram
    participant A as Author
    participant W as Web App
    participant API as tRPC API
    participant R2 as Cloudflare R2
    participant DB as MongoDB
    participant AI as AI Service
    participant OpenAI as OpenAI API
    participant Turnitin as Turnitin API
    participant Email as SendGrid

    A->>W: Submit new manuscript
    W->>API: createSubmission(manuscriptData)
    API->>DB: Create submission record
    
    Note over W,R2: File Upload Process
    W->>API: getUploadUrl(files)
    API->>R2: Generate presigned URLs
    R2-->>API: Return upload URLs
    API-->>W: Return presigned URLs
    W->>R2: Direct upload manuscript files
    W->>API: confirmUpload(fileKeys)
    API->>DB: Update submission with file references
    
    Note over API,AI: AI Evaluation Trigger
    API->>AI: Queue evaluation job
    AI->>OpenAI: Analyze content quality
    OpenAI-->>AI: Return quality scores
    AI->>Turnitin: Check for plagiarism
    Turnitin-->>AI: Return similarity report
    AI->>DB: Store evaluation results
    AI->>Email: Send completion notification
    Email->>A: Email evaluation complete
    
    Note over API,W: Status Updates
    API-->>W: Real-time status via tRPC subscription
    W-->>A: Display evaluation results
```

## Credit Purchase and Service Consumption Workflow

```mermaid
sequenceDiagram
    participant P as Publisher
    participant W as Web App
    participant API as tRPC API
    participant Stripe as Stripe API
    participant DB as MongoDB
    participant AI as AI Service
    participant Provider as Service Provider

    P->>W: Select credit package
    W->>API: purchaseCredits(packageType, paymentMethod)
    API->>Stripe: Create payment intent
    Stripe-->>API: Payment confirmation
    API->>DB: Create credit transaction
    API-->>W: Credits added successfully
    
    Note over P,AI: Service Consumption
    P->>W: Request premium service (e.g., translation)
    W->>API: requestService(submissionId, serviceType)
    API->>DB: Check credit balance
    API->>DB: Deduct credits
    API->>AI: Queue service job
    AI->>Provider: Process service request
    Provider-->>AI: Service completed
    
    Note over API,Provider: Revenue Sharing
    AI->>DB: Update service status
    API->>Stripe: Transfer revenue share to provider
    Stripe-->>Provider: Payment transferred
    API->>DB: Record revenue sharing transaction
```

## Multi-Tenant Publisher Onboarding Workflow

```mermaid
sequenceDiagram
    participant Admin as Publisher Admin
    participant W as Web App
    participant API as tRPC API
    participant Auth as NextAuth
    participant DB as MongoDB
    participant Stripe as Stripe Connect
    participant Email as SendGrid

    Admin->>W: Sign up as publisher
    W->>Auth: Create account with ORCID/Google
    Auth->>DB: Store user profile
    
    Note over W,API: Publisher Setup
    W->>API: createPublisher(organizationData)
    API->>DB: Create publisher tenant
    API->>Stripe: Create connected account
    Stripe-->>API: Account ID and setup link
    API->>DB: Store billing information
    
    Note over Admin,W: Journal Configuration
    Admin->>W: Create first journal
    W->>API: createJournal(journalData)
    API->>DB: Create journal with default settings
    
    Note over API,Email: Welcome Process
    API->>Email: Send onboarding email sequence
    Email->>Admin: Welcome and setup guidance
    
    Note over W,Admin: Dashboard Access
    W-->>Admin: Publisher dashboard with journal management
```

## Peer Review Assignment and Workflow

```mermaid
sequenceDiagram
    participant E as Editor
    participant W as Web App
    participant API as tRPC API
    participant DB as MongoDB
    participant AI as AI Service
    participant R as Reviewer
    participant Email as SendGrid

    E->>W: Review submission needing reviewers
    W->>API: getSubmission(submissionId)
    API->>DB: Fetch submission details
    API-->>W: Return submission with AI evaluation
    
    Note over E,AI: Reviewer Matching
    E->>W: Request reviewer suggestions
    W->>API: suggestReviewers(submissionId, expertise)
    API->>AI: Analyze manuscript keywords and expertise
    AI->>DB: Query reviewer database by expertise
    AI-->>API: Return ranked reviewer suggestions
    API-->>W: Display reviewer matches
    
    Note over E,R: Review Invitation
    E->>W: Invite selected reviewers
    W->>API: inviteReviewers(reviewerIds, deadlines)
    API->>DB: Create review records
    API->>Email: Send review invitations
    Email->>R: Review invitation with secure manuscript access
    
    Note over R,W: Review Process
    R->>W: Accept review invitation
    W->>API: acceptReview(reviewId)
    API->>DB: Update review status
    R->>W: Submit completed review
    W->>API: submitReview(reviewId, evaluation)
    API->>DB: Store review evaluation
    API->>Email: Notify editor of completed review
    Email->>E: Review completion notification
```

## OJS Migration and Data Synchronization Workflow

```mermaid
sequenceDiagram
    participant Admin as Migration Admin
    participant W as Web App
    participant API as tRPC API
    participant OJS as OJS System
    participant DB as MongoDB
    participant R2 as Cloudflare R2
    participant Email as SendGrid

    Note over Admin,OJS: Pre-Migration Analysis
    Admin->>W: Initiate OJS migration
    W->>API: analyzeMigration(ojsUrl, credentials)
    API->>OJS: Fetch journal metadata
    OJS-->>API: Return journal structure and statistics
    API-->>W: Display migration analysis and timeline
    
    Note over Admin,W: Migration Configuration
    Admin->>W: Configure migration settings
    W->>API: configureMigration(settings, mappings)
    API->>DB: Store migration configuration
    
    Note over API,R2: Data Migration Process
    API->>OJS: Export journal data (submissions, users, reviews)
    OJS-->>API: Return exported data
    API->>DB: Import and transform user accounts
    API->>DB: Import journal configurations
    API->>OJS: Download manuscript files
    API->>R2: Upload files to cloud storage
    API->>DB: Import submissions with file references
    
    Note over API,Email: Migration Completion
    API->>Email: Send migration completion report
    Email->>Admin: Migration summary and next steps
    API->>Email: Send user migration notifications
    Email->>OJS Users: Account migration instructions
    
    Note over W,Admin: Post-Migration Verification
    W-->>Admin: Migration dashboard with data verification
```
