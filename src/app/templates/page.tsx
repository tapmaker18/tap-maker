"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Palette, Sparkles } from "lucide-react";
import { SiteNavbar } from "@/components/landing/SiteNavbar";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RotatableNfcCard } from "@/components/landing/RotatableNfcCard";

const TEMPLATES = [
  {
    id: "aura" as const,
    name: "Cyber Glow",
    demoSlug: "aura",
    badge: "Full-Viewport Neon",
    desc: "Vibrant full-bleed gradients, glowing accents, and glassmorphic buttons ideal for creators, tech brands, and modern businesses.",
  },
  {
    id: "juan" as const,
    name: "Executive Card",
    demoSlug: "juan",
    badge: "Corporate & Luxury",
    desc: "Clean structured executive card layout designed for founders, real estate agents, consultants, and corporate teams.",
  },
  {
    id: "acme" as const,
    name: "Modern Bio",
    demoSlug: "acme",
    badge: "Minimalist Full-Viewport",
    desc: "Editorial full-viewport bio layout with crisp typography, hero cover banner support, and flexible list or 2-column grid links.",
  },
];

export default function TemplatesPage() {
  const [selectedDemo, setSelectedDemo] = useState<"aura" | "juan" | "acme">("aura");
  const activeTemplate = TEMPLATES.find((t) => t.id === selectedDemo) ?? TEMPLATES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      <SiteNavbar />

      <main className="flex-1 py-14 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Engineered Live Presets</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready-to-Publish{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">
              Digital Profile Templates.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mt-3">
            Every template adapts dynamically to your brand colors, custom hero banners, button styles, and AI Auto-Style prompts.
          </p>

          {/* Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-7 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedDemo(tpl.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDemo === tpl.id
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Split: Live Template Phone + Moving NFC Card & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Live Interactive Iframe */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-2.5 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 text-xs">
                <span className="font-mono text-purple-300">tap-maker.com/{selectedDemo}</span>
                <Link
                  href={`/${selectedDemo}`}
                  target="_blank"
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  <span>Full Screen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <iframe
                key={selectedDemo}
                src={`/${selectedDemo}`}
                title="Template Demo"
                className="w-full h-[600px] rounded-2xl border-0 bg-black"
              />
            </div>
          </div>

          {/* Right: Active Template Details + Moving NFC Card */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30">
                {activeTemplate.badge}
              </span>
              <h2 className="text-2xl font-extrabold text-white">{activeTemplate.name}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{activeTemplate.desc}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/editor/new"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Use This Template</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/${selectedDemo}`}
                  target="_blank"
                  className="px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <span>Open Live Demo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <RotatableNfcCard cardIds={["business-card", "social-review"]} size="md" spinSpeed={24} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
