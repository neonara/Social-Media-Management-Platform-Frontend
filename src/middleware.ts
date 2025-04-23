import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pre-compiled regex for path matching
const ADMIN_PATH_REGEX = /^\/create-user(\/|$)/i;
const API_PATH_REGEX = /^\/api(\/|$)/i;
const STATIC_PATH_REGEX = /^\/(_next|images|assets|favicon)/i;
const RESET_PASSWORD_CONFIRM_REGEX = /^\/reset-password-confirm\/[^/]+\/[^/]+(\/|$)/i;
// Cache public paths as Set for O(1) lookups
const PUBLIC_PATHS = new Set([
  "/login",
  "/first-reset-password",
  "/password-reset",
  "/forgot_password",
  "/reset-password-confirm/[uid]/[token]",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  // Fast path for static assets
  if (STATIC_PATH_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  // Allow access to specific public paths without a token
  if (PUBLIC_PATHS.has(pathname) || RESET_PASSWORD_CONFIRM_REGEX.test(pathname)) {
    return addSecurityHeaders(NextResponse.next(), request);
  }

  // Handle API routes separately
  if (API_PATH_REGEX.test(pathname)) {
    return addSecurityHeaders(NextResponse.next(), request);
  }

  // Authentication check for other routes
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin route check
  if (ADMIN_PATH_REGEX.test(pathname)) {
    const isAdmin = request.cookies.get("is_administrator")?.value === "true";
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return addSecurityHeaders(NextResponse.next(), request);
}

// Optimized security headers (pre-computed where possible)
const PROD_CSP =
  "default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;";
const DEV_CSP =
  "default-src 'self'; connect-src 'self' http://localhost:8000 ws:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;";

function addSecurityHeaders(response: NextResponse, request: NextRequest) {
  const headers = new Headers(response.headers);

  // Static headers
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // Dynamic CSP
  const hostname = request.headers.get("host") || "";
  const isDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  headers.set("Content-Security-Policy", isDev ? DEV_CSP : PROD_CSP);

  return new NextResponse(response.body, { headers });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};