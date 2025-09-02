import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const healthRouter = createTRPCRouter({
  check: publicProcedure
    .query(() => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Synfind API is running',
      };
    }),

  ping: publicProcedure
    .input(z.object({ message: z.string().optional() }))
    .query(({ input }) => {
      return {
        pong: input.message || 'Hello from Synfind API!',
        timestamp: new Date().toISOString(),
      };
    }),
});