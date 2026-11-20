"use client";

import React, { useState, useRef, useEffect } from "react";
import { RotateCw, Move3d, Radio, RotateCcw } from "lucide-react";

export interface NfcCardAsset {
  id: "business-card" | "menu-card" | "social-review";
  name: string;
  shortLabel: string;
  badge: string;
  tagline: string;
  image: string;
  aspect: "landscape" | "square";
  accent: string;
  glow: string;
  specs: string[];
}

export const NFC_CARDS: Record<NfcCardAsset["id"], NfcCardAsset> = {
  "business-card": {
    id: "business-card",
    name: "Digital Business Card",
    shortLabel: "Business Card",
    badge: "Digital Profile · Executive",
    tagline: "Matte black smart NFC business card. Tap or scan to launch your live Tap-Maker Digital Profile and 1-click vCard.",
    image: "/products/nfc-business-card.png",
    aspect: "landscape",
    accent: "from-sky-400 via-blue-500 to-purple-500",
    glow: "rgba(56, 189, 248, 0.30)",
    specs: ["Built-in NTAG215 NFC Chip", "Dual NFC Tap + High-Contrast QR", "1-Click vCard & Social Links"],
  },
  "social-review": {
    id: "social-review",
    name: "Review & Follow Social Card",
    shortLabel: "Social Hub Card",
    badge: "Digital Profile · All-in-One",
    tagline: "Tap or scan to launch your branded Tap-Maker social hub, links, and follow buttons.",
    image: "/products/nfc-social-review.png",
    aspect: "square",
    accent: "from-purple-400 via-indigo-500 to-cyan-400",
    glow: "rgba(147, 51, 234, 0.34)",
    specs: ["Connects All Socials & Links", "Dual NFC Tap + Scannable QR", "Zero App Required (iOS & Android)"],
  },
  "menu-card": {
    id: "menu-card",
    name: "Smart Digital Menu Card",
    shortLabel: "Digital Menu Card",
    badge: "Restaurants & Cafés",
    tagline: "Paired directly with Tap-Maker Menu Studio. Update prices or toggle Sold Out anytime with zero reprinting.",
    image: "/products/nfc-menu-card.png",
    aspect: "square",
    accent: "from-emerald-400 via-teal-500 to-cyan-500",
    glow: "rgba(16, 185, 129, 0.32)",
    specs: ["Direct Tap-Maker Menu Sync", "Tap NFC or Scan High-Contrast QR", "Instant Price & Sold-Out Edits"],
  },
};

interface RotatableNfcCardProps {
  cardIds: NfcCardAsset["id"][];
  size?: "sm" | "md" | "lg";
  spinSpeed?: number;
  showControls?: boolean;
  className?: string;
}

export const RotatableNfcCard: React.FC<RotatableNfcCardProps> = ({
  cardIds,
  size = "md",
  spinSpeed = 24,
  showControls = true,
  className = "",
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [rotY, setRotY] = useState(-16);
  const [rotX, setRotX] = useState(6);
  const [autoSpin, setAutoSpin] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; startRotY: number; startRotX: number } | null>(null);
  const activeCard = NFC_CARDS[cardIds[selectedIdx] ?? cardIds[0]];
  const isLandscape = activeCard.aspect === "landscape";

  useEffect(() => {
    if (!autoSpin || isDragging) return;
    let frameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(50, now - lastTime) / 1000;
      lastTime = now;
      setRotY((prev) => (prev + dt * spinSpeed) % 360);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [autoSpin, isDragging, spinSpeed]);

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
    setRotX(Math.max(-30, Math.min(30, dragStartRef.current.startRotX - dy * 0.35)));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleReset = () => {
    setRotY(-16);
    setRotX(6);
    setAutoSpin(true);
  };

  const normalizedY = ((rotY % 360) + 360) % 360;
  const sheenOffset = Math.sin((normalizedY * Math.PI) / 180) * 55;

  const stageHeights = {
    sm: "h-[300px] sm:h-[330px]",
    md: "h-[360px] sm:h-[410px]",
    lg: "h-[410px] sm:h-[460px]",
  };

  const squareDims = {
    sm: "w-[205px] h-[205px] sm:w-[225px] sm:h-[225px]",
    md: "w-[250px] h-[250px] sm:w-[285px] sm:h-[285px]",
    lg: "w-[285px] h-[285px] sm:w-[325px] sm:h-[325px]",
  };

  const landscapeDims = {
    sm: "w-[270px] h-[150px] sm:w-[310px] sm:h-[172px]",
    md: "w-[300px] h-[167px] sm:w-[360px] sm:h-[200px]",
    lg: "w-[320px] h-[178px] sm:w-[410px] sm:h-[228px]",
  };

  const cardCornerClass = isLandscape ? "rounded-[18px] sm:rounded-[20px]" : "rounded-[34px]";

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full ${stageHeights[size]} rounded-3xl bg-slate-900/55 border border-slate-800/90 backdrop-blur-md flex items-center justify-center select-none touch-none overflow-hidden shadow-2xl ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ perspective: "1200px" }}
      >
        {/* Ambient Card Glow */}
        <div
          className="absolute w-64 h-64 rounded-full blur-[95px] pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: activeCard.glow }}
        />

        {/* Subtle Dot Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: "radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* Top Bar */}
        {showControls && (
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/70 text-[10px] font-bold text-slate-200 backdrop-blur-md">
              <Move3d className="w-3 h-3 text-cyan-400" />
              <span>{isDragging ? "Rotating 3D..." : "Drag to Rotate 360°"}</span>
            </span>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoSpin((s) => !s);
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                  autoSpin
                    ? "bg-purple-600/25 border-purple-500/50 text-purple-200"
                    : "bg-slate-950/80 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <RotateCw className={`w-3 h-3 ${autoSpin ? "animate-spin" : ""}`} />
                <span>{autoSpin ? "Spin" : "Paused"}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="p-1 rounded-full bg-slate-950/80 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Reset Angle"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* 3D Rotatable Card */}
        <div
          className={`relative ${isLandscape ? landscapeDims[size] : squareDims[size]} flex items-center justify-center transition-transform duration-75`}
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(5px)",
            }}
          >
            <img
              src={activeCard.image}
              alt={activeCard.name}
              draggable={false}
              className="w-full h-full object-contain drop-shadow-[0_24px_38px_rgba(0,0,0,0.75)] pointer-events-none"
            />
            <div
              className={`absolute inset-0 ${cardCornerClass} pointer-events-none mix-blend-overlay opacity-40`}
              style={{
                background: `linear-gradient(115deg, transparent ${35 + sheenOffset}%, rgba(255,255,255,0.65) ${
                  50 + sheenOffset
                }%, transparent ${65 + sheenOffset}%)`,
              }}
            />
          </div>

          {/* Back Face */}
          <div
            className={`absolute inset-0 ${cardCornerClass} bg-gradient-to-br from-slate-900 via-[#0d0920] to-slate-950 border border-purple-500/40 shadow-2xl flex ${
              isLandscape ? "flex-row items-center justify-between px-6 py-4 text-left gap-4" : "flex-col items-center justify-center gap-3 p-5 text-center"
            }`}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(5px)",
            }}
          >
            <div className={`${isLandscape ? "w-14 h-14" : "w-12 h-12"} rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center shadow-lg flex-shrink-0`}>
              <img src="/logo.svg" alt="Tap-Maker" className={`${isLandscape ? "w-10 h-10" : "w-9 h-9"} rounded-xl`} />
            </div>
            <div className={isLandscape ? "flex-1 min-w-0" : ""}>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-400 font-bold">
                Tap-Maker Smart NFC
              </p>
              <h4 className="text-sm font-extrabold text-white mt-0.5 truncate">{activeCard.name}</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Embedded NTAG215 chip. Reprogrammable anytime via Tap-Maker Studio.
              </p>
              {isLandscape && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>NFC + QR Verified</span>
                </div>
              )}
            </div>
            {!isLandscape && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>NFC + QR Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Floating Floor Shadow */}
        <div
          className="absolute bottom-5 w-48 h-6 rounded-full blur-2xl pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: activeCard.glow,
            transform: `translateX(${Math.sin((normalizedY * Math.PI) / 180) * -16}px) scaleX(${
              0.85 + Math.abs(Math.cos((normalizedY * Math.PI) / 180)) * 0.25
            })`,
          }}
        />
      </div>

      {/* Optional Multi-Card Pill Switcher */}
      {cardIds.length > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {cardIds.map((id, idx) => {
            const card = NFC_CARDS[id];
            const isSelected = idx === selectedIdx;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSelectedIdx(idx);
                  setRotY(-16);
                  setRotX(6);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-purple-600/20 border-purple-500/50 text-white shadow-md"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <img src={card.image} alt={card.shortLabel} className="w-5 h-4 object-contain" />
                <span>{card.shortLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
