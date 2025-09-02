# Frontend Architecture

## Component Architecture

### Component Organization

```
src/
├── app/                          # Next.js 15 App Router
│   ├── (dashboard)/             # Route groups for dashboard
│   │   ├── journals/            # Journal management pages
│   │   ├── submissions/         # Submission management pages
│   │   └── settings/           # Publisher settings pages
│   ├── (auth)/                 # Authentication pages
│   ├── api/                    # API routes and tRPC endpoints
│   ├── globals.css             # Global Tailwind styles
│   └── layout.tsx              # Root layout component
├── components/                  # Reusable UI components
│   ├── ui/                     # shadcn/ui base components
│   ├── forms/                  # Form-specific components
│   ├── tables/                 # Data table components
│   └── charts/                 # Analytics and visualization
├── lib/                        # Utility functions and config
│   ├── utils.ts               # General utilities
│   ├── trpc.ts                # tRPC client configuration
│   └── auth.ts                # NextAuth configuration
└── hooks/                      # Custom React hooks
    ├── use-submissions.ts      # Submission-related hooks
    ├── use-journals.ts         # Journal management hooks
    └── use-credits.ts          # Credit system hooks
```

### Component Template

```typescript
import { type FC } from 'react';
import { cn } from '~/lib/utils';

interface SubmissionCardProps {
  submission: {
    id: string;
    title: string;
    status: string;
    submittedAt: Date;
    aiEvaluationResults?: {
      overallScore: number;
      recommendation: string;
    };
  };
  className?: string;
  onEdit?: (id: string) => void;
}

export const SubmissionCard: FC<SubmissionCardProps> = ({
  submission,
  className,
  onEdit,
}) => {
  return (
    <div className={cn(
      "border rounded-lg p-4 hover:shadow-md transition-shadow",
      className
    )}>
      <h3 className="font-semibold text-lg mb-2">{submission.title}</h3>
      <div className="flex justify-between items-center">
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          submission.status === 'accepted' && "bg-green-100 text-green-800",
          submission.status === 'under-review' && "bg-yellow-100 text-yellow-800"
        )}>
          {submission.status}
        </span>
        {submission.aiEvaluationResults && (
          <span className="text-sm text-gray-600">
            AI Score: {submission.aiEvaluationResults.overallScore}
          </span>
        )}
      </div>
    </div>
  );
};
```

## State Management Architecture

### State Structure

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  // Current publisher context
  currentPublisher: {
    id: string;
    name: string;
    creditBalance: number;
  } | null;

  // UI state
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // Actions
  setCurrentPublisher: (publisher: AppState['currentPublisher']) => void;
  toggleSidebar: () => void;
  setTheme: (theme: AppState['theme']) => void;
}

export const useAppStore = create<AppState>()(
  devtools((set) => ({
    currentPublisher: null,
    sidebarCollapsed: false,
    theme: 'system',
    
    setCurrentPublisher: (publisher) => set({ currentPublisher: publisher }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setTheme: (theme) => set({ theme }),
  }))
);

// Separate store for submission filters
interface SubmissionFiltersState {
  status: string | null;
  journalId: string | null;
  dateRange: [Date, Date] | null;
  
  setStatus: (status: string | null) => void;
  setJournalId: (journalId: string | null) => void;
  setDateRange: (dateRange: [Date, Date] | null) => void;
  clearFilters: () => void;
}

export const useSubmissionFiltersStore = create<SubmissionFiltersState>((set) => ({
  status: null,
  journalId: null,
  dateRange: null,
  
  setStatus: (status) => set({ status }),
  setJournalId: (journalId) => set({ journalId }),
  setDateRange: (dateRange) => set({ dateRange }),
  clearFilters: () => set({ status: null, journalId: null, dateRange: null }),
}));
```

### State Management Patterns

- **Server State:** TanStack Query for API data caching and synchronization
- **Client State:** Zustand for global UI state and user preferences
- **Form State:** React Hook Form with Zod validation schemas
- **URL State:** Next.js useSearchParams for filters and pagination

## Routing Architecture

### Route Organization

```
app/
├── (dashboard)/                 # Authenticated dashboard routes
│   ├── layout.tsx              # Dashboard shell layout
│   ├── page.tsx               # Dashboard overview
│   ├── journals/              # Journal management
│   │   ├── page.tsx           # Journal list
│   │   ├── [id]/              # Dynamic journal routes
│   │   │   ├── page.tsx       # Journal details
│   │   │   ├── settings/      # Journal settings
│   │   │   └── submissions/   # Journal submissions
│   │   └── new/               # Create journal
│   ├── submissions/           # Submission management
│   │   ├── page.tsx          # Submission list
│   │   ├── [id]/             # Dynamic submission routes
│   │   │   ├── page.tsx      # Submission details
│   │   │   ├── review/       # Review interface
│   │   │   └── edit/         # Edit submission
│   │   └── new/              # Submit new manuscript
│   ├── credits/              # Credit management
│   │   ├── page.tsx         # Credit dashboard
│   │   ├── purchase/        # Purchase credits
│   │   └── history/         # Transaction history
│   └── settings/            # Publisher settings
│       ├── page.tsx        # General settings
│       ├── billing/        # Billing settings
│       └── team/          # Team management
├── (auth)/                    # Authentication routes
│   ├── login/                # Sign in page
│   ├── register/             # Publisher registration
│   └── callback/             # OAuth callbacks
├── (public)/                 # Public marketing pages
│   ├── page.tsx             # Landing page
│   ├── about/               # About page
│   └── pricing/             # Pricing page
└── api/                      # API routes
    ├── trpc/                 # tRPC router
    ├── auth/                 # NextAuth configuration
    └── webhooks/             # External webhooks
```

### Protected Route Pattern

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/lib/auth';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  // Check if user has publisher role
  if (!session.user.roles.some(role => role.role === 'publisher-admin')) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-background">
      <nav>...</nav>
      <main>{children}</main>
    </div>
  );
}
```

## Frontend Services Layer

### API Client Setup

```typescript
import { createTRPCNext } from '@trpc/next';
import { type AppRouter } from '~/server/api/root';
import { getUrl, transformer } from './shared';

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer,
      links: [
        httpBatchLink({
          url: getUrl(),
          headers() {
            return {
              'x-trpc-source': 'nextjs-react',
            };
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
          },
        },
      },
    };
  },
  ssr: false,
});
```

### Service Example

```typescript
import { api } from '~/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSubmissions(filters?: {
  journalId?: string;
  status?: string;
  page?: number;
}) {
  return api.submission.getAll.useQuery(filters, {
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes for submission data
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  
  return api.submission.create.useMutation({
    onSuccess: () => {
      // Invalidate submissions list to refetch
      queryClient.invalidateQueries(['submission', 'getAll']);
    },
  });
}

export function useSubmissionById(id: string) {
  return api.submission.getById.useQuery({ id }, {
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual submission
  });
}
```
