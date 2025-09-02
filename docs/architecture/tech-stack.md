# Tech Stack

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe frontend development | Academic publishing requires high reliability and complex data structures |
| Frontend Framework | Next.js | 15.x | React-based full-stack framework | App Router provides modern routing, SSR/SSG for performance, built-in API routes |
| UI Component Library | shadcn/ui | Latest | Accessible, customizable React components | Academic accessibility requirements, rapid development, consistent design system |
| State Management | Zustand + TanStack Query | Latest | Client state + server state management | Simple global state + powerful server state caching for complex academic data |
| Backend Language | TypeScript | 5.3+ | Type-safe backend development | Shared types between frontend/backend, reduced runtime errors |
| Backend Framework | Next.js API Routes + tRPC | 15.x + Latest | Type-safe API layer | End-to-end type safety, excellent DX, integrated with Next.js |
| API Style | tRPC | Latest | Type-safe RPC-style APIs | Eliminates API documentation drift, compile-time API contract validation |
| Database | MongoDB Atlas | 7.0+ | Document database for academic content | Flexible schema for diverse journal types, built-in full-text search, global clustering |
| Cache | Redis (Upstash) | Latest | Session and API response caching | Serverless-compatible Redis for session management and API performance |
| File Storage | Cloudflare R2 | Latest | Scalable document storage | Academic document storage with global CDN, S3-compatible API, cost-effective |
| Authentication | NextAuth.js | v5 | Multi-provider authentication | ORCID integration, institutional SSO, social logins for academic users |
| Frontend Testing | Vitest + Testing Library | Latest | Fast unit/integration testing | Vite-based testing for Next.js, excellent TypeScript support |
| Backend Testing | Vitest + Supertest | Latest | API endpoint testing | Consistent testing framework across frontend/backend |
| E2E Testing | Playwright | Latest | End-to-end testing | Academic workflow complexity requires robust E2E testing |
| Build Tool | Turborepo | Latest | Monorepo build orchestration | Optimized for Vercel, efficient caching, parallel builds |
| Bundler | Next.js (Webpack/Turbopack) | Built-in | Optimized bundling | Integrated bundling with Next.js optimizations |
| IaC Tool | Vercel CLI + Terraform | Latest | Infrastructure as code | Vercel deployment + external resource management |
| CI/CD | GitHub Actions | Latest | Continuous integration/deployment | Native GitHub integration, Vercel deployment hooks |
| Monitoring | Vercel Analytics + Sentry | Latest | Performance and error monitoring | Built-in Vercel monitoring + comprehensive error tracking |
| Logging | Vercel Functions + Axiom | Latest | Structured logging | Serverless-compatible logging with search and analytics |
| CSS Framework | Tailwind CSS | 3.x | Utility-first styling | Rapid development, consistent design system, excellent with shadcn/ui |
