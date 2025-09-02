import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '@/server/root';

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

export const trpc = createTRPCNext<AppRouter>({
  config(_opts) {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // Optional: Add headers here
          // headers() {
          //   return {
          //     // authorization: getAuthCookie(),
          //   };
          // },
        }),
      ],
    };
  },
  ssr: false, // Disable SSR for now, can be enabled later
});