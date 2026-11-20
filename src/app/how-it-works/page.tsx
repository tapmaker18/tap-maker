"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  QrCode,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { SiteNavbar } from "@/components/landing/SiteNavbar";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RotatableNfcCard } from "@/components/landing/RotatableNfcCard";

export default function HowItWorksPage() {
  const [activeTrack, setActiveTrack] = useState<"profile" | "menu">("profile");

  const profileSteps = [
    {
      num: "01",
      title: "Create Your Profile & Choose a Layout",
      desc: "Open the Tap-Maker Studio and pick Cyber Glow, Modern Bio, or Executive Card. Enter your display name, role, bio, social links, and contact details.",
      highlights: ["Live 2-panel real-time mobile preview", "1-click vCard contact file auto-generated"],
    },
    {
      num: "02",
      title: "Customize Visually or Use AI Auto-Style",
      desc: "Pick from 8 curated theme presets, upload a top cover banner, choose 2-column grid or list buttons — or describe your brand vibe in AI Auto-Style.",
      highlights: ["5 distinct button styles (Glass, Gradient, Flat, Outline, Shadow)", "Optional inspiration photo color extraction"],
    },
    {
      num: "03",
      title: "Publish Live URL & Pair with Your NFC Card",
      desc: "Publish to a clean link like tap-maker.com/yourbrand, export your vector QR code, and tap your Tap-Maker NFC card to share instantly.",
      highlights: ["Works on iPhone & Android with zero app install", "Update your links anytime without replacing the card"],
    },
  ];

  const menuSteps = [
    {
      num: "01",
      title: "Upload a Photo of Your Printed Menu",
      desc: "Start a new Digital Menu and launch the AI Menu Photo Scanner. Upload a photo of your existing menu and extract every category, item, and price in seconds.",
      highlights: ["Append to existing items or replace all", "Supports currencies, descriptions & Popular tags"],
    },
    {
      num: "02",
      title: "Brand Your Menu & Hand Over to Staff",
      desc: "Customize store info, contact buttons, and theme colors. Optionally create a Client Account so restaurant owners can toggle Sold Out items from their phone.",
      highlights: ["1-click Sold Out & price updates", "Full edit changelog for every menu"],
    },
    {
      num: "03",
      title: "Deploy Smart Menu Cards to Every Table",
      desc: "Link your live menu URL to our waterproof Smart Digital Menu NFC Cards. Diners tap or scan the QR right from their table.",
      highlights: ["Zero menu reprinting costs ever again", "Loads in 0.2s in Safari & Chrome"],
    },
  ];

  const steps = activeTrack === "profile" ? profileSteps : menuSteps;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      <SiteNavbar />

      <main className="flex-1">
        {/* Header */}
        <section className="pt-14 pb-12 px-6 sm:px-12 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Setup Guide</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How Tap-Maker Works.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-emerald-400">
              From Studio to Tap.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-3 leading-relaxed">
            Switch between the Digital Profile and Digital Menu walkthroughs below to see the exact workflow paired with each physical NFC card.
          </p>

          {/* Track Switcher */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 mt-8 shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTrack("profile")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTrack === "profile"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Digital Profile Tutorial</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTrack("menu")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTrack === "menu"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Digital Menu Tutorial</span>
            </button>
          </div>
        </section>

        {/* Steps + Matching Moving NFC Card */}
        <section className="py-10 pb-24 px-6 sm:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: 3 Detailed Steps */}
            <div className="lg:col-span-7 space-y-5">
              {steps.map((step) => (
                <div
                  key={step.num + activeTrack}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row gap-5"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base flex-shrink-0 border ${
                      activeTrack === "menu"
                        ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                        : "bg-purple-600/20 border-purple-500/30 text-purple-400"
                    }`}
                  >
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-extrabold text-white">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">{step.desc}</p>
                    <ul className="mt-3.5 space-y-1.5">
                      {step.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              activeTrack === "menu" ? "text-emerald-400" : "text-purple-400"
                            }`}
                          />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Sticky Matching Moving NFC Card + CTA */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col gap-5">
              <RotatableNfcCard
                key={activeTrack}
                cardIds={activeTrack === "profile" ? ["business-card", "social-review"] : ["menu-card"]}
                size="md"
                spinSpeed={24}
              />

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ready to try it yourself?</span>
                  </span>
                  <QrCode className="w-4 h-4 text-slate-400" />
                </div>
                <Link
                  href={activeTrack === "profile" ? "/editor/new" : "/editor/menu/new"}
                  className={`w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
                    activeTrack === "menu"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25"
                  }`}
                >
                  <span>{activeTrack === "profile" ? "Create Digital Profile" : "Create Digital Menu"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
