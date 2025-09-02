import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/root';

/**
 * A set of type-safe react-query hooks for the tRPC API.
 */
export const api = createTRPCReact<AppRouter>();

// Export as trpc for consistency with component usage
export const trpc = api;