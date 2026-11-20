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
  Code2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import {
  ThemeSettings,
  ImageFilterPreset,
  BgPatternType,
  GlassBlurIntensity,
} from "@/lib/types";
import { AutoStyleResult, scanAutoStyleWithAI } from "@/lib/autoStyleAI";
import { getGeminiApiKey } from "@/lib/menuAI";

interface VisualDesignStudioPanelProps {
  themeSettings: ThemeSettings;
  onChange: (patch: Partial<ThemeSettings>) => void;
  onOpenAiAutoStyle?: () => void;
  onApplyResult?: (result: AutoStyleResult) => void;
  canUseAiPageBuilder?: boolean;
}

export const VisualDesignStudioPanel: React.FC<VisualDesignStudioPanelProps> = ({
  themeSettings,
  onChange,
  onOpenAiAutoStyle,
  onApplyResult,
  canUseAiPageBuilder = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "filters" | "atmosphere" | "typography" | "badges" | "customCss"
  >("filters");

  // Inline AI Style Prompt State
  const [inlineStudioPrompt, setInlineStudioPrompt] = useState("");
  const [inlineStudioLoading, setInlineStudioLoading] = useState(false);
  const [inlineStudioError, setInlineStudioError] = useState<string | null>(null);
  const [studioBuilderMode, setStudioBuilderMode] = useState<"theme_only" | "full">("theme_only");

  const handleApplyInlineStudioPrompt = async (promptOverride?: string) => {
    const text = (promptOverride || inlineStudioPrompt).trim();
    if (!text) return;
    try {
      setInlineStudioLoading(true);
      setInlineStudioError(null);
      const res = await scanAutoStyleWithAI(
        null,
        getGeminiApiKey() || undefined,
        text,
        studioBuilderMode,
        "profile"
      );
      if (onApplyResult) {
        onApplyResult(res);
      } else {
        onChange({
          preset: res.vibe,
          themeMode: res.themeMode,
          accentColor: res.primaryColor,
          secondaryAccent: res.secondaryAccent,
          color1: res.primaryColor,
          color2: res.secondaryAccent,
          bgPrimary: res.bgPrimary,
          bgSecondary: res.bgSecondary,
          cardBg: res.cardBg,
          borderColor: res.borderColor,
          textColor: res.textColor,
          textSecondaryColor: res.textSecondaryColor,
          fontFamily: res.fontFamily,
          buttonRadius: res.buttonRadius,
          imageFilter: res.imageFilter || "none",
          bgPattern: res.bgPattern || "none",
          designConcept: res.designConcept || res.vibe,
          customCss: res.customCss || "",
        });
      }
      setInlineStudioPrompt("");
    } catch (err: any) {
      console.error("Inline studio AI styling failed:", err);
      setInlineStudioError(err?.message || "Failed to generate design from prompt.");
    } finally {
      setInlineStudioLoading(false);
    }
  };

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

        <button
          type="button"
          onClick={() => setActiveSubTab("customCss")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === "customCss"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
              : "text-purple-400 hover:text-purple-300"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>AI Design (CSS)</span>
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

      {/* 5. AI Bespoke Visual Design & Custom CSS Studio */}
      {activeSubTab === "customCss" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Design Concept Banner */}
          {themeSettings.designConcept ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400">
                    Active AI Design Concept
                  </span>
                  <p className="text-xs font-bold text-white">{themeSettings.designConcept}</p>
                </div>
              </div>
              {onOpenAiAutoStyle && (
                <button
                  type="button"
                  onClick={onOpenAiAutoStyle}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-md transition-all active:scale-95 flex-shrink-0"
                >
                  Redesign
                </button>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">No AI Design Generated Yet</p>
                <p className="text-[11px] text-slate-400">
                  Upload your logo/photo and AI will author a bespoke stylesheet for your brand!
                </p>
              </div>
              {onOpenAiAutoStyle && (
                <button
                  type="button"
                  onClick={onOpenAiAutoStyle}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-[11px] font-bold shadow-md flex items-center gap-1.5 flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan with AI</span>
                </button>
              )}
            </div>
          )}

          {/* Inline Style Prompt Redesign Box */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Prompt AI Designer &amp; Builder</span>
              </label>
              {onOpenAiAutoStyle && (
                <button
                  type="button"
                  onClick={onOpenAiAutoStyle}
                  className="text-[10px] text-purple-400 hover:text-purple-300 underline flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Upload photo instead</span>
                </button>
              )}
            </div>

            {/* Mode Switcher: Theme Only vs Full AI Builder */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] w-fit">
              <button
                type="button"
                onClick={() => setStudioBuilderMode("theme_only")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  studioBuilderMode === "theme_only"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🎨 Visual Theme Only (Default)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (canUseAiPageBuilder) {
                    setStudioBuilderMode("full");
                  } else {
                    alert(
                      "Permission required: Please contact the Super Admin to enable AI Page & Button Builder access for your account."
                    );
                  }
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  studioBuilderMode === "full"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : canUseAiPageBuilder
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-400"
                }`}
                title={
                  canUseAiPageBuilder
                    ? "AI generates visual theme + functions, bio, links, buttons & store info"
                    : "Requires Super Admin Permission"
                }
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>⚡ Full AI Builder (Design, Content, Functions & Links)</span>
                {!canUseAiPageBuilder && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Admin Lock
                  </span>
                )}
              </button>
            </div>

            {inlineStudioError && (
              <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
                {inlineStudioError}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inlineStudioPrompt}
                onChange={(e) => setInlineStudioPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !inlineStudioLoading) {
                    e.preventDefault();
                    handleApplyInlineStudioPrompt();
                  }
                }}
                placeholder={
                  studioBuilderMode === "full"
                    ? "e.g. Tech Founder bio in BGC, Calendly booking, LinkedIn, WiFi details, and futuristic dark neon theme..."
                    : "e.g. Modern executive glassmorphism, or warm artisan wood and gold cafe..."
                }
                className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
              />
              <button
                type="button"
                disabled={!inlineStudioPrompt.trim() || inlineStudioLoading}
                onClick={() => handleApplyInlineStudioPrompt()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 shadow-md shadow-purple-600/20"
              >
                {inlineStudioLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Designing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{studioBuilderMode === "full" ? "Build with AI" : "Apply Prompt"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Preset Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-mono">QUICK:</span>
              {(studioBuilderMode === "full"
                ? [
                    "💼 Tech CEO Bio + Calendly booking + LinkedIn & Portfolio buttons",
                    "🛍️ Add Shopee Store & GrabFood buttons with highlight + Contact info",
                    "📸 Influencer Bio + Instagram, TikTok, & YouTube links + Collabs badge",
                    "✨ Luxury Gold Executive + All Social Buttons & Location",
                  ]
                : [
                    "✨ Executive Luxury & Gold",
                    "⚡ Cyberpunk Neon Glow",
                    "🌿 Clean Botanical Pastel",
                    "☕ Warm Artisan Roasted",
                    "🖤 Minimalist Monochrome",
                  ]
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={inlineStudioLoading}
                  onClick={() => {
                    setInlineStudioPrompt(preset);
                    handleApplyInlineStudioPrompt(preset);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-600/20 hover:border-purple-500/40 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* CSS Code Editor / Live Textarea */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Custom Visual CSS (Live Applied)</span>
              </label>
              {themeSettings.customCss && (
                <button
                  type="button"
                  onClick={() => onChange({ customCss: "", designConcept: undefined })}
                  className="text-[11px] text-red-400 hover:text-red-300 underline"
                >
                  Clear Custom CSS
                </button>
              )}
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner focus-within:border-purple-500">
              <div className="px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>custom-theme.css</span>
                <span>{themeSettings.customCss ? `${themeSettings.customCss.length} chars` : "empty"}</span>
              </div>
              <textarea
                value={themeSettings.customCss || ""}
                onChange={(e) => onChange({ customCss: e.target.value })}
                rows={10}
                placeholder={`/* Write custom CSS or let AI design it for you */
.tmaker-card {
  box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
  border-radius: 28px !important;
}
.tmaker-link-item:hover {
  transform: translateY(-3px) !important;
}`}
                className="w-full text-xs font-mono bg-transparent p-3.5 text-cyan-300 placeholder-slate-600 focus:outline-none resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Targetable Classes Cheat-Sheet */}
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-300">
              Targetable CSS Selectors (Use with !important):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400">
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">.tmaker-profile-root</span>: canvas/bg
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">.tmaker-card</span>: virtual card
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">.tmaker-avatar-wrap</span>: avatar frame
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">.tmaker-name</span>: person/brand title
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">.tmaker-link-item</span>: link buttons
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">.tmaker-action-btn</span>: Save Contact
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">.tmaker-badge</span>: floating ribbon
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-purple-400 font-bold">.tmaker-subtitle</span>: role/tagline
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

