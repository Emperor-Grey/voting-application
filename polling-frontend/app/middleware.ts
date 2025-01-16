import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = ["/polls/new", "/polls/manage"];

// Define auth routes that should redirect if already authenticated
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has("webauthn");
  const path = request.nextUrl.pathname;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  // Redirect to login if trying to access protected route while not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to polls if trying to access auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/polls", request.url));
  }

  // Add auth header to API requests if authenticated
  if (path.startsWith("/api/") && isAuthenticated) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "X-Auth-Token",
      request.cookies.get("webauthn")?.value || ""
    );

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
