"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  QrCode,
  Sparkles,
  Store,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { SiteNavbar } from "@/components/landing/SiteNavbar";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RotatableNfcCard } from "@/components/landing/RotatableNfcCard";

export default function DigitalMenusPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      <SiteNavbar />

      <main className="flex-1">
        {/* Hero with Moving Smart Digital Menu NFC Card */}
        <section className="relative pt-14 pb-20 px-6 sm:px-12 max-w-7xl mx-auto overflow-hidden">
          <div className="absolute top-12 right-1/4 w-96 h-96 bg-emerald-500/12 rounded-full blur-[120px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tap-Maker Digital Menu Studio</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
                Contactless Menus.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  AI Photo Scanner Included.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-xl">
                Turn every dining table into an instant digital menu experience. Snap a photo of your printed menu to import every dish automatically, then link it to our contactless Smart Menu NFC Cards.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link
                  href="/editor/menu/new"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Create a Digital Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-bold transition-colors"
                >
                  Order Table NFC Cards
                </Link>
              </div>
            </div>

            {/* Moving & 360° Draggable Menu Card */}
            <div className="lg:col-span-6">
              <RotatableNfcCard cardIds={["menu-card"]} size="lg" spinSpeed={22} />
            </div>
          </div>
        </section>

        {/* Live Menu Preview + Capabilities */}
        <section className="py-20 px-6 sm:px-12 bg-slate-900/45 border-y border-slate-800">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Live Interactive Menu Mockup */}
            <div className="lg:col-span-5">
              <div className="w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
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

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">Iced Spanish Latte</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          Popular
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Espresso, condensed milk, cinnamon dust</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">₱160.00</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white">Truffle Mushroom Pasta</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Shiitake mushrooms, truffle cream sauce, parmesan</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">₱280.00</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between opacity-60">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">Matcha Basque Cheesecake</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          Sold Out
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ceremonial Uji matcha, burnt caramelized top</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 font-mono">₱210.00</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Populated by AI Scanner in 4s</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">NFC + QR Ready</span>
                </div>
              </div>
            </div>

            {/* Menu Feature Breakdown */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Camera,
                  title: "AI Menu Photo Scanner",
                  desc: "Upload a photo of your printed menu. Append to existing items or replace all categories automatically.",
                },
                {
                  icon: Zap,
                  title: "Instant Sold-Out & Price Edits",
                  desc: "Update availability or seasonal prices in 1 tap. Every table card updates live with zero reprinting.",
                },
                {
                  icon: Store,
                  title: "Restaurant Owner Handover",
                  desc: "Give your café or restaurant client their own secure Quick-Edit portal to manage daily specials.",
                },
                {
                  icon: QrCode,
                  title: "Table NFC Tap + High-Contrast QR",
                  desc: "Guests can tap their smartphone or scan the QR code — opens in Safari or Chrome in 0.2 seconds.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Checklist CTA */}
        <section className="py-16 px-6 sm:px-12 max-w-5xl mx-auto text-center">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/25 flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to Digitize Your Restaurant Menu?
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                No App Download Needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                AI Photo Import Included
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Unlimited Price Updates
              </span>
            </div>
            <Link
              href="/editor/menu/new"
              className="mt-6 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition-all"
            >
              <span>Launch Menu Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
