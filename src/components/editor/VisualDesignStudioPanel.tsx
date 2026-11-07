"use client";

import React, { useState } from "react";
import {
  Sliders,
  Sparkles,
  Palette,
  Type,
  Layers,
  Tag,
  Sun,
  Contrast,
  Droplet,
  Eye,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  ThemeSettings,
  ImageFilterPreset,
  BgPatternType,
  GlassBlurIntensity,
} from "@/lib/types";

interface VisualDesignStudioPanelProps {
  themeSettings: ThemeSettings;
  onChange: (patch: Partial<ThemeSettings>) => void;
  onOpenAiAutoStyle?: () => void;
}

export const VisualDesignStudioPanel: React.FC<VisualDesignStudioPanelProps> = ({
  themeSettings,
  onChange,
  onOpenAiAutoStyle,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"filters" | "atmosphere" | "typography" | "badges">(
    "filters"
  );

  const filterPresets: {
    id: ImageFilterPreset;
    name: string;
    desc: string;
    previewClass: string;
  }[] = [
    { id: "none", name: "Natural", desc: "Original photo colors", previewClass: "" },
    { id: "vibrant", name: "Vibrant", desc: "Punchy, saturated & clear", previewClass: "saturate-150 contrast-110" },
    { id: "warm", name: "Warm Cafe", desc: "Golden, cozy tones", previewClass: "sepia-[.25] saturate-125" },
    { id: "noir", name: "Noir B&W", desc: "Classic monochrome executive", previewClass: "grayscale contrast-125" },
    { id: "cyber", name: "Cyber Neon", desc: "Electric cool ambiance", previewClass: "hue-rotate-15 contrast-125 brightness-110" },
    { id: "vintage", name: "Vintage Film", desc: "Muted retro look", previewClass: "sepia-[.4] contrast-95 brightness-95" },
    { id: "cool", name: "Cool Crisp", desc: "Clean modern cyan tint", previewClass: "hue-rotate-[-15deg] saturate-110" },
  ];

  const fontOptions: { id: ThemeSettings["fontFamily"]; name: string; sample: string }[] = [
    { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans", sample: "Modern & Crisp" },
    { id: "Playfair Display", name: "Playfair Display (Serif)", sample: "Luxury & Editorial" },
    { id: "Outfit", name: "Outfit", sample: "Friendly & Clean" },
    { id: "Space Grotesk", name: "Space Grotesk", sample: "Tech & Cyber" },
    { id: "Inter", name: "Inter", sample: "Classic & Minimal" },
  ];

  const patternOptions: { id: BgPatternType; name: string }[] = [
    { id: "none", name: "None (Clean)" },
    { id: "grain", name: "Subtle Film Grain" },
    { id: "dots", name: "Dot Matrix" },
    { id: "grid", name: "Architectural Grid" },
    { id: "mesh", name: "Radial Light Mesh" },
  ];

  const glassBlurOptions: { id: GlassBlurIntensity; name: string }[] = [
    { id: "none", name: "Solid" },
    { id: "sm", name: "Subtle (sm)" },
    { id: "md", name: "Medium Glass (md)" },
    { id: "lg", name: "Deep Frosted (lg)" },
  ];

  const quickBadgeChips = ["VIP", "Bestseller", "New", "Promo", "Verified", "Open Now", "Chef's Special"];

  const currentBrightness = themeSettings.imageBrightness ?? 100;
  const currentContrast = themeSettings.imageContrast ?? 100;
  const currentSaturation = themeSettings.imageSaturation ?? 100;

  return (
    <div className="flex flex-col gap-5 text-slate-200">
      {/* AI Auto-Stylist Magic Banner */}
      {onOpenAiAutoStyle && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-3 shadow-lg shadow-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>AI Auto-Style &amp; Theme Matcher</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Scan your logo or store photo for an instant matching palette &amp; layout.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAiAutoStyle}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 flex-shrink-0 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Style</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Visual Design Studio</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Photo editor-grade styling tools: image filters, glassmorphism, textures, and custom badges.
        </p>
      </div>

      {/* Sub Tabs Toolstrip */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab("filters")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === "filters"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Photo Filters</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("atmosphere")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === "atmosphere"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Atmosphere</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("typography")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === "typography"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Typography</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("badges")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === "badges"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Badges</span>
        </button>
      </div>

      {/* 1. Photo Filters & Image Tuning */}
      {activeSubTab === "filters" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Preset Chips */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">
              1-Click Photo Filter Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filterPresets.map((preset) => {
                const isSelected = (themeSettings.imageFilter || "none") === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange({ imageFilter: preset.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? "border-purple-500 bg-purple-600/15 text-white ring-1 ring-purple-500"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Precision Sliders */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Fine-Tuning Controls</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    imageBrightness: 100,
                    imageContrast: 100,
                    imageSaturation: 100,
                  })
                }
                className="text-[10px] text-slate-400 hover:text-purple-400 flex items-center gap-1 transition-colors"
                title="Reset sliders to 100%"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Brightness */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sun className="w-3 h-3 text-amber-400" /> Brightness
                </span>
                <span className="font-mono text-purple-400 text-[11px]">
                  {currentBrightness}%
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="130"
                value={currentBrightness}
                onChange={(e) => onChange({ imageBrightness: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 text-[11px]">
                  <Contrast className="w-3 h-3 text-sky-400" /> Contrast
                </span>
                <span className="font-mono text-purple-400 text-[11px]">
                  {currentContrast}%
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="130"
                value={currentContrast}
                onChange={(e) => onChange({ imageContrast: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 text-[11px]">
                  <Droplet className="w-3 h-3 text-pink-400" /> Saturation
                </span>
                <span className="font-mono text-purple-400 text-[11px]">
                  {currentSaturation}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={currentSaturation}
                onChange={(e) => onChange({ imageSaturation: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Atmosphere & Glassmorphism */}
      {activeSubTab === "atmosphere" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Frosted Glass Blur */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">
              Frosted Glassmorphism Blur
            </label>
            <div className="grid grid-cols-2 gap-2">
              {glassBlurOptions.map((opt) => {
                const isSelected = (themeSettings.glassBlur || "none") === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ glassBlur: opt.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-600/20 text-white"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    {opt.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Textures */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">
              Background Texture Overlay
            </label>
            <div className="grid grid-cols-2 gap-2">
              {patternOptions.map((opt) => {
                const isSelected = (themeSettings.bgPattern || "none") === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ bgPattern: opt.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-600/20 text-white"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    {opt.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Glow Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Ambient Glow Effect</span>
              <span className="text-[11px] text-slate-400">
                Pulsing neon glow around card borders matching primary brand color
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ enableGlow: !themeSettings.enableGlow })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                themeSettings.enableGlow ? "bg-purple-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  themeSettings.enableGlow ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* 3. Typography */}
      {activeSubTab === "typography" && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <label className="text-xs font-semibold text-slate-300">
            Font Family Pairing
          </label>
          <div className="flex flex-col gap-2">
            {fontOptions.map((font) => {
              const isSelected = themeSettings.fontFamily === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => onChange({ fontFamily: font.id })}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? "border-purple-500 bg-purple-600/15 text-white ring-1 ring-purple-500"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{font.name}</span>
                    <span className="text-[11px] text-slate-400 font-normal">{font.sample}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Custom Badges & Stickers */}
      {activeSubTab === "badges" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Floating Corner Badge / Ribbon
            </label>
            <input
              type="text"
              value={themeSettings.badgeText || ""}
              onChange={(e) => onChange({ badgeText: e.target.value })}
              placeholder="e.g. VIP, Bestseller, Open Now, Sale 20%"
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-400">Quick preset badges:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickBadgeChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onChange({ badgeText: chip })}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-600/20 hover:text-purple-300 text-[11px] font-semibold text-slate-300 border border-slate-800 transition-colors"
                >
                  {chip}
                </button>
              ))}
              {themeSettings.badgeText && (
                <button
                  type="button"
                  onClick={() => onChange({ badgeText: "" })}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold border border-red-500/20 transition-colors"
                >
                  Clear Badge
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

