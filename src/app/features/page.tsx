"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Palette,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { SiteNavbar } from "@/components/landing/SiteNavbar";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RotatableNfcCard } from "@/components/landing/RotatableNfcCard";

const FEATURE_ITEMS = [
  {
    icon: Palette,
    title: "Visual Design Studio & Presets",
    desc: "8 one-click designer themes, 5 button styles (Glass, Gradient, Flat, Outline, Shadow), custom cover banners, and live gradient backgrounds.",
    accent: "purple",
  },
  {
    icon: Sparkles,
    title: "AI Auto-Style Theme Generator",
    desc: "Describe your brand vibe or upload an inspiration image and let AI automatically style your entire profile or menu.",
    accent: "cyan",
  },
  {
    icon: UtensilsCrossed,
    title: "AI Printed Menu Photo Scanner",
    desc: "Photograph any printed food menu or flyer and automatically extract categories, dishes, descriptions, and prices in seconds.",
    accent: "emerald",
  },
  {
    icon: Layers,
    title: "Real-Time Split-Screen Studio",
    desc: "Zero-lag live mobile preview updates instantly as you edit bios, social buttons, menu categories, or colors.",
    accent: "purple",
  },
  {
    icon: Smartphone,
    title: "1-Tap vCard & Native Deep-Links",
    desc: "Instant Save Contact downloads plus native app deep-links for Instagram, TikTok, Spotify, YouTube, and Google Maps.",
    accent: "cyan",
  },
  {
    icon: QrCode,
    title: "Vector QR & NFC Hardware Sync",
    desc: "Export print-ready SVG/PNG QR codes or pair with Tap-Maker NTAG215 NFC cards that reprogram anytime without reprinting.",
    accent: "emerald",
  },
  {
    icon: Users,
    title: "Client Sub-Accounts & Handover",
    desc: "Create dedicated customer accounts with one-time setup links so restaurant owners can safely edit their own menus.",
    accent: "purple",
  },
  {
    icon: ShieldCheck,
    title: "Draft Protection & Analytics",
    desc: "Keep work-in-progress profiles private with draft mode, reserved route protection, and real-time view & click tracking.",
    accent: "cyan",
  },
  {
    icon: Zap,
    title: "Live Kitchen Stock Control",
    desc: "Mark menu items as Sold Out or adjust prices in one click from any phone — diners see changes immediately.",
    accent: "emerald",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      <SiteNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-14 pb-16 px-6 sm:px-12 max-w-7xl mx-auto">
          <div className="absolute top-10 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-7 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Platform Capabilities</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
                Everything Needed to Run a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-emerald-400">
                  Smart Digital Business.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-4 max-w-xl leading-relaxed">
                From AI-designed digital business profiles to live-synced restaurant menus and physical NFC cards, Tap-Maker puts every tool in one fast workspace.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <Link
                  href="/editor/new"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-purple-600/25 flex items-center gap-2 transition-all"
                >
                  <span>Create Digital Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/digital-menus"
                  className="px-6 py-3.5 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Explore Digital Menus</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <RotatableNfcCard cardIds={["business-card", "menu-card", "social-review"]} size="md" spinSpeed={22} />
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 px-6 sm:px-12 bg-slate-900/40 border-t border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURE_ITEMS.map((f) => (
                <div
                  key={f.title}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800/90 shadow-lg flex flex-col gap-3 hover:border-slate-700 transition-colors"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                      f.accent === "emerald"
                        ? "bg-emerald-600/15 border-emerald-500/30 text-emerald-400"
                        : f.accent === "cyan"
                        ? "bg-cyan-600/15 border-cyan-500/30 text-cyan-400"
                        : "bg-purple-600/15 border-purple-500/30 text-purple-400"
                    }`}
                  >
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
