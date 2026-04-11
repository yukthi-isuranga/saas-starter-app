import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/webhook/register',
  '/sign-up',
  '/sign-in',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // if (!userId) {
  //   return redirectToSignIn();
  // }

  // handle unauth users trying to access protected routes
  if (!userId && !isPublicRoute(req)) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(url);
  }

  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const role = user.publicMetadata.role as string | undefined;

      // admin role redirection
      if (role === 'admin' && req.nextUrl.pathname === '/dashboard') {
        // return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        const url = new URL('/admin/dashboard', req.url);
        return NextResponse.redirect(url);
      }

      // prevent non-admins from accessing admin routes
      if (role !== 'admin' && req.nextUrl.pathname.startsWith('/admin')) {
        const url = new URL('/dashboard', req.url);
        return NextResponse.redirect(url);
      }

      //redirect auth user trying to access public routes
      if (isPublicRoute(req)) {
        const url = new URL(
          role === 'admin' ? '/admin/dashboard' : '/dashboard',
          req.url,
        );
        return NextResponse.redirect(url);
      }

      // // Protect admin routes - check for admin role
      // if (isAdminRoute(req) && sessionClaims?.metadata?.role !== 'admin') {
      //   const url = new URL('/', req.url);
      //   return NextResponse.redirect(url);
      // }
      // // All other routes require authentication
      // await auth.protect();
    } catch (error) {
      console.error('Error in middleware:', error);
      const url = new URL('/error', req.url);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
