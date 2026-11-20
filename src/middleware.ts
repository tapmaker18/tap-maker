import { NextRequest, NextResponse } from "next/server";
import { checkSlidingRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Global Edge Security & Anti-DDoS Middleware:
 * 1. Blocks automated vulnerability scanners (.env, .git, wp-admin, phpmyadmin, etc.).
 * 2. Enforces CSRF Origin/Host check on state-changing API requests.
 * 3. Rejects oversized API payloads before they hit serverless functions.
 * 4. Applies per-IP sliding-window rate limits across all /api/* routes.
 */

const BLOCKED_PATH_PATTERNS =
  /^\/(\.env|\.git|wp-admin|wp-login|wp-content|phpmyadmin|cgi-bin|vendor\/phpunit|actuator|xmlrpc\.php)/i;

function getRouteRateLimit(pathname: string): { bucket: string; limit: number; windowMs: number } {
  if (pathname.startsWith("/api/ai/")) {
    // Expensive AI generation endpoints
    return { bucket: "api-ai", limit: 12, windowMs: 60 * 1000 };
  }
  if (pathname.startsWith("/api/auth/")) {
    // Login / signup / reset guard endpoint
    return { bucket: "api-auth", limit: 25, windowMs: 60 * 1000 };
  }
  if (pathname.startsWith("/api/admin/") || pathname.startsWith("/api/customers")) {
    // Admin & client customer-management endpoints
    return { bucket: "api-mgmt", limit: 45, windowMs: 60 * 1000 };
  }
  // General API endpoints (/api/assets, /api/customer/menus, etc.)
  return { bucket: "api-general", limit: 60, windowMs: 60 * 1000 };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Block common bot / exploit scanner paths immediately
  if (BLOCKED_PATH_PATTERNS.test(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 2. Protect all API routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);

    // 2a. Global per-IP burst shield (max 120 API calls per minute across all endpoints)
    const burst = checkSlidingRateLimit({
      key: `mw:burst:${ip}`,
      limit: 120,
      windowMs: 60 * 1000,
    });

    // 2b. Per-category sliding-window rate limit
    const routePolicy = getRouteRateLimit(pathname);
    const routeCheck = checkSlidingRateLimit({
      key: `mw:${routePolicy.bucket}:${ip}`,
      limit: routePolicy.limit,
      windowMs: routePolicy.windowMs,
    });

    if (!burst.allowed || !routeCheck.allowed) {
      const retryAfter = Math.max(burst.retryAfterSeconds, routeCheck.retryAfterSeconds);
      return NextResponse.json(
        {
          error: `Too many requests. Please slow down and try again in ${retryAfter}s.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(routePolicy.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2c. Payload size guard to prevent memory exhaustion attacks
    const contentLength = Number(request.headers.get("content-length") || "0");
    const isMultipartAi = pathname.startsWith("/api/ai/");
    const maxBytes = isMultipartAi ? 12 * 1024 * 1024 : 2 * 1024 * 1024;
    if (contentLength > maxBytes) {
      return NextResponse.json(
        { error: "Request payload is too large." },
        { status: 413 }
      );
    }

    // 2d. CSRF Origin verification for state-changing requests
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json(
              { error: "Cross-origin request blocked by security policy." },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            { error: "Invalid request origin." },
            { status: 403 }
          );
        }
      }
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(routePolicy.limit));
    response.headers.set("X-RateLimit-Remaining", String(routeCheck.remaining));
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/(\\.env.*|\\.git.*|wp-admin.*|wp-login.*|phpmyadmin.*|xmlrpc\\.php.*)",
  ],
};
