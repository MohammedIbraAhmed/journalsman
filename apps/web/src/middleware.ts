import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication  
  // const isPublicRoute = [
  //   '/',
  //   '/auth/signin',
  //   '/auth/error',
  //   '/api/auth',
  //   '/api/trpc',
  // ].some(path => nextUrl.pathname.startsWith(path));

  // API routes that require authentication
  const isProtectedApiRoute = nextUrl.pathname.startsWith('/api') && 
                             !nextUrl.pathname.startsWith('/api/auth') &&
                             !nextUrl.pathname.startsWith('/api/trpc');

  // Dashboard/protected routes
  const isProtectedRoute = [
    '/dashboard',
    '/profile',
    '/manuscripts',
    '/reviews',
  ].some(path => nextUrl.pathname.startsWith(path));

  // Redirect unauthenticated users trying to access protected routes
  if ((isProtectedRoute || isProtectedApiRoute) && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except static files and images
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};