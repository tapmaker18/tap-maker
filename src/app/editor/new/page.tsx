"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { saveProfile, isSlugAvailable } from "@/lib/storage";
import { Profile } from "@/lib/types";
import { Sparkles, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NewProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Must be logged in to create a profile template
      router.push("/login?redirect=/editor/new");
      return;
    }

    // Rekta sa buong profile editor:
    // Generate new draft profile directly and redirect straight to the full two-panel editor
    async function createAndRedirect() {
      try {
        const timestamp = Date.now();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        let candidateSlug = `brand-${randomNum}`;

        const available = await isSlugAvailable(candidateSlug);
        if (!available) {
          candidateSlug = `brand-${timestamp.toString().slice(-5)}`;
        }

        const newProfile: Profile = {
          id: `profile-${timestamp}`,
          slug: candidateSlug,
          name: "My Digital Profile",
          subtitle: "Official Smart Pass & Links",
          bio: "Welcome to my official digital hub. Tap any link below to connect.",
          avatarUrl: "", // Defaults to Letter Avatar
          templateId: "cyber-glow",
          status: "draft",
          verified: true,
          themeSettings: {
            preset: "custom",
            themeMode: "dark",
            bgType: "mesh",
            bgPrimary: "#0a0814",
            bgSecondary: "#131024",
            bgGradientAngle: 135,
            color1: "#a37bf7",
            color2: "#1bdfcf",
            additionalColors: [],
            accentColor: "#a37bf7",
            secondaryAccent: "#1bdfcf",
            textColor: "#f8fafc",
            textSecondaryColor: "#c3c0db",
            cardBg: "rgba(255, 255, 255, 0.04)",
            cardOpacity: 10,
            borderColor: "rgba(255, 255, 255, 0.09)",
            buttonRadius: "rounded",
            buttonStyle: "glass",
            enableGlow: true,
            enableRipples: true,
            enableMeshTexture: true,
            fontFamily: "Space Grotesk",
          },
          layoutSettings: {
            avatarShape: "circle",
            showSubtitlePill: true,
            showVerificationBadge: true,
            showFooterBranding: true,
            footerText: "Powered by Tap-Maker • Smart Digital Profile",
            sectionSpacing: "normal",
          },
          contactInfo: {
            email: user?.email || "contact@brand.com",
            phone: "",
            location: "Manila, Philippines",
            website: "https://tap-maker.com",
          },
          sections: [
            { id: `sec-${timestamp}-1`, title: "Featured Links", sectionKey: "featured", isVisible: true, sortOrder: 0 },
            { id: `sec-${timestamp}-2`, title: "Official Socials", sectionKey: "social", isVisible: true, sortOrder: 1 },
          ],
          links: [
            {
              id: `link-${timestamp}-1`,
              title: "Official Website",
              url: "https://tap-maker.com",
              platform: "website",
              category: "featured",
              badge: "FEATURED",
              isActive: true,
              isHighlighted: true,
              sortOrder: 0,
            },
            {
              id: `link-${timestamp}-2`,
              title: "Instagram",
              url: "https://instagram.com",
              platform: "instagram",
              category: "social",
              badge: null,
              isActive: true,
              isHighlighted: false,
              sortOrder: 1,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user?.uid,
        };

        const saved = await saveProfile(newProfile);
        router.replace(`/editor/${saved.id}`);
      } catch (err: any) {
        console.error("Error creating draft profile:", err);
        setInitError("Failed to initialize profile. Please try again.");
      }
    }

    createAndRedirect();
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            CHECKING STUDIO AUTHORIZATION...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign Up or Sign In to create your profile</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Kailangan mag-sign in o mag-sign up muna bago makapag-create at makapag-customize ng iyong official digital profile template.
          </p>
          <Link
            href="/login?redirect=/editor/new"
            className="mt-6 w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
          >
            <span>Sign Up or Sign In Now</span>
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
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
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
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Opening Full Profile Editor...</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-xs">
          Loading your complete two-panel workspace with live reactive preview &amp; theme controls.
        </p>
      </div>
    </div>
  );
}
