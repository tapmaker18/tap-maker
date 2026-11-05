"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Clock,
  ShieldAlert,
  MessageCircle,
  Mail,
  LogOut,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export function PendingApprovalScreen() {
  const {
    user,
    memberAccount,
    refreshMemberAccount,
    sendVerificationEmail,
    signOut,
    isApproved,
    isSuspended,
    isSuperAdminCandidate,
    adminSetupRequired,
  } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  // Auto-check approval status every 8 seconds
  useEffect(() => {
    if (isApproved) {
      router.push("/dashboard");
      return;
    }

    const interval = setInterval(async () => {
      setChecking(true);
      await refreshMemberAccount();
      setChecking(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [isApproved, refreshMemberAccount, router]);

  const handleManualCheck = async () => {
    setChecking(true);
    await refreshMemberAccount();
    setTimeout(() => setChecking(false), 800);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleSendVerification = async () => {
    setChecking(true);
    try {
      await sendVerificationEmail();
      setVerificationMessage("Verification email sent. Open it, then sign out and sign back in.");
    } catch {
      setVerificationMessage("We could not send a verification email. Please try again shortly.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-purple-600 selection:text-white">
      {/* Background glow halos */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center -z-10">
        <div className="w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-lg rounded-3xl bg-slate-900/90 border border-slate-800 p-7 sm:p-10 shadow-2xl backdrop-blur-xl animate-fade-slide-up flex flex-col items-center text-center">
        {/* Animated Brand Logo */}
        <div className="relative mb-6">
          <img
            src="/logo.svg"
            alt="Tap-Maker"
            className="w-16 h-16 rounded-2xl shadow-xl shadow-purple-600/30 border border-purple-500/30 object-cover"
          />
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${isSuspended ? "bg-red-500 shadow-red-500/50" : "bg-amber-500 shadow-amber-500/50"}`}>
            {isSuspended ? <ShieldAlert className="w-3.5 h-3.5 text-white stroke-[3]" /> : <Clock className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
          </div>
        </div>

        {/* Status Pill Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 shadow-sm ${isSuspended ? "bg-red-500/15 border border-red-500/30 text-red-300" : "bg-amber-500/15 border border-amber-500/30 text-amber-300"}`}>
          <span className={`w-2 h-2 rounded-full animate-ping ${isSuspended ? "bg-red-400" : "bg-amber-400"}`} />
          <span>{isSuspended ? "Studio Account Suspended" : "Account Pending Super Admin Approval"}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          {isSuspended ? "Your Studio Account Is Suspended" : "Hold Tight! Your Studio Account is Under Review"}
        </h1>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
          {isSuspended
            ? "Your account cannot access the Studio right now. Please contact the Super Admin if you believe this is an error."
            : <>Welcome to <span className="text-purple-400 font-semibold">Tap-Maker</span>. To protect our cloud studio and AI scanning resources, account activation is reserved for verified clients and physical smart card/tag orders.</>}
        </p>

        {isSuperAdminCandidate && !user?.emailVerified && (
          <div className="w-full p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 mb-4 text-left">
            <p className="leading-snug mb-3"><strong>Email verification is required for Super Admin access.</strong> Verify the owner email, then sign out and sign back in.</p>
            <button
              onClick={handleSendVerification}
              disabled={checking}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-colors"
            >
              Send Verification Email
            </button>
            {verificationMessage && <p className="mt-2 text-indigo-300">{verificationMessage}</p>}
          </div>
        )}

        {isSuperAdminCandidate && user?.emailVerified && adminSetupRequired && (
          <div className="w-full p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 mb-4 text-left leading-snug">
            <strong>Super Admin server setup is incomplete.</strong> Add Firebase Admin credentials to the deployment environment, then sign out and sign back in. Regular members remain protected while this is incomplete.
          </div>
        )}

        {/* Registration Info Summary Card */}
        <div className="w-full rounded-2xl bg-slate-950/70 border border-slate-800 p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Business / Brand:</span>
            <span className="text-white font-bold">{memberAccount?.businessName || "Registered Client"}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Account Email:</span>
            <span className="text-slate-300 font-mono text-[11px]">{user?.email}</span>
          </div>
          {memberAccount?.phone && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Contact Phone:</span>
              <span className="text-slate-300 font-mono text-[11px]">{memberAccount.phone}</span>
            </div>
          )}
          {memberAccount?.orderRef && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Order Reference:</span>
              <span className="text-purple-300 font-semibold">{memberAccount.orderRef}</span>
            </div>
          )}
        </div>

        {/* Expedite Instructions */}
        <div className="w-full p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 mb-6 flex items-start gap-2.5 text-left">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>{isSuspended ? "Need help restoring access?" : "Did you place an order recently?"}</strong> Send a quick message to Adrian on Facebook or email so we can review your account.
          </p>
        </div>

        {/* Quick Contact Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <a
            href="https://facebook.com/tapmaker18"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <span>Message on FB</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
          </a>
          <a
            href={`mailto:hello@tap-maker.com?subject=Account%20Approval%20Request%20-%20${encodeURIComponent(memberAccount?.businessName || user?.email || "")}&body=Hi%20Adrian,%0A%0APlease%20approve%20my%20Tap-Maker%20account:%0AEmail:%20${encodeURIComponent(user?.email || "")}%0ABusiness:%20${encodeURIComponent(memberAccount?.businessName || "")}%0AOrder%20Ref:%20${encodeURIComponent(memberAccount?.orderRef || "")}`}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Email Admin</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
          </a>
        </div>

        {/* Bottom Status Check & Sign Out */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin text-purple-400" : ""}`} />
            <span>{checking ? "Checking..." : "Check Status Now"}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
