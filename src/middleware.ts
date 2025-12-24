import jwt, { JwtPayload } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "./config/api";

// Pre-compiled regex for path matching
const ADMIN_PATH_REGEX = /^\/create-user(\/|$)/i;
const API_PATH_REGEX = /^\/api(\/|$)/i;
const STATIC_PATH_REGEX = /^\/(_next|images|assets|favicon)/i;
const RESET_PASSWORD_CONFIRM_REGEX =
  /^\/reset-password-confirm\/[^/]+\/[^/]+(\/|$)/i;

// Cache public paths as Set for O(1) lookups
const PUBLIC_PATHS = new Set([
  "/login",
  "/first-reset-password",
  "/password-reset",
  "/forgot-password",
  "/reset-password-confirm/[uid]/[token]",
  "/content",
  "/create-user",
]);

// Add cache for recently validated tokens to reduce backend calls
const TOKEN_CACHE = new Map<string, { valid: boolean; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Validates JWT token by making a call to the backend
 * This is more secure than just decoding the token client-side
 * Includes caching to reduce backend calls
 */
async function validateTokenWithBackend(
  token: string,
  request: NextRequest,
): Promise<boolean> {
  try {
    // Check cache first
    const cached = TOKEN_CACHE.get(token);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.valid;
    }

    const response = await fetch(`${API_BASE_URL}/auth/validate-token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        // Forward original request headers for security logging
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "X-Real-IP": request.headers.get("x-real-ip") || "",
      },
      body: JSON.stringify({ token }),
      cache: "no-cache",
    });

    const isValid = response.ok;

    // Cache the result
    TOKEN_CACHE.set(token, { valid: isValid, timestamp: Date.now() });

    // Clean old cache entries periodically
    if (TOKEN_CACHE.size > 100) {
      const cutoff = Date.now() - CACHE_DURATION;
      for (const [key, value] of TOKEN_CACHE.entries()) {
        if (value.timestamp < cutoff) {
          TOKEN_CACHE.delete(key);
        }
      }
    }

    return isValid;
  } catch (error) {
    console.error("Backend token validation failed:", error);
    return false;
  }
}

/**
 * Validates user role with backend instead of trusting cookies
 */
async function validateUserRole(
  token: string,
  requiredRoles: string[],
): Promise<boolean> {
  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

    const response = await fetch(`${API_BASE_URL}/auth/validate-role/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ required_roles: requiredRoles }),
      cache: "no-cache",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.has_access === true;
  } catch (error) {
    console.error("Backend role validation failed:", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  // Fast path for static assets
  if (STATIC_PATH_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  // Redirect logged-in users from the login page to the dashboard
  if (pathname === "/login" && token) {
    try {
      // First do a quick local validation for performance
      const decodedToken = jwt.decode(token) as JwtPayload;
      if (
        decodedToken &&
        decodedToken.exp &&
        decodedToken.exp * 1000 > Date.now()
      ) {
        // Then validate with backend for security
        const isValid = await validateTokenWithBackend(token, request);
        if (isValid) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    } catch (error) {
      console.error("Token validation error on login page:", error);
    }
  }

  // Allow access to specific public paths without a token
  if (
    PUBLIC_PATHS.has(pathname) ||
    RESET_PASSWORD_CONFIRM_REGEX.test(pathname)
  ) {
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

  // Enhanced token validation with backend verification
  try {
    // First do a quick local validation
    const decodedToken = jwt.decode(token) as JwtPayload;
    if (
      !decodedToken ||
      !decodedToken.exp ||
      decodedToken.exp * 1000 < Date.now()
    ) {
      console.warn("Token expired or invalid (local check)");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Then validate with backend for security
    const isValidToken = await validateTokenWithBackend(token, request);
    if (!isValidToken) {
      console.warn("Token validation failed (backend check)");
      // Clear the invalid token
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin route check with backend role validation
  if (ADMIN_PATH_REGEX.test(pathname)) {
    try {
      const hasAdminAccess = await validateUserRole(token, [
        "administrator",
        "super_administrator",
      ]);
      if (!hasAdminAccess) {
        console.warn("Admin access denied for path:", pathname);
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      console.error("Admin role validation error:", error);
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
