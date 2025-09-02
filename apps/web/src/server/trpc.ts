import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import { validateConfig } from '@synfind/shared';

// Validate configuration on server startup
try {
  validateConfig();
} catch (error) {
  // In development, we might not have all env vars set yet
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
  console.warn('⚠️ Some environment variables are missing. Set them in .env.local');
}

/**
 * Create context for tRPC requests
 * This is where you can add things like database connections, user sessions, etc.
 */
export const createTRPCContext = async (opts?: { req?: unknown; res?: unknown }) => {
  // Create a context that includes the request/response objects
  return {
    req: opts?.req,
    res: opts?.res,
    // Add database connection here later
    // db: mongoClient,
    // session: await getServerSession(req, res, authOptions),
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC server
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// For now, use publicProcedure as protectedProcedure (authentication will be added later)
export const protectedProcedure = t.procedure;