import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sso-callback(.*)']);

export default clerkMiddleware(async (auth, request) => {
    const userId = (await auth()).userId;

    if (isPublicRoute(request) && userId) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (request.nextUrl.pathname === '/profile' && userId) {
        return NextResponse.redirect(new URL(`/user/${userId}`, request.url));
    }

    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)'
    ]
};
