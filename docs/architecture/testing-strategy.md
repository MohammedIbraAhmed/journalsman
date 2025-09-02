# Testing Strategy

## Testing Pyramid

```
      E2E Tests
     /          \
   Integration Tests
  /              \
Frontend Unit  Backend Unit
```

## Test Organization

### Frontend Tests

```
apps/web/tests/
├── components/           # Component unit tests
│   ├── SubmissionCard.test.tsx
│   └── JournalForm.test.tsx
├── hooks/               # Custom hook tests
│   ├── useSubmissions.test.ts
│   └── useCredits.test.ts
├── utils/               # Utility function tests
├── integration/         # Integration tests
│   ├── auth.test.tsx
│   └── submission-flow.test.tsx
└── __mocks__/          # Test mocks and fixtures
```

### Backend Tests

```
apps/web/tests/api/
├── trpc/               # tRPC procedure tests
│   ├── submission.test.ts
│   ├── publisher.test.ts
│   └── journal.test.ts
├── utils/              # Backend utility tests
├── integration/        # API integration tests
└── __mocks__/         # API mocks and fixtures
```

### E2E Tests

```
tests/e2e/
├── auth/               # Authentication flows
├── submission/         # Manuscript submission flows
├── publisher/          # Publisher management flows
├── payment/           # Credit purchase flows
└── fixtures/          # Test data and page objects
```

## Test Examples

### Frontend Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmissionCard } from '~/components/SubmissionCard';

describe('SubmissionCard', () => {
  const mockSubmission = {
    id: '1',
    title: 'Test Manuscript',
    status: 'under-review',
    submittedAt: new Date('2025-01-01'),
    aiEvaluationResults: {
      overallScore: 85,
      recommendation: 'accept'
    }
  };

  it('displays submission information correctly', () => {
    render(<SubmissionCard submission={mockSubmission} />);
    
    expect(screen.getByText('Test Manuscript')).toBeInTheDocument();
    expect(screen.getByText('under-review')).toBeInTheDocument();
    expect(screen.getByText('AI Score: 85')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = jest.fn();
    render(<SubmissionCard submission={mockSubmission} onEdit={handleEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalledWith('1');
  });
});
```

### Backend API Test

```typescript
import { createTRPCMsw } from 'msw-trpc';
import { appRouter } from '~/server/api/root';
import { createContext } from '~/server/api/trpc';

describe('submission router', () => {
  const trpcMsw = createTRPCMsw(appRouter);

  it('creates submission successfully', async () => {
    const mockContext = await createContext({
      req: {} as any,
      res: {} as any,
    });

    const caller = appRouter.createCaller(mockContext);
    const result = await caller.submission.create({
      journalId: 'journal-1',
      manuscriptData: {
        title: 'Test Paper',
        abstract: 'Test abstract',
        keywords: ['test', 'research'],
        manuscriptType: 'research-article',
        language: 'en'
      },
      authors: [{
        name: 'John Doe',
        email: 'john@example.com',
        affiliation: 'University',
        isCorresponding: true,
        contributionRoles: ['Writing']
      }],
      fileIds: ['file-1']
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe('submitted');
  });
});
```

### E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Manuscript Submission Flow', () => {
  test('complete submission process', async ({ page }) => {
    // Login as publisher
    await page.goto('/login');
    await page.click('text=Sign in with ORCID');
    await page.fill('[data-testid=orcid-email]', 'publisher@test.com');
    await page.fill('[data-testid=orcid-password]', 'password');
    await page.click('[data-testid=orcid-signin]');

    // Navigate to submission form
    await page.goto('/submissions/new');
    await expect(page.locator('h1')).toContainText('Submit Manuscript');

    // Fill submission form
    await page.selectOption('[data-testid=journal-select]', 'journal-1');
    await page.fill('[data-testid=title-input]', 'Test Research Paper');
    await page.fill('[data-testid=abstract-textarea]', 'This is a test abstract...');
    
    // Upload file
    const fileInput = page.locator('[data-testid=file-upload]');
    await fileInput.setInputFiles('test-manuscript.pdf');

    // Submit
    await page.click('[data-testid=submit-button]');
    
    // Verify success
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    await expect(page).toHaveURL(/\/submissions\/[a-z0-9]+/);
  });
});
```
