# Synfind Academic Publishing Platform - Frontend Specification

## Overview

This document defines the frontend architecture and implementation strategy for Synfind (ScholaryHub), a Next.js 15 academic publishing management platform. It extends the UX Design System with technical implementation details for the multi-tenant, AI-powered publishing workflow.

**Alignment:** This specification implements the UX patterns defined in the UX Design System documents while adhering to the technical architecture outlined in `architecture.md`.

## Technical Foundation

### Core Technology Stack

**Framework:** Next.js 15 with App Router  
**Styling:** Tailwind CSS + shadcn/ui v4 components  
**State Management:** Zustand + tRPC React Query integration  
**Forms:** React Hook Form + Zod validation  
**Authentication:** NextAuth v5 with custom UI components  
**File Handling:** React Dropzone + Cloudflare R2 integration  

### Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (public)/          # Public pages
│   └── api/               # API routes (tRPC)
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── academic/          # Academic-specific components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/
│   ├── auth/              # Authentication utilities
│   ├── api/               # tRPC client configuration
│   ├── utils/             # Utility functions
│   └── validations/       # Zod schemas
├── stores/                # Zustand state stores
├── styles/                # Global styles and themes
└── types/                 # TypeScript definitions
```

## User Interface Architecture

### Multi-Tenant Interface Strategy

**Tenant Isolation:** Each publisher organization has branded interface themes while maintaining consistent core UX patterns.

**Implementation Approach:**
- CSS custom properties for tenant-specific branding
- Dynamic theme loading based on subdomain/organization
- Consistent component behavior across all tenants

### Responsive Design Strategy

**Breakpoint Strategy:**
```css
/* Academic-optimized breakpoints */
sm: 640px   /* Mobile portrait */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Editorial workstations */
```

**Priority:** Desktop-first for editorial workflows, mobile-optimized for author/reviewer access.

## Core Interface Components

### 1. Authentication Interface

**Components:**
- `SignInForm` - Multi-provider authentication (Google, ORCID, institutional SSO)
- `RoleSelector` - Role-based dashboard routing post-authentication
- `TenantSelector` - Publisher organization selection for multi-tenant users

**Implementation:**
```typescript
// components/auth/SignInForm.tsx
export function SignInForm() {
  return (
    <Card className="academic-auth-card">
      <CardHeader>
        <h1 className="academic-title">Access Synfind</h1>
      </CardHeader>
      <CardContent>
        <div className="auth-providers space-y-4">
          <SignInButton provider="google" />
          <SignInButton provider="orcid" />
          <InstitutionalSSOButton />
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. Publisher Dashboard Interface

**Components:**
- `PublisherOverview` - Multi-journal analytics and KPIs
- `JournalGrid` - Visual journal management interface
- `QuickActions` - Common publisher tasks (create journal, invite editors)
- `ActivityFeed` - Real-time submission and review activity

**Layout Pattern:**
```typescript
// app/(dashboard)/publisher/layout.tsx
export default function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="publisher-layout">
      <PublisherSidebar />
      <main className="publisher-main">
        <PublisherHeader />
        <div className="publisher-content">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### 3. Manuscript Submission Interface

**Components:**
- `SubmissionWizard` - Multi-step submission process
- `FileUploadZone` - Drag-and-drop with progress tracking
- `ManuscriptEditor` - Rich text editor with academic formatting
- `AuthorCollaboration` - Co-author invitation and permissions
- `SubmissionPreview` - Pre-submission validation and preview

**Critical UX Patterns:**
- Progressive disclosure of submission requirements
- Real-time validation with clear error messaging
- Auto-save functionality for long-form content
- Visual progress indicators throughout multi-step process

### 4. AI Evaluation Interface

**Components:**
- `EvaluationDashboard` - AI analysis results with confidence scores
- `PlagiarismReport` - Similarity detection with source highlighting
- `AIContentDetection` - Machine-generated content analysis
- `EditorialOverride` - Human review and decision controls
- `TransparencyPanel` - Explainable AI reasoning display

**Key Requirements:**
- Real-time evaluation progress with WebSocket updates
- Interactive confidence scoring with human oversight controls
- Detailed audit trails for all AI decisions
- Clear visual hierarchy for decision-critical information

### 5. Review Management Interface

**Components:**
- `ReviewerAssignment` - Intelligent reviewer matching interface
- `ReviewInterface` - Manuscript annotation and evaluation tools
- `EditorialWorkflow` - Decision routing and approval processes
- `CommunicationHub` - Stakeholder messaging and notifications
- `TimelineTracker` - Visual progress tracking for review stages

## State Management Architecture

### Global State Structure

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  currentTenant: Publisher | null;
  permissions: Permission[];
  setUser: (user: User) => void;
  switchTenant: (tenantId: string) => void;
}

// stores/submissionStore.ts  
interface SubmissionState {
  currentSubmission: Submission | null;
  drafts: SubmissionDraft[];
  uploadProgress: Record<string, number>;
  saveSubmission: (data: SubmissionData) => void;
  uploadFile: (file: File) => Promise<void>;
}

// stores/evaluationStore.ts
interface EvaluationState {
  evaluations: EvaluationResult[];
  activeEvaluation: string | null;
  aiResults: AIAnalysisResult[];
  updateEvaluation: (id: string, result: EvaluationResult) => void;
}
```

### API State Management (tRPC + React Query)

**Pattern:** All server state managed through tRPC procedures with React Query caching.

```typescript
// lib/api/trpc.ts
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
});
```

## Form Architecture

### Validation Strategy

**Library:** Zod for schema validation with React Hook Form integration

```typescript
// lib/validations/submission.ts
export const submissionSchema = z.object({
  title: z.string().min(10).max(200),
  abstract: z.string().min(100).max(2000),
  authors: z.array(authorSchema).min(1),
  manuscript: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    "Manuscript must be under 10MB"
  ),
  keywords: z.array(z.string()).min(3).max(10),
});
```

### Form Components

**Pattern:** Consistent form components with academic-specific validation patterns.

```typescript
// components/forms/SubmissionForm.tsx
export function SubmissionForm() {
  const form = useForm<SubmissionData>({
    resolver: zodResolver(submissionSchema),
  });
  
  const submitMutation = api.submissions.create.useMutation();
  
  return (
    <Form {...form}>
      <FormSection title="Manuscript Details">
        <FormField name="title" component={TitleInput} />
        <FormField name="abstract" component={AbstractEditor} />
      </FormSection>
      <FormSection title="File Upload">
        <FormField name="manuscript" component={FileUploadZone} />
      </FormSection>
    </Form>
  );
}
```

## Performance Optimization

### Code Splitting Strategy

**Approach:** Route-based and feature-based code splitting for optimal loading performance.

```typescript
// Dynamic imports for heavy features
const AIEvaluationDashboard = dynamic(
  () => import('../components/evaluation/AIEvaluationDashboard'),
  { loading: () => <EvaluationSkeleton /> }
);

const ManuscriptEditor = dynamic(
  () => import('../components/submission/ManuscriptEditor'),
  { ssr: false }
);
```

### Caching Strategy

**Implementation:**
- Next.js ISR for static publisher pages
- React Query for server state caching
- Browser caching for uploaded documents
- Edge caching via Vercel for global performance

## Accessibility Implementation

### WCAG 2.1 AA Compliance

**Focus Areas:**
- Keyboard navigation for all interactive elements
- Screen reader optimization for complex academic workflows  
- High contrast mode support for extended reading sessions
- Focus management for multi-step workflows

**Implementation Pattern:**
```typescript
// components/ui/Button.tsx with accessibility
export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, variant, size, ...props }, ref) => (
  <button
    className={cn(buttonVariants({ variant, size, className }))}
    ref={ref}
    {...props}
    aria-describedby={props['aria-describedby']}
    role={props.role || 'button'}
  />
));
```

## Security Implementation

### Client-Side Security

**Approach:**
- CSP headers via Next.js configuration
- Input sanitization for rich text content
- Secure file upload with client-side validation
- Session management via NextAuth v5

**File Upload Security:**
```typescript
// lib/utils/fileValidation.ts
export function validateManuscriptFile(file: File): ValidationResult {
  const allowedTypes = ['application/pdf', 'application/msword'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  return { valid: true };
}
```

## Testing Strategy

### Component Testing

**Framework:** Jest + React Testing Library + MSW for API mocking

```typescript
// components/__tests__/SubmissionForm.test.tsx
describe('SubmissionForm', () => {
  it('validates required fields', async () => {
    render(<SubmissionForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });
});
```

### End-to-End Testing

**Framework:** Playwright for critical user journeys

```typescript
// e2e/submission.spec.ts
test('complete submission workflow', async ({ page }) => {
  await page.goto('/submit');
  await page.fill('[data-testid="title"]', 'Test Manuscript');
  await page.setInputFiles('[data-testid="file-upload"]', 'test.pdf');
  await page.click('[data-testid="submit-button"]');
  
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

## Next Steps

1. **Remove incorrect specification:** Delete `docs/front-end-spec.md` (journalsman project)
2. **Implement foundation components:** Start with authentication and basic layout
3. **Establish design token integration:** Connect UX Design System with shadcn/ui
4. **Create component library:** Build academic-specific component variants
5. **Set up testing infrastructure:** Implement testing strategy from day one