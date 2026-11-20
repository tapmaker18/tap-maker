"use client";

import React, { useRef, useState } from "react";
import {
  Sliders,
  Sparkles,
  Palette,
  Type,
  Layers,
  Tag,
  Check,
  Code2,
  Loader2,
  LayoutGrid,
  List,
  AlignCenter,
  AlignLeft,
  Image as ImageIcon,
  Upload,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  ThemeSettings,
  BgPatternType,
  ButtonStyle,
  ButtonRadius,
  LinkLayoutMode,
  HeaderAlignMode,
  AvatarSizeMode,
} from "@/lib/types";
import { AutoStyleResult, scanAutoStyleWithAI } from "@/lib/autoStyleAI";
import { getGeminiApiKey } from "@/lib/menuAI";
import { uploadImageFile } from "@/lib/imageUpload";

interface VisualDesignStudioPanelProps {
  themeSettings: ThemeSettings;
  onChange: (patch: Partial<ThemeSettings>) => void;
  onOpenAiAutoStyle?: () => void;
  onApplyResult?: (result: AutoStyleResult) => void;
  canUseAiPageBuilder?: boolean;
}

interface ThemePresetItem {
  id: string;
  name: string;
  subtitle: string;
  swatches: [string, string, string];
  patch: Partial<ThemeSettings>;
}

const STUDIO_PRESETS: ThemePresetItem[] = [
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    subtitle: "Midnight violet & electric cyan",
    swatches: ["#0a0814", "#a37bf7", "#1bdfcf"],
    patch: {
      preset: "cyber-neon",
      themeMode: "dark",
      bgType: "mesh",
      bgPrimary: "#0a0814",
      bgSecondary: "#161130",
      color1: "#a37bf7",
      color2: "#1bdfcf",
      accentColor: "#a37bf7",
      secondaryAccent: "#1bdfcf",
      textColor: "#f8fafc",
      textSecondaryColor: "#cbd5e1",
      cardBg: "rgba(255, 255, 255, 0.06)",
      borderColor: "rgba(163, 123, 247, 0.28)",
      buttonStyle: "glass",
      buttonRadius: "rounded",
      fontFamily: "Space Grotesk",
      bgPattern: "grid",
      enableGlow: true,
      customCss: "",
    },
  },
  {
    id: "luxury-gold",
    name: "Luxury VIP Gold",
    subtitle: "Obsidian charcoal & metallic gold",
    swatches: ["#0c0a08", "#d4af37", "#fde68a"],
    patch: {
      preset: "luxury-gold",
      themeMode: "dark",
      bgType: "gradient",
      bgGradientAngle: 155,
      bgPrimary: "#0c0a08",
      bgSecondary: "#231a0f",
      color1: "#d4af37",
      color2: "#f59e0b",
      accentColor: "#d4af37",
      secondaryAccent: "#fde68a",
      textColor: "#fffbeb",
      textSecondaryColor: "#d6c7a8",
      cardBg: "rgba(30, 22, 12, 0.85)",
      borderColor: "rgba(212, 175, 55, 0.4)",
      buttonStyle: "outline",
      buttonRadius: "rounded",
      fontFamily: "Playfair Display",
      bgPattern: "none",
      enableGlow: true,
      customCss: "",
    },
  },
  {
    id: "clean-light",
    name: "Clean Minimal",
    subtitle: "Crisp white & bold indigo",
    swatches: ["#f8fafc", "#4f46e5", "#0f172a"],
    patch: {
      preset: "clean-light",
      themeMode: "light",
      bgType: "gradient",
      bgGradientAngle: 180,
      bgPrimary: "#f8fafc",
      bgSecondary: "#e2e8f0",
      color1: "#4f46e5",
      color2: "#0ea5e9",
      accentColor: "#4f46e5",
      secondaryAccent: "#0284c7",
      textColor: "#0f172a",
      textSecondaryColor: "#475569",
      cardBg: "#ffffff",
      borderColor: "rgba(15, 23, 42, 0.14)",
      buttonStyle: "shadow",
      buttonRadius: "rounded",
      fontFamily: "Plus Jakarta Sans",
      bgPattern: "dots",
      enableGlow: false,
      customCss: "",
    },
  },
  {
    id: "artisan-cafe",
    name: "Artisan Café",
    subtitle: "Warm espresso & roasted amber",
    swatches: ["#140d09", "#d97706", "#fef3c7"],
    patch: {
      preset: "artisan-cafe",
      themeMode: "dark",
      bgType: "gradient",
      bgGradientAngle: 145,
      bgPrimary: "#140d09",
      bgSecondary: "#2b1910",
      color1: "#d97706",
      color2: "#ea580c",
      accentColor: "#f59e0b",
      secondaryAccent: "#fbbf24",
      textColor: "#fffbeb",
      textSecondaryColor: "#e7d3be",
      cardBg: "rgba(43, 25, 16, 0.78)",
      borderColor: "rgba(245, 158, 11, 0.32)",
      buttonStyle: "gradient",
      buttonRadius: "pill",
      fontFamily: "Outfit",
      bgPattern: "grain",
      enableGlow: true,
      customCss: "",
    },
  },
  {
    id: "emerald-studio",
    name: "Emerald Studio",
    subtitle: "Deep forest & bright mint",
    swatches: ["#04120e", "#10b981", "#22d3ee"],
    patch: {
      preset: "emerald-studio",
      themeMode: "dark",
      bgType: "mesh",
      bgPrimary: "#04120e",
      bgSecondary: "#09261e",
      color1: "#10b981",
      color2: "#22d3ee",
      accentColor: "#10b981",
      secondaryAccent: "#34d399",
      textColor: "#ecfdf5",
      textSecondaryColor: "#a7f3d0",
      cardBg: "rgba(6, 78, 59, 0.32)",
      borderColor: "rgba(16, 185, 129, 0.35)",
      buttonStyle: "glass",
      buttonRadius: "rounded",
      fontFamily: "Plus Jakarta Sans",
      bgPattern: "dots",
      enableGlow: true,
      customCss: "",
    },
  },
  {
    id: "sunset-pop",
    name: "Sunset Pop",
    subtitle: "Bold magenta & coral gradient",
    swatches: ["#1a071c", "#ec4899", "#f97316"],
    patch: {
      preset: "sunset-pop",
      themeMode: "dark",
      bgType: "gradient",
      bgGradientAngle: 135,
      bgPrimary: "#1a071c",
      bgSecondary: "#3b0a2a",
      color1: "#ec4899",
      color2: "#f97316",
      accentColor: "#ec4899",
      secondaryAccent: "#fb923c",
      textColor: "#ffffff",
      textSecondaryColor: "#fbcfe8",
      cardBg: "rgba(236, 72, 153, 0.14)",
      borderColor: "rgba(236, 72, 153, 0.38)",
      buttonStyle: "gradient",
      buttonRadius: "pill",
      fontFamily: "Outfit",
      bgPattern: "none",
      enableGlow: true,
      customCss: "",
    },
  },
  {
    id: "ocean-glass",
    name: "Ocean Executive",
    subtitle: "Deep navy & electric sky",
    swatches: ["#030b1a", "#0284c7", "#38bdf8"],
    patch: {
      preset: "ocean-glass",
      themeMode: "dark",
      bgType: "gradient",
      bgGradientAngle: 160,
      bgPrimary: "#030b1a",
      bgSecondary: "#0c2244",
      color1: "#0284c7",
      color2: "#38bdf8",
      accentColor: "#38bdf8",
      secondaryAccent: "#0ea5e9",
      textColor: "#f8fafc",
      textSecondaryColor: "#bae6fd",
      cardBg: "rgba(14, 165, 233, 0.1)",
      borderColor: "rgba(56, 189, 248, 0.3)",
      buttonStyle: "flat",
      buttonRadius: "sharp",
      fontFamily: "Inter",
      bgPattern: "grid",
      enableGlow: true,
      customCss: "",
    },
  },
  {
    id: "crimson-velvet",
    name: "Crimson Velvet",
    subtitle: "Dark wine & rose gold",
    swatches: ["#14050a", "#e11d48", "#fda4af"],
    patch: {
      preset: "crimson-velvet",
      themeMode: "dark",
      bgType: "mesh",
      bgPrimary: "#14050a",
      bgSecondary: "#2e0814",
      color1: "#e11d48",
      color2: "#fb7185",
      accentColor: "#f43f5e",
      secondaryAccent: "#fda4af",
      textColor: "#fff1f2",
      textSecondaryColor: "#fecdd3",
      cardBg: "rgba(225, 29, 72, 0.14)",
      borderColor: "rgba(244, 63, 94, 0.38)",
      buttonStyle: "shadow",
      buttonRadius: "rounded",
      fontFamily: "Playfair Display",
      bgPattern: "none",
      enableGlow: true,
      customCss: "",
    },
  },
];

export const VisualDesignStudioPanel: React.FC<VisualDesignStudioPanelProps> = ({
  themeSettings,
  onChange,
  onOpenAiAutoStyle,
  onApplyResult,
  canUseAiPageBuilder = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "presets" | "buttons" | "background" | "typography" | "customCss"
  >("presets");

  const [inlineStudioPrompt, setInlineStudioPrompt] = useState("");
  const [inlineStudioLoading, setInlineStudioLoading] = useState(false);
  const [inlineStudioError, setInlineStudioError] = useState<string | null>(null);
  const [studioBuilderMode, setStudioBuilderMode] = useState<"theme_only" | "full">("theme_only");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingBanner(true);
      const dataUrl = await uploadImageFile(file, {
        folder: "profile-banners",
        maxWidth: 1000,
        maxHeight: 450,
      });
      onChange({ showHeroBanner: true, heroBannerImage: dataUrl });
    } catch (err: any) {
      alert(err?.message || "Failed to upload banner image.");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

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

  const buttonStyles: { id: ButtonStyle; name: string; desc: string }[] = [
    { id: "glass", name: "Frosted Glass", desc: "Translucent blur" },
    { id: "gradient", name: "Bold Gradient", desc: "Color 1 → Color 2" },
    { id: "flat", name: "Solid Fill", desc: "High-contrast solid" },
    { id: "outline", name: "Neon Outline", desc: "Clean crisp border" },
    { id: "shadow", name: "3D Shadow", desc: "Elevated pop card" },
  ];

  const fontOptions: { id: ThemeSettings["fontFamily"]; name: string; sample: string }[] = [
    { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans", sample: "Modern & Crisp" },
    { id: "Playfair Display", name: "Playfair Display", sample: "Luxury Editorial Serif" },
    { id: "Outfit", name: "Outfit", sample: "Friendly Geometric" },
    { id: "Space Grotesk", name: "Space Grotesk", sample: "Tech & Futuristic" },
    { id: "Inter", name: "Inter", sample: "Clean Minimalist" },
  ];

  const patternOptions: { id: BgPatternType; name: string }[] = [
    { id: "none", name: "Clean (None)" },
    { id: "dots", name: "Dot Matrix" },
    { id: "grid", name: "Tech Grid" },
    { id: "mesh", name: "Radial Mesh" },
    { id: "grain", name: "Subtle Grain" },
  ];

  const quickBadgeChips = ["VIP", "Open Now", "Book Me", "New", "Verified", "Promo", "Featured"];

  return (
    <div className="flex flex-col gap-5 text-slate-200">
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBannerUpload}
      />

      {/* AI Auto-Stylist Banner */}
      {onOpenAiAutoStyle && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-3 shadow-lg shadow-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">AI Auto-Style &amp; Theme Designer</h4>
              <p className="text-[11px] text-slate-400">
                Describe any vibe or upload a photo for an instant complete design makeover.
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
          High-impact visual tools — every control immediately transforms your live preview.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 gap-1 overflow-x-auto">
        {[
          { id: "presets", label: "Theme Presets", icon: Wand2 },
          { id: "buttons", label: "Buttons & Layout", icon: LayoutGrid },
          { id: "background", label: "Background & Banner", icon: Layers },
          { id: "typography", label: "Fonts & Badges", icon: Type },
          { id: "customCss", label: "AI & CSS", icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. 1-CLICK THEME PRESETS */}
      {activeSubTab === "presets" && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <p className="text-xs text-slate-400">
            Apply a complete visual makeover (colors, background, button style &amp; font) in one click.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {STUDIO_PRESETS.map((preset) => {
              const isSelected = themeSettings.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange(preset.patch)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "border-purple-500 bg-purple-600/15 ring-1 ring-purple-500"
                      : "border-slate-800 bg-slate-900/70 hover:border-slate-600"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{preset.subtitle}</p>
                  </div>
                  <div className="flex items-center -space-x-1.5 flex-shrink-0">
                    {preset.swatches.map((hex, idx) => (
                      <span
                        key={idx}
                        className="w-5 h-5 rounded-full border-2 border-slate-950 shadow-sm"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. BUTTONS & LAYOUT STUDIO */}
      {activeSubTab === "buttons" && (
        <div className="flex flex-col gap-5 animate-fade-in">
          {/* Button Style */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">Link Button Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {buttonStyles.map((b) => {
                const active = (themeSettings.buttonStyle || "glass") === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onChange({ buttonStyle: b.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? "border-purple-500 bg-purple-600/20 text-white"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-bold">{b.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{b.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link Layout: 1-Col List vs 2-Col Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">Links Layout</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "list", label: "Stacked List (1 Column)", icon: List },
                  { id: "grid", label: "Tile Grid (2 Columns)", icon: LayoutGrid },
                ] as { id: LinkLayoutMode; label: string; icon: React.ComponentType<any> }[]
              ).map((opt) => {
                const Icon = opt.icon;
                const active = (themeSettings.linkLayout || "list") === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ linkLayout: opt.id })}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      active
                        ? "border-purple-500 bg-purple-600/20 text-white"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-purple-400" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Button Corners */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">Button Corner Shape</label>
            <div className="grid grid-cols-3 gap-2">
              {(["sharp", "rounded", "pill"] as ButtonRadius[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChange({ buttonRadius: r })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                    themeSettings.buttonRadius === r
                      ? "border-purple-500 bg-purple-600/20 text-white"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Header Alignment & Avatar Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300">Header Alignment</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "center", label: "Centered", icon: AlignCenter },
                    { id: "left", label: "Left Editorial", icon: AlignLeft },
                  ] as { id: HeaderAlignMode; label: string; icon: React.ComponentType<any> }[]
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = (themeSettings.headerAlign || "center") === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ headerAlign: opt.id })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        active
                          ? "border-purple-500 bg-purple-600/20 text-white"
                          : "border-slate-800 bg-slate-900/60 text-slate-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300">Avatar Size</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "sm", label: "Small" },
                    { id: "md", label: "Medium" },
                    { id: "lg", label: "Large" },
                  ] as { id: AvatarSizeMode; label: string }[]
                ).map((opt) => {
                  const active = (themeSettings.avatarSize || "md") === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ avatarSize: opt.id })}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        active
                          ? "border-purple-500 bg-purple-600/20 text-white"
                          : "border-slate-800 bg-slate-900/60 text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BACKGROUND & HERO BANNER */}
      {activeSubTab === "background" && (
        <div className="flex flex-col gap-5 animate-fade-in">
          {/* Top Hero Cover Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Top Hero Cover Banner</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Add a full-width gradient header or custom cover photo at the top of your page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ showHeroBanner: !themeSettings.showHeroBanner })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  themeSettings.showHeroBanner
                    ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950 border-slate-700 text-slate-400"
                }`}
              >
                {themeSettings.showHeroBanner ? "Enabled" : "Off"}
              </button>
            </div>

            {themeSettings.showHeroBanner && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={uploadingBanner}
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {uploadingBanner ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{themeSettings.heroBannerImage ? "Change Cover Photo" : "Upload Custom Cover Photo"}</span>
                </button>
                {themeSettings.heroBannerImage && (
                  <button
                    type="button"
                    onClick={() => onChange({ heroBannerImage: "" })}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    title="Use brand gradient instead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Background Mode */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">Background Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "mesh", label: "Aurora Mesh" },
                  { id: "gradient", label: "Linear Gradient" },
                  { id: "solid", label: "Solid Clean" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      bgType: m.id,
                      enableGlow: m.id === "mesh",
                    })
                  }
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    themeSettings.bgType === m.id
                      ? "border-purple-500 bg-purple-600/20 text-white"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Gradient Colors & Angle */}
          {themeSettings.bgType !== "solid" && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-400">Top / Primary Bg</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeSettings.bgPrimary || "#0a0814"}
                      onChange={(e) => onChange({ bgPrimary: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">
                      {themeSettings.bgPrimary}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-400">Bottom / Secondary Bg</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeSettings.bgSecondary || "#1e1b4b"}
                      onChange={(e) => onChange({ bgSecondary: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">
                      {themeSettings.bgSecondary}
                    </span>
                  </div>
                </div>
              </div>

              {themeSettings.bgType === "gradient" && (
                <div className="flex flex-col gap-1 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="text-[11px]">Gradient Direction Angle</span>
                    <span className="font-mono text-purple-400 text-[11px]">
                      {themeSettings.bgGradientAngle ?? 135}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={themeSettings.bgGradientAngle ?? 135}
                    onChange={(e) => onChange({ bgGradientAngle: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Pattern Overlay */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">Background Texture Pattern</label>
            <div className="grid grid-cols-3 gap-2">
              {patternOptions.map((opt) => {
                const isSelected = (themeSettings.bgPattern || "none") === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ bgPattern: opt.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
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
        </div>
      )}

      {/* 4. TYPOGRAPHY & FLOATING BADGE */}
      {activeSubTab === "typography" && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">Profile Typography</label>
            <div className="grid grid-cols-1 gap-2">
              {fontOptions.map((font) => {
                const isSelected = themeSettings.fontFamily === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => onChange({ fontFamily: font.id })}
                    style={{ fontFamily: font.id }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-purple-500 bg-purple-600/20 text-white"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">{font.name}</div>
                      <div className="text-[11px] text-slate-400">{font.sample}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating Status / Promo Badge */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Floating Promo / Status Badge</span>
              </label>
              {themeSettings.badgeText && (
                <button
                  type="button"
                  onClick={() => onChange({ badgeText: "" })}
                  className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={themeSettings.badgeText || ""}
                onChange={(e) => onChange({ badgeText: e.target.value })}
                placeholder="e.g. Open for Bookings, VIP, New Drop..."
                className="flex-1 text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="color"
                value={themeSettings.badgeColor || themeSettings.accentColor || "#9333ea"}
                onChange={(e) => onChange({ badgeColor: e.target.value })}
                className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
                title="Badge Color"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {quickBadgeChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onChange({ badgeText: chip })}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. AI DESIGN & CUSTOM CSS */}
      {activeSubTab === "customCss" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/30 flex flex-col gap-3">
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
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>⚡ Full AI Builder</span>
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
                className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                disabled={!inlineStudioPrompt.trim() || inlineStudioLoading}
                onClick={() => handleApplyInlineStudioPrompt()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
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
          </div>

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
            <textarea
              value={themeSettings.customCss || ""}
              onChange={(e) => onChange({ customCss: e.target.value })}
              rows={8}
              placeholder="/* Custom CSS rules applied live */"
              className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
