"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  Palette,
  QrCode,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  Wifi,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SiteNavbar } from "@/components/landing/SiteNavbar";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RotatableNfcCard } from "@/components/landing/RotatableNfcCard";

export default function HomePage() {
  const { user } = useAuth();
  const [heroPreview, setHeroPreview] = useState<"profile" | "menu">("profile");
  const [tutorialTrack, setTutorialTrack] = useState<"profile" | "menu">("profile");

  const profileSteps = [
    {
      num: "01",
      title: "Build & Style with AI",
      desc: "Pick Cyber Glow, Modern Bio, or Executive Card — or type a vibe prompt in AI Auto-Style to transform your colors, cover banner, and buttons in seconds.",
      tag: "Live 2-panel studio",
      color: "purple",
    },
    {
      num: "02",
      title: "Publish Your Unique Link",
      desc: "Claim a clean URL like tap-maker.com/yourbrand and download a crisp vector QR code ready for cards, stands, or flyers.",
      tag: "Instant SVG & PNG QR",
      color: "cyan",
    },
    {
      num: "03",
      title: "Tap NFC Card & Connect",
      desc: "Pair with your Tap-Maker Digital Business Card. One tap opens your full digital profile, social links, and 1-click vCard contact save.",
      tag: "iPhone & Android ready",
      color: "emerald",
    },
  ];

  const menuSteps = [
    {
      num: "01",
      title: "Scan Your Printed Menu",
      desc: "Snap a photo of your existing paper menu or flyer. Our AI Menu Scanner extracts categories, dishes, descriptions, and prices automatically.",
      tag: "AI extraction in seconds",
      color: "emerald",
    },
    {
      num: "02",
      title: "Customize & Control Stock",
      desc: "Match your restaurant’s branding, toggle Sold Out items in 1 click, and update prices anytime without reprinting a single page.",
      tag: "Live kitchen sync",
      color: "cyan",
    },
    {
      num: "03",
      title: "Place Smart Menu Cards on Tables",
      desc: "Diners tap their phone or scan the QR on your table card to browse categories and prices instantly — zero app download required.",
      tag: "Zero reprinting costs",
      color: "purple",
    },
  ];

  const activeSteps = tutorialTrack === "profile" ? profileSteps : menuSteps;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      <SiteNavbar />

      {/* =====================================================================
          HERO: UNIFIED DIGITAL PROFILES + DIGITAL MENUS MARKETING
      ====================================================================== */}
      <header className="relative pt-10 sm:pt-16 pb-20 sm:pb-28 px-4 sm:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 w-full">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full filter blur-[110px] pointer-events-none" />
        <div className="absolute top-24 right-1/4 w-80 h-80 bg-emerald-500/12 rounded-full filter blur-[110px] pointer-events-none" />

        {/* Left Unified Copy */}
        <div className="flex-1 flex flex-col items-start text-left z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 text-purple-200 text-xs font-bold mb-5 shadow-lg">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>All-in-One NFC Digital Profiles &amp; Smart Menus</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            One Tap. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-emerald-400">
              Digital Profiles &amp; Smart Menus.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 font-normal mt-5 max-w-xl leading-relaxed">
            The complete contactless studio for modern businesses and restaurants. Launch branded{" "}
            <strong className="text-slate-200 font-semibold">Digital Profiles</strong> for networking and reviews, plus{" "}
            <strong className="text-emerald-300 font-semibold">AI-Powered Digital Menus</strong> for dining tables — all managed from one dashboard.
          </p>

          {/* Dual Product Mini-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 w-full max-w-xl">
            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/25 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white">Digital Profiles &amp; Business Cards</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Social hubs, 1-click vCard save, AI Auto-Style &amp; smart NFC business cards.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white">Smart Digital Menus</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  AI printed menu scanner, live Sold-Out toggles &amp; instant price updates.
                </p>
              </div>
            </div>
          </div>

          {/* Dual Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8 w-full sm:w-auto flex-wrap">
            <Link
              href={user ? "/editor/new" : "/login?redirect=/editor/new"}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Create Digital Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={user ? "/editor/menu/new" : "/login?redirect=/editor/menu/new"}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Create Digital Menu</span>
            </Link>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-6 pt-8 mt-9 border-t border-slate-800/80 w-full max-w-md text-left">
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">0.2s</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Instant 1-Tap Load</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">100%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No App Required</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">2-in-1</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Profiles &amp; Menus</p>
            </div>
          </div>
        </div>

        {/* Right Interactive Dual Preview Phone (Toggle Profile <-> Menu) */}
        <div className="flex-1 w-full max-w-md lg:max-w-none flex flex-col items-center gap-4 z-10">
          {/* Interactive Switcher Pill */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <button
              type="button"
              onClick={() => setHeroPreview("profile")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                heroPreview === "profile"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Digital Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setHeroPreview("menu")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                heroPreview === "menu"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Digital Menu</span>
            </button>
          </div>

          {/* Phone Frame */}
          <div className="relative w-[330px] h-[590px] rounded-[44px] border-[8px] border-slate-900 bg-slate-950 shadow-[0_30px_90px_-20px_rgba(168,85,247,0.35)] overflow-hidden flex flex-col">
            <div className="h-6 w-full bg-slate-950 flex items-center justify-center flex-shrink-0">
              <div className="w-20 h-4 bg-slate-900 rounded-full" />
            </div>

            {heroPreview === "profile" ? (
              <iframe
                src="/aura"
                title="Digital Profile Live Demo"
                className="w-full flex-1 border-0 rounded-b-[36px]"
              />
            ) : (
              <div className="flex-1 bg-slate-950 p-4 flex flex-col gap-3 overflow-y-auto text-left">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/90 to-slate-900 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-base">
                        ☕
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white">Artisanal Café &amp; Bistro</p>
                        <p className="text-[10px] text-emerald-300 font-mono">tap-maker.com/menu/cafe</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 text-[10px] font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white">Signature Coffee</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">Pasta</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">Pastries</span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Iced Spanish Latte</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Popular</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Espresso, condensed milk, cinnamon</p>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">₱160</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">Truffle Mushroom Pasta</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Shiitake, truffle cream, parmesan</p>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">₱280</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">Cold Brew Tonic</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Single-origin Ethiopian roast, citrus</p>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">₱175</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex items-center justify-between opacity-60">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Matcha Cheesecake</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">Sold Out</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ceremonial Uji matcha, burnt top</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 font-mono">₱210</span>
                  </div>
                </div>

                <div className="mt-auto p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Scanned via AI Menu Scanner
                  </span>
                  <Link href="/digital-menus" className="underline hover:text-white">
                    Explore
                  </Link>
                </div>
              </div>
            )}

            {/* Floating Tap Badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-purple-500/40 backdrop-blur-md shadow-2xl flex items-center gap-1.5 text-[11px] font-bold text-purple-200 whitespace-nowrap">
              <Wifi className="w-3.5 h-3.5 text-cyan-400 rotate-90" />
              <span>{heroPreview === "profile" ? "Live Interactive Profile" : "Live Interactive Menu"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          SECTION 2: DIGITAL PROFILE SHOWCASE + MOVING NFC PROFILE/REVIEW CARD
      ====================================================================== */}
      <section className="py-20 px-6 sm:px-12 bg-slate-900/40 border-y border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left: Digital Profile Showcase Copy */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span>Digital Profile Showcase</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Your Brand, Links &amp; Reviews.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">
                Always One Tap Away.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-xl">
              Replace paper business cards with a living digital hub. Pair your profile with our{" "}
              <strong className="text-white">Digital Business Card</strong> or{" "}
              <strong className="text-purple-300">Review &amp; Follow Social Card</strong> so clients can save your contact and connect across all your socials in seconds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-7 w-full">
              {[
                {
                  icon: Sparkles,
                  title: "AI Auto-Style Designer",
                  desc: "Generate custom palettes, hero banners, and button styles from a single text prompt.",
                },
                {
                  icon: QrCode,
                  title: "Dual NFC + Vector QR",
                  desc: "Works with every iPhone and Android via contactless tap or instant camera scan.",
                },
                {
                  icon: Layers,
                  title: "3 Full-Viewport Themes",
                  desc: "Switch anytime between Cyber Glow, Modern Bio, and Executive Card layouts.",
                },
                {
                  icon: ShieldCheck,
                  title: "1-Click vCard & Analytics",
                  desc: "Track profile views and link clicks in real time from your studio dashboard.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link
                href={user ? "/editor/new" : "/login?redirect=/editor/new"}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-purple-600/25 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Build Digital Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/templates"
                className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <Palette className="w-4 h-4 text-purple-400" />
                <span>Browse Templates</span>
              </Link>
            </div>
          </div>

          {/* Right: Moving & 360° Draggable Digital Business Card & Social Hub Card */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <RotatableNfcCard cardIds={["business-card", "social-review"]} size="lg" spinSpeed={24} />
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: DIGITAL MENU SHOWCASE + MOVING SMART MENU NFC CARD
      ====================================================================== */}
      <section className="py-24 px-6 sm:px-12 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-emerald-500/12 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left: Moving & 360° Draggable Smart Digital Menu Card */}
          <div className="lg:col-span-6 order-2 lg:order-1 flex flex-col items-center">
            <RotatableNfcCard cardIds={["menu-card"]} size="lg" spinSpeed={22} />
          </div>

          {/* Right: Digital Menu Showcase Copy */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
              <span>Digital Menu Showcase</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Smart Table Menus.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                AI Photo Scanner Included.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-xl">
              Place our contactless <strong className="text-emerald-300">Smart Digital Menu Card</strong> on every table. Diners tap or scan to browse your full menu, while your staff updates prices or marks dishes Sold Out in real time.
            </p>

            <div className="space-y-3 mt-7 w-full">
              {[
                {
                  title: "AI Printed Menu Photo Scanner",
                  desc: "Photograph your existing paper menu and extract all categories, dishes, and prices in seconds.",
                },
                {
                  title: "1-Click Live Kitchen Stock Control",
                  desc: "Toggle any item to Sold Out or adjust prices instantly — zero reprinting costs.",
                },
                {
                  title: "Dedicated Client Handover Portal",
                  desc: "Give restaurant owners their own simple mobile editor to manage their menu safely.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link
                href={user ? "/editor/menu/new" : "/login?redirect=/editor/menu/new"}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Create Digital Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/digital-menus"
                className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <span>See Full Menu Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: INTERACTIVE QUICK TUTORIAL (PROFILE OR MENU TRACK)
      ====================================================================== */}
      <section className="py-20 px-6 sm:px-12 bg-slate-900/45 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Step-by-Step Tutorial
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Go Live in Under 3 Minutes
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-3">
            Choose what you want to launch below to see how fast you can go from studio to physical NFC tap.
          </p>

          {/* Track Toggle */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 mt-7">
            <button
              type="button"
              onClick={() => setTutorialTrack("profile")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tutorialTrack === "profile"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Digital Profile Guide</span>
            </button>
            <button
              type="button"
              onClick={() => setTutorialTrack("menu")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tutorialTrack === "menu"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Digital Menu Guide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 w-full text-left">
            {activeSteps.map((step) => (
              <div
                key={step.num + tutorialTrack}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base mb-4 border ${
                      step.color === "emerald"
                        ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                        : step.color === "cyan"
                        ? "bg-cyan-600/20 border-cyan-500/30 text-cyan-400"
                        : "bg-purple-600/20 border-purple-500/30 text-purple-400"
                    }`}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{step.desc}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-300 mt-5 block">
                  &bull; {step.tag}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/how-it-works"
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <span>View Full Interactive Guide</span>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </Link>
            <Link
              href="/features"
              className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Explore All Features</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: FINAL CTA BAND
      ====================================================================== */}
      <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto w-full">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-purple-950/60 via-slate-900 to-emerald-950/50 border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Launch Your Smart NFC Presence?
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Create your digital profile or restaurant menu today, or reach out to order custom-printed Tap-Maker NFC cards for your business.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? "/dashboard" : "/login?redirect=/dashboard"}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white text-sm font-bold transition-colors"
            >
              Order NFC Cards
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
