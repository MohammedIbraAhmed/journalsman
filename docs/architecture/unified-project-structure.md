# Unified Project Structure

```
synfind/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yml             # Test and build pipeline
│       └── deploy.yml         # Deployment pipeline
├── apps/                       # Application packages
│   ├── web/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/            # Next.js 15 App Router
│   │   │   ├── components/     # shadcn/ui components
│   │   │   ├── lib/           # Frontend utilities and config
│   │   │   └── styles/        # Global Tailwind CSS
│   │   ├── public/            # Static assets
│   │   └── package.json
│   └── workers/               # Cloudflare Workers
│       ├── ai-evaluation/     # AI evaluation service
│       ├── document-processor/ # File processing service
│       └── notifications/     # Email notification service
├── packages/                  # Shared packages
│   ├── shared/                # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/         # TypeScript interfaces
│   │   │   ├── schemas/       # Zod validation schemas
│   │   │   └── utils/         # Shared utility functions
│   │   └── package.json
│   ├── ui/                    # Shared UI component library
│   │   ├── src/components/    # shadcn/ui customized components
│   │   └── package.json
│   ├── database/              # Database schemas and utilities
│   │   ├── src/
│   │   │   ├── models/        # Mongoose models
│   │   │   └── migrations/    # Database migrations
│   │   └── package.json
│   └── config/                # Shared configuration
│       ├── eslint/           # ESLint configuration
│       ├── typescript/       # TypeScript configuration
│       └── tailwind/         # Tailwind CSS configuration
├── infrastructure/            # Infrastructure as Code
│   ├── terraform/            # Terraform configurations
│   ├── vercel/              # Vercel deployment config
│   └── cloudflare/          # Cloudflare Worker configurations
├── docs/                     # Documentation
│   ├── prd.md               # Product Requirements (from brief)
│   ├── synfind-frontend-spec.md # Frontend specification
│   └── architecture.md     # This architecture document
├── .env.example             # Environment template
├── package.json             # Root package.json with Turborepo
├── turbo.json              # Turborepo configuration
└── README.md
```
