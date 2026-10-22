"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Smartphone,
  Zap,
  QrCode,
  ShieldCheck,
  Palette,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronRight,
  Wifi,
  Radio,
  Share2,
  UtensilsCrossed,
  MessageCircle,
  Send,
  Mail,
  User,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, signOut } = useAuth();
  const [selectedDemo, setSelectedDemo] = useState<"aura" | "juan" | "acme">("aura");
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Compose mailto link with form data
    const subject = encodeURIComponent(`Inquiry from ${contactForm.name}`);
    const body = encodeURIComponent(`Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\n${contactForm.message}`);
    window.open(`mailto:hello@tap-maker.com?subject=${subject}&body=${body}`);
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Navigation Bar */}
      <nav className="h-20 px-6 sm:px-12 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-purple-600/30">
            T
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">Tap-Maker</span>
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block -mt-1">
              Digital Profiles &amp; Menus
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
          <button onClick={() => scrollToSection("features")} className="hover:text-purple-400 transition-colors cursor-pointer">
            Features
          </button>
          <button onClick={() => scrollToSection("digital-menu")} className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer">
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digital Menus</span>
          </button>
          <button onClick={() => scrollToSection("how-it-works")} className="hover:text-purple-400 transition-colors cursor-pointer">
            How It Works
          </button>
          <button onClick={() => scrollToSection("templates")} className="hover:text-purple-400 transition-colors cursor-pointer">
            Templates
          </button>
          <button onClick={() => scrollToSection("contact")} className="hover:text-purple-400 transition-colors cursor-pointer">
            Contact Us
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
              <Link
                href="/editor/new"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>Create Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => signOut()}
                className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-slate-900 transition-colors hidden sm:block"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login?redirect=/editor/new"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>Create Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-16 pb-24 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 w-full">
        {/* Ambient Top Glow Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Left Hero Copy */}
        <div className="flex-1 flex flex-col items-start text-left z-10">
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Smart Contactless Profile System</span>
            </div>
            <Link
              href={user ? "/editor/new" : "/login?redirect=/editor/new"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition-colors"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Sign Up or Sign In to create your profile</span>
            </Link>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            One Tap. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">
              Your Entire Digital Presence.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 font-normal mt-5 max-w-xl leading-relaxed">
            Create, brand, and publish stunning responsive digital profile hubs for your customers. Ready for smart contactless cards, instant QR codes, and direct contact sharing.
          </p>

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
              className="px-6 py-3.5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
              <span>Create Digital Menu</span>
            </Link>

            <Link
              href="/aura"
              className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Demo</span>
            </Link>
          </div>

          {!user && (
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Sign Up or Sign In to create and customize your profile</span>
            </p>
          )}

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-6 pt-10 mt-10 border-t border-slate-800/80 w-full max-w-md text-left">
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">0.2s</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Instant 1-Tap Load</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">100%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No App Required</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">1-Click</p>
              <p className="text-[11px] text-slate-400 mt-0.5">vCard Contact Save</p>
            </div>
          </div>
        </div>

        {/* Right Hero Interactive Phone Mockup */}
        <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center z-10">
          <div className="relative w-[340px] h-[640px] rounded-[44px] border-[8px] border-slate-900 bg-slate-950 shadow-[0_30px_90px_-20px_rgba(168,85,247,0.35)] overflow-hidden flex flex-col">
            {/* Top Phone Notch */}
            <div className="h-6 w-full bg-slate-950 flex items-center justify-center">
              <div className="w-20 h-4 bg-slate-900 rounded-full" />
            </div>

            {/* Embedded Live Demo Iframe / Preview */}
            <iframe
              src="/aura"
              title="Profile Live Demo"
              className="w-full flex-1 border-0 rounded-b-[36px]"
            />

            {/* Float Overlay Tap Badge */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900/90 border border-purple-500/40 backdrop-blur-md shadow-2xl flex items-center gap-2 text-xs font-bold text-purple-300 animate-bounce-slow">
              <Wifi className="w-3.5 h-3.5 text-cyan-400 rotate-90" />
              <span>Interactive 1-Tap Load</span>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 sm:px-12 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Frictionless Digital Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            From Digital Studio to Live Instant Presence
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-3">
            Tap-Maker handles the entire lifecycle: create the profile, customize brand colors, and share the unique link via QR codes or smart cards.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 w-full text-left">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold text-base mb-4">
                  01
                </div>
                <h3 className="text-base font-bold text-white">Create &amp; Brand Profile</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Choose from 3 layouts (Cyber Glow, Modern Bio, Executive Card). Pick or create custom corporate color combinations with real-time preview.
                </p>
              </div>
              <span className="text-[11px] font-mono text-purple-400 mt-4 block">
                &bull; Live 2-panel preview
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-base mb-4">
                  02
                </div>
                <h3 className="text-base font-bold text-white">Publish Unique Live URL</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Publish to a clean link like <code className="text-purple-300 font-mono">tap-maker.com/company</code>. Generate high-res vector QR codes ready for printing.
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 mt-4 block">
                &bull; Instant QR SVG export
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-base mb-4">
                  03
                </div>
                <h3 className="text-base font-bold text-white">Share &amp; Tap Anywhere</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Program the URL into any smart contactless card or share the vector QR code. When anyone taps or scans, their profile opens instantly.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 mt-4 block">
                &bull; Compatible with iPhone &amp; Android
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Menu & AI Scanner Section */}
      <section
        id="digital-menu"
        className="py-24 px-6 sm:px-12 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 border-b border-slate-800 relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-10">
          {/* Left: Text & Features */}
          <div className="flex-1 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Digital Restaurant &amp; Café Menus</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Contactless Menus. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                AI Photo Scanner Included.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-normal mt-4 leading-relaxed max-w-xl">
              Turn physical table cards and QR pucks into fast, interactive digital menus. Diners can browse categories, check prices, and search dishes without downloading an app.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 w-full">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">AI Printed Menu Scanner</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Have a paper menu or flyer? Snap a photo and Google Gemini AI automatically extracts sections, items, prices, and descriptions in seconds.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Live Kitchen Stock Control</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sold out of your lunch special? Toggle items to &apos;Sold Out&apos; in 1-click from your dashboard. Update prices anytime with zero printing costs.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <Link
                href="/editor/menu/new"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-emerald-600/25 flex items-center gap-2 active:scale-95 transition-all"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Create a Digital Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <span>Manage in Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Right: Mockup Card */}
          <div className="flex-1 w-full max-w-md flex justify-center">
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-base">
                    ☕
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Artisanal Café &amp; Roastery</h3>
                    <p className="text-[11px] text-slate-400 font-mono">tap-maker.com/menu/cafe-demo</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  Live
                </span>
              </div>

              {/* Sample Items preview */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">Iced Spanish Latte</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Popular
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Espresso, condensed milk, cinnamon dust</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">₱160.00</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">Truffle Mushroom Pasta</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Shiitake mushrooms, truffle cream sauce, parmesan</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">₱280.00</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between opacity-60">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">Matcha Basque Cheesecake</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        Sold Out
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ceremonial grade Uji matcha, burnt caramelized top</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 font-mono">₱210.00</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Scanner populated in 4 seconds</span>
                </span>
                <span className="text-emerald-400 font-semibold">Ready for Table QR &amp; Contactless Tap</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Gallery Section */}
      <section id="templates" className="py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Engineered Presets
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            3 Ready-to-Publish Layouts
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mt-3">
            Every template is fully dynamic and dynamically adapts to your customer’s corporate color scheme.
          </p>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 mt-6 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSelectedDemo("aura")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDemo === "aura"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cyber Glow (Aura)
            </button>
            <button
              onClick={() => setSelectedDemo("juan")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDemo === "juan"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Executive Card (Juan)
            </button>
            <button
              onClick={() => setSelectedDemo("acme")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDemo === "acme"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Modern Bio (Acme)
            </button>
          </div>
        </div>

        {/* Live Interactive Preview Container */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-2 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs">
              <span className="font-mono text-purple-300">
                tap-maker.com/{selectedDemo}
              </span>
              <Link
                href={`/${selectedDemo}`}
                target="_blank"
                className="flex items-center gap-1 text-slate-400 hover:text-white"
              >
                <span>Full Screen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            <iframe
              key={selectedDemo}
              src={`/${selectedDemo}`}
              title="Template Demo"
              className="w-full h-[580px] rounded-2xl border-0 bg-black"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 sm:px-12 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Features
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Everything Needed for a Commercial Digital Service
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Palette,
                title: "Theme Color Studio",
                desc: "Interactive hex color pickers, multi-stop gradient builders, and 9 industry brand combinations.",
              },
              {
                icon: Layers,
                title: "Two-Panel Live Editor",
                desc: "Instant zero-lag reactive smartphone preview updating immediately as you edit links and titles.",
              },
              {
                icon: Smartphone,
                title: "1-Tap vCard Downloads",
                desc: "Allow contacts to tap Save Contact and automatically import their details into phone contacts.",
              },
              {
                icon: QrCode,
                title: "Vector QR Generators",
                desc: "Download high-resolution SVG & PNG QR codes ready for high-end physical card printing.",
              },
              {
                icon: Zap,
                title: "Native App Deep-Links",
                desc: "Direct intent launches for Spotify, YouTube, and Instagram for faster smartphone interaction.",
              },
              {
                icon: ShieldCheck,
                title: "Draft & Reserved Route Protection",
                desc: "Guards against private drafts being viewed publicly, with strict reservation on dashboard routes.",
              },
              {
                icon: Sparkles,
                title: "AI Printed Menu Scanner",
                desc: "Powered by Google Gemini: photograph your printed food menu to automatically extract all dishes and prices.",
              },
              {
                icon: UtensilsCrossed,
                title: "Digital Restaurant Menus",
                desc: "Complete digital menu system with instant stock control, sticky category tabs, and table QR & contactless access.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-lg flex flex-col gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-24 px-6 sm:px-12 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 border-t border-slate-800 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 relative z-10">
          {/* Left: Info & Social Media */}
          <div className="flex-1 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
              <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>Get In Touch</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Let&apos;s Work Together. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">
                Reach Out Anytime.
              </span>
            </h2>

            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-md">
              Have questions about digital profiles, custom cards, or digital menus? Send us a message or reach us through our social media channels.
            </p>

            {/* Social Media Links */}
            <div className="mt-8 space-y-3 w-full max-w-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Follow Us</h3>

              <a
                href="https://facebook.com/tapmaker18"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-950/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center group-hover:bg-blue-600/25 transition-colors">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Facebook</span>
                  <p className="text-[11px] text-slate-500">@tapmaker18</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </a>

              <a
                href="https://instagram.com/tapmaker18"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/40 hover:bg-pink-950/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-600/15 border border-pink-500/25 flex items-center justify-center group-hover:bg-pink-600/25 transition-colors">
                  <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">Instagram</span>
                  <p className="text-[11px] text-slate-500">@tapmaker18</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
              </a>

              <a
                href="https://tiktok.com/@tapmaker18"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-950/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-600/15 border border-cyan-500/25 flex items-center justify-center group-hover:bg-cyan-600/25 transition-colors">
                  <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">TikTok</span>
                  <p className="text-[11px] text-slate-500">@tapmaker18</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </a>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="flex-1 w-full max-w-lg">
            <form onSubmit={handleContactSubmit} className="rounded-3xl p-6 sm:p-8 bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <Send className="w-4.5 h-4.5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Send Us a Message</h3>
                  <p className="text-[11px] text-slate-400">We&apos;ll get back to you as soon as possible</p>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>

              {/* Message Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Tell us about your project or ask any questions..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {contactSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Message Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-500 text-center pt-1">
                Or email us directly at <a href="mailto:hello@tap-maker.com" className="text-purple-400 hover:text-purple-300 font-semibold">hello@tap-maker.com</a>
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-20 px-6 sm:px-12 border-t border-slate-800/80 bg-slate-950 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Tap-Maker — Smart Digital Profile Studio. All rights reserved.</p>
        <div className="flex gap-4 mt-2 sm:mt-0 font-medium">
          <Link href="/dashboard" className="hover:text-slate-300">
            Dashboard
          </Link>
          <Link href="/login" className="hover:text-slate-300">
            Admin Login
          </Link>
          <Link href="/aura" className="hover:text-slate-300">
            Demo Profile
          </Link>
        </div>
      </footer>
    </div>
  );
}
