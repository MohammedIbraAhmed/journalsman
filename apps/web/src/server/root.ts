import { createTRPCRouter } from './trpc';
import { healthRouter } from './routers/health';
import { databaseRouter } from './routers/database';
import { publisherRouter } from './routers/publisher';
import { journalRouter } from './routers/journal';
import { analyticsRouter } from './routers/analytics';
import { brandingRouter } from './routers/branding';
import { submissionRouter } from './routers/submission';

/**
 * This is the primary router for the tRPC server.
 * All routers added in /routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  database: databaseRouter,
  publisher: publisherRouter,
  journal: journalRouter,
  analytics: analyticsRouter,
  branding: brandingRouter,
  submission: submissionRouter,
  // Add more routers here as they are created
  // user: userRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;