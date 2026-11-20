"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Lock,
  Mail,
  Key,
  ShieldCheck,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Building2,
  Phone,
  Tag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  const trimmed = raw.trim();
  // Prevent open-redirect attacks (e.g. //evil.com or https://evil.com)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/dashboard";
  }
  return trimmed;
}

async function callAuthGuard(payload: {
  action: "check" | "fail" | "success" | "signup" | "reset";
  email?: string;
  honeypot?: string;
}): Promise<{
  allowed: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  error?: string;
}> {
  try {
    const res = await fetch("/api/auth/guard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.allowed === false) {
      return {
        allowed: false,
        remainingAttempts: data.remainingAttempts,
        retryAfterSeconds: data.retryAfterSeconds || 60,
        error: data.error || "Too many attempts. Please wait before trying again.",
      };
    }
    return {
      allowed: true,
      remainingAttempts: data.remainingAttempts,
      retryAfterSeconds: 0,
    };
  } catch {
    // Fail open only if network request itself couldn't reach local route
    return { allowed: true };
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = sanitizeRedirectPath(searchParams.get("redirect"));

  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Anti-bot honeypot field (must remain empty)
  const [honeypot, setHoneypot] = useState("");

  // Customer onboarding metadata fields (captured during Sign Up)
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderRef, setOrderRef] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Countdown timer when rate-limited / locked out
  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) {
      setError(`Too many attempts. Please wait ${lockoutSeconds}s before trying again.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (mode === "signup") {
      if (!businessName.trim()) {
        setError("Please enter your Business or Brand name.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-check.");
        setLoading(false);
        return;
      }
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    // Server-side brute-force & bot rate-limit check
    const guardCheck = await callAuthGuard({
      action: mode === "signin" ? "check" : "signup",
      email: email.trim(),
      honeypot,
    });
    if (!guardCheck.allowed) {
      const wait = guardCheck.retryAfterSeconds || 60;
      setLockoutSeconds(wait);
      setError(guardCheck.error || `Too many attempts. Please wait ${wait}s.`);
      setLoading(false);
      return;
    }

    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
        await callAuthGuard({ action: "success", email: email.trim() });
        setSuccessMsg("Signed in successfully! Redirecting...");
      } else {
        await signUp(email.trim(), password, {
          businessName: businessName.trim(),
          phone: phone.trim(),
          orderRef: orderRef.trim(),
        });
        setSuccessMsg("Account registered! Awaiting Super Admin review...");
      }
      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Authentication failed. Please check your credentials.";
      if (err.code === "auth/too-many-requests") {
        setLockoutSeconds(60);
        message = "Too many failed login attempts. Account temporarily locked for 60s.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "This email is already registered. Please sign in instead.";
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        if (mode === "signin") {
          const failReport = await callAuthGuard({
            action: "fail",
            email: email.trim(),
          });
          if (!failReport.allowed) {
            const wait = failReport.retryAfterSeconds || 60;
            setLockoutSeconds(wait);
            message =
              failReport.error ||
              `Too many failed login attempts. Locked for ${wait}s.`;
          } else if (
            typeof failReport.remainingAttempts === "number" &&
            failReport.remainingAttempts <= 2
          ) {
            message = `Incorrect email or password (${failReport.remainingAttempts} attempt${
              failReport.remainingAttempts === 1 ? "" : "s"
            } left before temporary lockout).`;
          } else {
            message = "Incorrect email or password. Please try again or click 'Forgot password?'.";
          }
        } else {
          message = "Incorrect email or password. Please try again.";
        }
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        message = "Password is too weak. Please use at least 6 characters.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (lockoutSeconds > 0) {
      setError(`Please wait ${lockoutSeconds}s before trying again.`);
      return;
    }
    if (!email.trim()) {
      setError("Please type your email address above first, then click 'Forgot password?'.");
      return;
    }
    setResetLoading(true);
    setError(null);
    setSuccessMsg(null);

    const resetGuard = await callAuthGuard({
      action: "reset",
      email: email.trim(),
      honeypot,
    });
    if (!resetGuard.allowed) {
      const wait = resetGuard.retryAfterSeconds || 60;
      setLockoutSeconds(wait);
      setError(resetGuard.error || `Too many password reset requests. Wait ${wait}s.`);
      setResetLoading(false);
      return;
    }

    try {
      if (!auth) throw new Error("Firebase Auth is not initialized");
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(`Password reset link sent to ${email.trim()}! Please check your inbox or spam folder.`);
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-purple-600 selection:text-white">
      {/* Background glow halos */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center -z-10">
        <div className="w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[130px]" />
      </div>

      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-7 sm:p-8 shadow-2xl animate-fade-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="flex items-center gap-2 mb-3 group">
            <img
              src="/logo.svg"
              alt="Tap-Maker"
              className="w-11 h-11 rounded-2xl shadow-lg shadow-purple-600/30 border border-purple-500/20 object-cover group-hover:scale-105 transition-transform"
            />
            <span className="font-extrabold tracking-tight text-white text-lg">
              Tap-Maker<span className="text-purple-400">.</span>
            </span>
          </Link>

          {/* Callout Banner */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold mb-3 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Smart Digital Profiles &amp; Menus</span>
          </div>

          <h1 className="text-xl font-extrabold text-white">
            Sign In to Your Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Access your studio dashboard to manage digital profiles, menus, and NFC card links.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Anti-bot Honeypot Field (hidden from humans) */}
          <div className="hidden" aria-hidden="true">
            <label>
              Company Website
              <input
                type="text"
                name="company_website_hp"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
          </div>
          {/* Sign Up Specific Fields */}
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business / Brand Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Kaia Café, Juan Dela Cruz"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact / Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0917 123 4567"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Order Reference # / FB Name (Optional)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    placeholder="e.g. Order #1049 or your FB Messenger name"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password *
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            {mode === "signin" && (
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                >
                  {resetLoading ? "Sending reset link..." : "Forgot password?"}
                </button>
              </div>
            )}
          </div>

          {/* Confirm Password (Sign Up) */}
          {mode === "signup" && (
            <div className="animate-fade-slide-up">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Notice on Approval */}
          {mode === "signup" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                New accounts undergo quick Super Admin review to activate your Studio. Please ensure you have placed a physical card order.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>
              {lockoutSeconds > 0
                ? `Locked (${lockoutSeconds}s)`
                : loading
                ? "Signing in..."
                : "Sign In to Studio"}
            </span>
          </button>
        </form>

        {/* Client Onboarding Notice */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 text-center space-y-1">
          <p className="font-semibold text-slate-300">Need a Tap-Maker client account?</p>
          <p className="text-slate-500 leading-relaxed">
            Client accounts are created and configured exclusively by the Super Admin upon ordering your physical NFC cards.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
