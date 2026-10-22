"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createEmptyMenu, saveMenu, isMenuSlugAvailable } from "@/lib/menuStorage";
import { UtensilsCrossed, Lock, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NewMenuPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login?redirect=/editor/menu/new");
      return;
    }

    async function initializeMenu() {
      try {
        const timestamp = Date.now();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        let candidateSlug = `cafe-${randomNum}`;

        const available = await isMenuSlugAvailable(candidateSlug);
        if (!available) {
          candidateSlug = `menu-${timestamp.toString().slice(-5)}`;
        }

        const newMenu = createEmptyMenu(user?.uid || "guest");
        newMenu.id = `menu_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
        newMenu.slug = candidateSlug;
        newMenu.businessName = "My Café & Kitchen";
        newMenu.tagline = "Fresh Artisanal Brews & Handcrafted Dishes";

        const saved = await saveMenu(newMenu);
        router.replace(`/editor/menu/${saved.id}`);
      } catch (err: any) {
        console.error("Error creating draft menu:", err);
        setInitError("Failed to initialize menu. Please try again.");
      }
    }

    initializeMenu();
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            CHECKING AUTHORIZATION...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign in to create your digital menu</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Please log in or create an account to start building and managing your restaurant / café digital menu.
          </p>
          <Link
            href="/login?redirect=/editor/menu/new"
            className="mt-6 w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-6 text-center shadow-2xl">
          <p className="text-sm text-red-400 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Setting Up Your Digital Menu Workspace...</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-xs">
          Creating initial categories, items, and AI scanner connection.
        </p>
      </div>
    </div>
  );
}
