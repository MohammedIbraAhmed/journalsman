# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there - prevents frontend/backend type drift
- **API Calls:** Never make direct HTTP calls - use tRPC client exclusively for type safety
- **Environment Variables:** Access only through config objects in packages/shared/config, never process.env directly
- **Error Handling:** All tRPC procedures must use standardized error codes and messages
- **Database Access:** Always use tenant-aware queries with publisherId filtering for multi-tenancy
- **File Uploads:** Use presigned URLs for direct R2 uploads, never proxy large files through API
- **Credit Deduction:** Always check balance before service consumption and handle insufficient credits gracefully

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `SubmissionCard.tsx` |
| Hooks | camelCase with 'use' | - | `useSubmissions.ts` |
| tRPC Routes | - | camelCase | `getSubmissionById` |
| Database Collections | - | camelCase plural | `submissions` |
| API Endpoints | - | kebab-case | `/api/trpc/submission.getById` |
