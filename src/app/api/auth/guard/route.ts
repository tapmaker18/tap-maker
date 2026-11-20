import { NextResponse } from "next/server";
import {
  checkSlidingRateLimit,
  getClientIp,
  resetRateLimitKey,
} from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Authentication Brute-Force, Credential-Stuffing & Bot Guard.
 * Protects Sign In, Sign Up, and Password Reset flows.
 *
 * Rules:
 * - Honeypot trap: blocks automated bots immediately.
 * - Sign In pre-check ("check"): verifies neither the IP nor IP+Email is locked out.
 * - Sign In failure ("fail"): records a failed attempt; 5 failures in 10 mins triggers
 *   progressive lockout (60s -> 5m -> 15m). Also enforces 15 failures/10m per IP across all emails.
 * - Sign In success ("success"): clears failed attempts for that IP+Email.
 * - Sign Up ("signup"): max 4 attempts per 15 mins per IP.
 * - Password Reset ("reset"): max 3 requests per 15 mins per IP and per Email.
 */

const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_LOGIN_FAILS_PER_ACCOUNT = 5;
const MAX_LOGIN_FAILS_PER_IP = 15;

const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const MAX_SIGNUPS_PER_IP = 4;

const RESET_WINDOW_MS = 15 * 60 * 1000;
const MAX_RESETS = 3;

function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase().slice(0, 160) : "";
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const email = normalizeEmail(body.email);
    const honeypot = typeof body.honeypot === "string" ? body.honeypot.trim() : "";

    // 1. Honeypot trap: real humans never fill this hidden field
    if (honeypot.length > 0) {
      checkSlidingRateLimit({
        key: `auth:ip-fail:${ip}`,
        limit: 1,
        windowMs: LOGIN_WINDOW_MS,
        recordHit: true,
        progressiveLockout: true,
      });
      return NextResponse.json(
        {
          allowed: false,
          retryAfterSeconds: 300,
          error: "Automated submission blocked. Please try again later.",
        },
        { status: 429 }
      );
    }

    const accountKey = `auth:acct-fail:${ip}:${email || "unknown"}`;
    const ipFailKey = `auth:ip-fail:${ip}`;

    // 2. Pre-check before calling Firebase signInWithEmailAndPassword
    if (action === "check") {
      const ipStatus = checkSlidingRateLimit({
        key: ipFailKey,
        limit: MAX_LOGIN_FAILS_PER_IP,
        windowMs: LOGIN_WINDOW_MS,
        recordHit: false,
        progressiveLockout: true,
      });
      if (!ipStatus.allowed) {
        return NextResponse.json(
          {
            allowed: false,
            retryAfterSeconds: ipStatus.retryAfterSeconds,
            remainingAttempts: 0,
            error: `Too many failed login attempts from your network. Please wait ${ipStatus.retryAfterSeconds}s before trying again.`,
          },
          { status: 429 }
        );
      }

      const acctStatus = checkSlidingRateLimit({
        key: accountKey,
        limit: MAX_LOGIN_FAILS_PER_ACCOUNT,
        windowMs: LOGIN_WINDOW_MS,
        recordHit: false,
        progressiveLockout: true,
      });
      if (!acctStatus.allowed) {
        return NextResponse.json(
          {
            allowed: false,
            retryAfterSeconds: acctStatus.retryAfterSeconds,
            remainingAttempts: 0,
            error: `Account temporarily locked due to failed login attempts. Please wait ${acctStatus.retryAfterSeconds}s.`,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({
        allowed: true,
        remainingAttempts: acctStatus.remaining,
        retryAfterSeconds: 0,
      });
    }

    // 3. Record a failed login attempt
    if (action === "fail") {
      const ipStatus = checkSlidingRateLimit({
        key: ipFailKey,
        limit: MAX_LOGIN_FAILS_PER_IP,
        windowMs: LOGIN_WINDOW_MS,
        recordHit: true,
        progressiveLockout: true,
      });
      const acctStatus = checkSlidingRateLimit({
        key: accountKey,
        limit: MAX_LOGIN_FAILS_PER_ACCOUNT,
        windowMs: LOGIN_WINDOW_MS,
        recordHit: true,
        progressiveLockout: true,
      });

      const locked = !acctStatus.allowed || !ipStatus.allowed;
      const retryAfterSeconds = Math.max(
        acctStatus.retryAfterSeconds,
        ipStatus.retryAfterSeconds
      );

      return NextResponse.json(
        {
          allowed: !locked,
          remainingAttempts: acctStatus.remaining,
          retryAfterSeconds,
          error: locked
            ? `Too many failed login attempts. Locked for ${retryAfterSeconds}s.`
            : undefined,
        },
        { status: locked ? 429 : 200 }
      );
    }

    // 4. Clear failed login counter on successful sign-in
    if (action === "success") {
      resetRateLimitKey(accountKey);
      return NextResponse.json({ ok: true });
    }

    // 5. Rate-limit new account registrations per IP
    if (action === "signup") {
      const signupStatus = checkSlidingRateLimit({
        key: `auth:signup:${ip}`,
        limit: MAX_SIGNUPS_PER_IP,
        windowMs: SIGNUP_WINDOW_MS,
        recordHit: true,
        progressiveLockout: true,
      });
      if (!signupStatus.allowed) {
        return NextResponse.json(
          {
            allowed: false,
            retryAfterSeconds: signupStatus.retryAfterSeconds,
            error: `Too many registration attempts. Please wait ${signupStatus.retryAfterSeconds}s before trying again.`,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ allowed: true, remainingAttempts: signupStatus.remaining });
    }

    // 6. Rate-limit password reset emails per IP and per Email
    if (action === "reset") {
      const ipReset = checkSlidingRateLimit({
        key: `auth:reset-ip:${ip}`,
        limit: MAX_RESETS,
        windowMs: RESET_WINDOW_MS,
        recordHit: true,
        progressiveLockout: true,
      });
      const emailReset = email
        ? checkSlidingRateLimit({
            key: `auth:reset-email:${email}`,
            limit: MAX_RESETS,
            windowMs: RESET_WINDOW_MS,
            recordHit: true,
            progressiveLockout: true,
          })
        : ipReset;

      if (!ipReset.allowed || !emailReset.allowed) {
        const wait = Math.max(ipReset.retryAfterSeconds, emailReset.retryAfterSeconds);
        return NextResponse.json(
          {
            allowed: false,
            retryAfterSeconds: wait,
            error: `Too many password reset requests. Please wait ${wait}s before requesting another link.`,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ allowed: true });
    }

    return NextResponse.json({ error: "Invalid guard action." }, { status: 400 });
  } catch (err) {
    console.error("Auth guard error:", err);
    return NextResponse.json({ error: "Security check failed." }, { status: 500 });
  }
}
