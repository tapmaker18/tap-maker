"use client";

import React, { useState, useRef, useEffect } from "react";
import { RotateCw, Move3d, Sparkles, Radio, QrCode, CheckCircle2, RotateCcw } from "lucide-react";

interface NfcProduct {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  image: string;
  accent: string;
  glow: string;
  specs: string[];
}

const NFC_PRODUCTS: NfcProduct[] = [
  {
    id: "google-stand",
    name: "Google Review NFC Stand",
    badge: "Bestseller · Countertop",
    tagline: "Freestanding matte-black acrylic display. Customers tap or scan to leave a 5-star Google review in seconds.",
    image: "/products/nfc-google-stand.png",
    accent: "from-amber-400 via-orange-500 to-rose-500",
    glow: "rgba(245, 158, 11, 0.32)",
    specs: ["Built-in NTAG215 NFC Chip", "High-Contrast Scannable QR", "Scratch-Resistant Acrylic Stand"],
  },
  {
    id: "google-sticker",
    name: "Google Review Tap Sticker",
    badge: "Peel & Stick · Compact",
    tagline: "Ultra-thin waterproof NFC + QR adhesive tag for reception desks, cashier counters, salon mirrors, and tables.",
    image: "/products/nfc-google-sticker.png",
    accent: "from-sky-400 via-blue-500 to-indigo-500",
    glow: "rgba(56, 189, 248, 0.34)",
    specs: ["3M Industrial Adhesive Backing", "Works on Glass, Wood & Metal*", "Zero App Required (iOS & Android)"],
  },
  {
    id: "menu-plaque",
    name: "Smart Digital Menu Plaque",
    badge: "Restaurants & Cafés",
    tagline: "Paired directly with Tap-Maker Menu Studio. Update prices or mark items Sold Out anytime without reprinting.",
    image: "/products/nfc-menu-plaque.png",
    accent: "from-emerald-400 via-teal-500 to-cyan-500",
    glow: "rgba(16, 185, 129, 0.32)",
    specs: ["Direct Tap-Maker Menu Sync", "Instant Price & Sold-Out Edits", "Durable Glossy Table Plaque"],
  },
];

export const InteractiveNfcShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotY, setRotY] = useState(-14);
  const [rotX, setRotX] = useState(6);
  const [autoSpin, setAutoSpin] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; startRotY: number; startRotX: number } | null>(null);
  const activeProduct = NFC_PRODUCTS[activeIndex];

  // Smooth gentle auto-oscillation / 360 spin when not dragging
  useEffect(() => {
    if (!autoSpin || isDragging) return;
    let frameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(50, now - lastTime) / 1000;
      lastTime = now;
      setRotY((prev) => (prev + dt * 26) % 360);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [autoSpin, isDragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setAutoSpin(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotY: rotY,
      startRotX: rotX,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setRotY(dragStartRef.current.startRotY + dx * 0.65);
    setRotX(Math.max(-32, Math.min(32, dragStartRef.current.startRotX - dy * 0.35)));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleReset = () => {
    setRotY(-14);
    setRotX(6);
    setAutoSpin(true);
  };

  // Normalize angle to determine dynamic specular sheen position
  const normalizedY = ((rotY % 360) + 360) % 360;
  const sheenOffset = Math.sin((normalizedY * Math.PI) / 180) * 55;

  return (
    <section
      id="hardware"
      className="relative py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full overflow-hidden"
    >
      {/* Ambient Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full blur-[130px] pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: activeProduct.glow }}
      />

      <div className="relative z-10 flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
          <Move3d className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive 3D Smart Hardware</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Physical NFC Cards &amp; Stands.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-emerald-400">
            Drag to Rotate 360°.
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mt-3 leading-relaxed">
          Every Tap-Maker card, countertop stand, and menu plaque connects straight to your live digital studio.
          Grab and spin any product below to inspect it in 3D.
        </p>
      </div>

      {/* Main Split Interactive 3D Stage */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left/Center: Interactive 3D Rotatable Stage */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`relative w-full h-[420px] sm:h-[480px] rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md flex items-center justify-center select-none touch-none overflow-hidden shadow-2xl ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ perspective: "1200px" }}
          >
            {/* Subtle Tech Grid Inside Stage */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Top Stage Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/70 text-[11px] font-bold text-slate-200 backdrop-blur-md">
                <Move3d className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isDragging ? "Rotating 3D..." : "Drag to Rotate 360°"}</span>
              </span>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoSpin((s) => !s);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    autoSpin
                      ? "bg-purple-600/25 border-purple-500/50 text-purple-200"
                      : "bg-slate-950/80 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  <RotateCw className={`w-3 h-3 ${autoSpin ? "animate-spin" : ""}`} />
                  <span>{autoSpin ? "Auto-Spin On" : "Auto-Spin"}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="p-1.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset 3D Angle"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3D Rotatable Product Container */}
            <div
              className="relative w-[270px] sm:w-[320px] h-[320px] sm:h-[360px] flex items-center justify-center transition-transform duration-75"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              }}
            >
              {/* FRONT FACE (Real Background-Removed Transparent Product PNG) */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "translateZ(6px)",
                }}
              >
                <img
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  draggable={false}
                  className="max-w-full max-h-full object-contain drop-shadow-[0_26px_42px_rgba(0,0,0,0.75)] pointer-events-none"
                />
                {/* Subtle Moving Gloss Reflection */}
                <div
                  className="absolute inset-4 rounded-3xl pointer-events-none mix-blend-overlay opacity-40"
                  style={{
                    background: `linear-gradient(115deg, transparent ${35 + sheenOffset}%, rgba(255,255,255,0.65) ${
                      50 + sheenOffset
                    }%, transparent ${65 + sheenOffset}%)`,
                  }}
                />
              </div>

              {/* BACK FACE (Branded Tap-Maker Smart NFC Backplate when spun 180°) */}
              <div
                className="absolute inset-4 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d0920] to-slate-950 border border-purple-500/40 shadow-2xl flex flex-col items-center justify-center gap-4 p-6 text-center"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg) translateZ(6px)",
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center shadow-lg">
                  <img src="/logo.svg" alt="Tap-Maker" className="w-12 h-12 rounded-xl" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold">
                    Tap-Maker Smart NFC
                  </p>
                  <h4 className="text-base font-extrabold text-white mt-1">{activeProduct.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Embedded NTAG215 contactless chip. Reprogrammable anytime via Tap-Maker Studio.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>NFC + QR Verified</span>
                </div>
              </div>
            </div>

            {/* Soft Floating Floor Shadow */}
            <div
              className="absolute bottom-7 w-56 h-7 rounded-full blur-2xl pointer-events-none transition-all duration-300"
              style={{
                backgroundColor: activeProduct.glow,
                transform: `translateX(${Math.sin((normalizedY * Math.PI) / 180) * -18}px) scaleX(${
                  0.85 + Math.abs(Math.cos((normalizedY * Math.PI) / 180)) * 0.25
                })`,
              }}
            />
          </div>
        </div>

        {/* Right: Product Switcher & Specs */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Product Selector Cards */}
          <div className="flex flex-col gap-2.5">
            {NFC_PRODUCTS.map((prod, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setRotY(-14);
                    setRotX(6);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900/95 border-purple-500/60 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/40"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center flex-shrink-0">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${prod.accent} text-slate-950 mb-1`}
                    >
                      {prod.badge}
                    </span>
                    <h3 className="text-sm font-extrabold text-white truncate">{prod.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{prod.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Product Specs Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Included Hardware Specs</span>
              </span>
              <QrCode className="w-4 h-4 text-cyan-400" />
            </div>
            <ul className="space-y-2">
              {activeProduct.specs.map((spec) => (
                <li key={spec} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
