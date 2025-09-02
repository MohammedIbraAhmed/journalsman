# API Specification

Based on the tRPC selection from the Tech Stack, here's the comprehensive tRPC router definition for Synfind:

## tRPC Router Definitions

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';

// Authentication router
export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),

  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.auth.signOut();
    return { success: true };
  }),
});

// Publisher management router
export const publisherRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.publisher.findUnique({
        where: { id: ctx.session.user.publisherId },
        include: { journals: true, creditBalance: true }
      });
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      branding: z.object({
        logoUrl: z.string().optional(),
        primaryColor: z.string(),
        secondaryColor: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.publisher.update({
        where: { id: ctx.session.user.publisherId },
        data: input
      });
    }),

  getCreditBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const transactions = await ctx.db.creditTransaction.aggregate({
        where: { publisherId: ctx.session.user.publisherId },
        _sum: { amount: true }
      });
      return { balance: transactions._sum.amount || 0 };
    }),

  purchaseCredits: protectedProcedure
    .input(z.object({
      packageType: z.enum(['starter', 'professional', 'premium', 'enterprise']),
      paymentMethodId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Stripe payment processing and credit allocation logic
      const packageDetails = getCreditPackageDetails(input.packageType);
      const paymentIntent = await ctx.stripe.paymentIntents.create({
        amount: packageDetails.costInCents,
        currency: 'usd',
        payment_method: input.paymentMethodId,
        confirm: true,
      });
      
      if (paymentIntent.status === 'succeeded') {
        return await ctx.db.creditTransaction.create({
          data: {
            publisherId: ctx.session.user.publisherId,
            type: 'purchase',
            amount: packageDetails.totalCredits,
            costInUSD: packageDetails.costInUSD,
            metadata: { 
              stripePaymentIntentId: paymentIntent.id,
              packageInfo: packageDetails 
            },
            status: 'completed',
            processedAt: new Date(),
          }
        });
      }
    }),
});

// Journal management router
export const journalRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.journal.findMany({
        where: { publisherId: ctx.session.user.publisherId },
        include: { _count: { select: { submissions: true } } }
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.journal.findUnique({
        where: { id: input.id },
        include: {
          editorialBoard: true,
          submissions: { 
            take: 10, 
            orderBy: { submittedAt: 'desc' }
          }
        }
      });
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      issn: z.string().optional(),
      description: z.string(),
      scope: z.string(),
      submissionSettings: z.object({
        acceptedFileTypes: z.array(z.string()),
        maxFileSize: z.number(),
        requiresAbstract: z.boolean(),
        requiresKeywords: z.boolean(),
        minKeywords: z.number(),
        maxKeywords: z.number(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.journal.create({
        data: {
          ...input,
          publisherId: ctx.session.user.publisherId,
          slug: generateSlug(input.title),
          aiEvaluationSettings: getDefaultAISettings(),
        }
      });
    }),

  updateAISettings: protectedProcedure
    .input(z.object({
      journalId: z.string(),
      settings: z.object({
        enableInitialScreening: z.boolean(),
        plagiarismThreshold: z.number().min(0).max(100),
        aiContentThreshold: z.number().min(0).max(100),
        noveltyThreshold: z.number().min(0).max(100),
        autoRejectBelow: z.number().min(0).max(100),
        autoAcceptAbove: z.number().min(0).max(100),
      })
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.journal.update({
        where: { id: input.journalId },
        data: { aiEvaluationSettings: input.settings }
      });
    }),
});

// Submission management router
export const submissionRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      journalId: z.string().optional(),
      status: z.enum(['submitted', 'under-initial-review', 'under-peer-review', 
                     'revision-requested', 'accepted', 'rejected', 'withdrawn']).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const where = {
        ...(input.journalId && { journalId: input.journalId }),
        ...(input.status && { status: input.status }),
        journal: { publisherId: ctx.session.user.publisherId }
      };
      
      const submissions = await ctx.db.submission.findMany({
        where,
        include: {
          journal: { select: { title: true } },
          authors: true,
          aiEvaluationResults: true,
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { submittedAt: 'desc' }
      });
      
      const total = await ctx.db.submission.count({ where });
      
      return { submissions, total, pages: Math.ceil(total / input.limit) };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.submission.findUnique({
        where: { id: input.id },
        include: {
          journal: true,
          authors: true,
          files: true,
          aiEvaluationResults: true,
          reviewRounds: {
            include: { reviews: true }
          },
          creditTransactions: true,
        }
      });
    }),

  create: protectedProcedure
    .input(z.object({
      journalId: z.string(),
      manuscriptData: z.object({
        title: z.string(),
        abstract: z.string(),
        keywords: z.array(z.string()),
        manuscriptType: z.enum(['research-article', 'review', 'case-study', 'editorial']),
        language: z.string().default('en'),
      }),
      authors: z.array(z.object({
        name: z.string(),
        email: z.string().email(),
        affiliation: z.string(),
        orcid: z.string().optional(),
        isCorresponding: z.boolean(),
        contributionRoles: z.array(z.string()),
      })),
      fileIds: z.array(z.string()), // Pre-uploaded file IDs
    }))
    .mutation(async ({ input, ctx }) => {
      const submissionNumber = await generateSubmissionNumber(input.journalId);
      
      const submission = await ctx.db.submission.create({
        data: {
          ...input,
          submissionNumber,
          authorId: ctx.session.user.id,
          status: 'submitted',
          submittedAt: new Date(),
        }
      });

      // Trigger AI evaluation if enabled
      const journal = await ctx.db.journal.findUnique({
        where: { id: input.journalId },
        select: { aiEvaluationSettings: true }
      });

      if (journal?.aiEvaluationSettings.enableInitialScreening) {
        await ctx.aiEvaluationQueue.add('evaluate-submission', {
          submissionId: submission.id
        });
      }

      return submission;
    }),

  requestAIEvaluation: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      services: z.array(z.enum(['similarity-check', 'ai-detection', 'structure-validation'])),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check credit balance and deduct credits
      const costs = calculateServiceCosts(input.services);
      const balance = await getCurrentCreditBalance(ctx.session.user.publisherId);
      
      if (balance < costs.total) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Insufficient credit balance'
        });
      }

      // Create credit transaction
      await ctx.db.creditTransaction.create({
        data: {
          publisherId: ctx.session.user.publisherId,
          type: 'consumption',
          amount: -costs.total,
          costInUSD: costs.total,
          serviceType: 'ai-evaluation-services',
          relatedEntityId: input.submissionId,
          status: 'pending',
        }
      });

      // Queue AI evaluation services
      for (const service of input.services) {
        await ctx.aiEvaluationQueue.add(`evaluate-${service}`, {
          submissionId: input.submissionId,
          serviceType: service
        });
      }

      return { success: true, creditsDeducted: costs.total };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      status: z.enum(['submitted', 'under-initial-review', 'under-peer-review', 
                     'revision-requested', 'accepted', 'rejected', 'withdrawn']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.submission.update({
        where: { id: input.submissionId },
        data: {
          status: input.status,
          updatedAt: new Date(),
        }
      });
    }),
});

// AI Evaluation router
export const aiEvaluationRouter = createTRPCRouter({
  getResults: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.submission.findUnique({
        where: { id: input.submissionId },
        select: { aiEvaluationResults: true }
      });
    }),

  triggerManualEvaluation: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      evaluationType: z.enum(['full', 'plagiarism-only', 'ai-content-only']),
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.aiEvaluationQueue.add('manual-evaluation', {
        submissionId: input.submissionId,
        evaluationType: input.evaluationType,
        requestedBy: ctx.session.user.id,
      });
      
      return { success: true, message: 'Evaluation queued successfully' };
    }),
});

// File management router
export const fileRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Generate presigned URL for Cloudflare R2 upload
      const r2Key = `submissions/${ctx.session.user.publisherId}/${uuid()}/${input.filename}`;
      const uploadUrl = await generateR2PresignedUrl(r2Key, input.contentType);
      
      return {
        uploadUrl,
        r2Key,
        expiresIn: 3600, // 1 hour
      };
    }),

  confirmUpload: protectedProcedure
    .input(z.object({
      r2Key: z.string(),
      filename: z.string(),
      fileSize: z.number(),
      contentType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.file.create({
        data: {
          r2Key: input.r2Key,
          filename: input.filename,
          size: input.fileSize,
          contentType: input.contentType,
          uploadedBy: ctx.session.user.id,
          uploadedAt: new Date(),
        }
      });
    }),

  getDownloadUrl: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const file = await ctx.db.file.findUnique({
        where: { id: input.fileId }
      });
      
      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found'
        });
      }

      const downloadUrl = await generateR2DownloadUrl(file.r2Key);
      return { downloadUrl, expiresIn: 900 }; // 15 minutes
    }),
});

// Main app router combining all routers
export const appRouter = createTRPCRouter({
  auth: authRouter,
  publisher: publisherRouter,
  journal: journalRouter,
  submission: submissionRouter,
  aiEvaluation: aiEvaluationRouter,
  file: fileRouter,
});

export type AppRouter = typeof appRouter;
```
