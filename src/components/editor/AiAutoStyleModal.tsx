"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Palette,
  Key,
  ChevronDown,
  ChevronUp,
  Layout,
  Sliders,
  Code2,
} from "lucide-react";
import { scanAutoStyleWithAI, AutoStyleResult } from "@/lib/autoStyleAI";
import { getGeminiApiKey, saveGeminiApiKey } from "@/lib/menuAI";
import { compressImage } from "@/lib/imageUpload";

interface AiAutoStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: AutoStyleResult) => void;
  targetType?: "profile" | "menu";
}

const PROMPT_PRESETS = [
  "✨ Luxury VIP gold & midnight charcoal lounge",
  "☕ Warm artisan cafe with cozy rustic woods",
  "⚡ Cyberpunk neon with deep electric accents",
  "🌿 Clean botanical matcha & organic pastel",
  "💼 Modern executive minimalist monochrome",
  "🍰 Pastel aesthetic dessert bakery",
];

export const AiAutoStyleModal: React.FC<AiAutoStyleModalProps> = ({
  isOpen,
  onClose,
  onApply,
  targetType = "profile",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [customKey, setCustomKey] = useState<string>(getGeminiApiKey() || "");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>("Analyzing image colors & lighting...");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutoStyleResult | null>(null);
  const [showCssPreview, setShowCssPreview] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartScan = async () => {
    if (!file && !userPrompt.trim()) {
      setError("Please select a photo or enter a style prompt.");
      return;
    }

    try {
      setScanning(true);
      setError(null);
      setScanStep(
        file
          ? "Compressing image & analyzing brand identity..."
          : "Synthesizing bespoke visual design from prompt..."
      );

      let fileToSend: File | null = file;
      if (file) {
        try {
          const compressed = await compressImage(file, 800, 800, 0.82);
          fileToSend = new File([compressed.blob], file.name.replace(/\.[^.]+$/, ".webp"), {
            type: compressed.blob.type || "image/jpeg",
          });
        } catch (compressErr) {
          console.warn("Client image compression fallback:", compressErr);
        }
      }

      const stepTimer1 = setTimeout(() => {
        setScanStep("Authoring custom CSS rules & high-contrast palette...");
      }, 1200);

      const autoStyleData = await scanAutoStyleWithAI(fileToSend, customKey, userPrompt.trim());

      clearTimeout(stepTimer1);
      setResult(autoStyleData);

      if (customKey.trim()) {
        saveGeminiApiKey(customKey.trim());
      }
    } catch (err: any) {
      console.error("AI Auto-Style failed:", err);
      setError(err?.message || "Failed to style with AI. Please try another prompt or image.");
    } finally {
      setScanning(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>AI Auto-Style &amp; Theme Designer</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Upload your logo, shop picture, or menu. AI will craft your visual theme!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-slate-200">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Upload Area & Style Direction if not yet scanned */}
          {!result && (
            <div className="flex flex-col gap-4">
              {/* Style Direction Prompt Box */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Your Style Prompt / Vibe Direction</span>
                    <span className="text-[10px] text-purple-300 font-normal">
                      ({file ? "Guides photo analysis" : "Prompt-only design"})
                    </span>
                  </label>
                  {userPrompt && (
                    <button
                      type="button"
                      onClick={() => setUserPrompt("")}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={2}
                  placeholder="e.g. Luxury VIP gold & midnight charcoal lounge, Japanese minimalist cafe, Cyberpunk neon street..."
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none leading-relaxed"
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-mono">QUICK:</span>
                  {PROMPT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUserPrompt(preset)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-purple-600/30 hover:border-purple-500/50 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload Area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative ${
                  previewUrl
                    ? "border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                {previewUrl ? (
                  <div className="relative w-full max-h-44 rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg">
                    <img
                      src={previewUrl}
                      alt="Source preview"
                      className="w-full h-44 object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-2">
                      <span className="text-xs font-bold text-white bg-black/70 px-3 py-1.5 rounded-xl border border-white/20">
                        Click to change photo
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-xs font-bold text-red-200 bg-red-600/80 hover:bg-red-600 px-3 py-1.5 rounded-xl border border-red-400/40"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Upload reference photo (Optional)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Logo, storefront, food, or menu (or leave blank to design from prompt only)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Custom API Key Accordion */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span>Using custom Gemini or Groq API key? (Optional)</span>
                  </span>
                  {showKeyInput ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {showKeyInput && (
                  <div className="p-4 pt-1 border-t border-slate-800 flex flex-col gap-2">
                    <p className="text-[11px] text-slate-400">
                      If provided, this key bypasses quota restrictions and scans using your own Google Gemini / Groq key.
                    </p>
                    <input
                      type="password"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="AIzaSy... or gsk_..."
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {scanning && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center animate-fade-in">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin absolute -top-1 -right-1" />
              </div>
              <p className="text-xs font-bold text-white">{scanStep}</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Extracting harmonious color harmonies, contrast ratios, and recommended typography...
              </p>
            </div>
          )}

          {/* Result Presentation */}
          {result && !scanning && (
            <div className="flex flex-col gap-4 animate-fade-slide-up">
              {/* Detected Vibe Banner */}
              <div
                className="p-4 rounded-2xl border shadow-lg flex flex-col gap-2"
                style={{
                  backgroundColor: result.cardBg,
                  borderColor: result.borderColor,
                  color: result.textColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm"
                    style={{
                      backgroundColor: result.primaryColor,
                      color: "#ffffff",
                    }}
                  >
                    {result.vibe}
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">
                    Mode: {result.themeMode.toUpperCase()}
                  </span>
                </div>

                {result.designConcept && (
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 pt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Visual Concept: {result.designConcept}</span>
                  </div>
                )}

                {result.userPrompt && (
                  <div className="text-[11px] opacity-80 italic">
                    Prompt: &ldquo;{result.userPrompt}&rdquo;
                  </div>
                )}

                {result.vibeExplanation && (
                  <p className="text-xs leading-relaxed opacity-90">{result.vibeExplanation}</p>
                )}

                {result.tagline && (
                  <p
                    className="text-xs font-semibold italic border-t pt-2 mt-1"
                    style={{ borderColor: result.borderColor }}
                  >
                    &ldquo;{result.tagline}&rdquo;
                  </p>
                )}
              </div>

              {/* Color Swatches Grid */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Extracted Color Harmony</span>
                </span>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-10 h-10 rounded-xl shadow border border-white/10"
                      style={{ backgroundColor: result.primaryColor }}
                    />
                    <span className="text-slate-400">Primary</span>
                    <span className="font-mono text-slate-300">{result.primaryColor}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-10 h-10 rounded-xl shadow border border-white/10"
                      style={{ backgroundColor: result.secondaryAccent }}
                    />
                    <span className="text-slate-400">Accent</span>
                    <span className="font-mono text-slate-300">{result.secondaryAccent}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-10 h-10 rounded-xl shadow border border-white/10"
                      style={{ backgroundColor: result.bgPrimary }}
                    />
                    <span className="text-slate-400">Background</span>
                    <span className="font-mono text-slate-300">{result.bgPrimary}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-10 h-10 rounded-xl shadow border border-white/10"
                      style={{ backgroundColor: result.cardBg }}
                    />
                    <span className="text-slate-400">Card Base</span>
                    <span className="font-mono text-slate-300">{result.cardBg}</span>
                  </div>
                </div>
              </div>

              {/* Recommended Template & Font */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Layout className="w-3 h-3 text-purple-400" />
                    <span>Recommended Layout</span>
                  </span>
                  <span className="font-bold text-white capitalize">
                    {targetType === "profile"
                      ? result.suggestedTemplate.replace("-", " ")
                      : `${result.suggestedMenuCardStyle} Cards`}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-purple-400" />
                    <span>Typography &amp; Filter</span>
                  </span>
                  <span className="font-bold text-white truncate">{result.fontFamily}</span>
                </div>
              </div>

              {/* Bespoke AI Custom Visual CSS */}
              {result.customCss && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Bespoke AI Visual Design (Custom CSS)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCssPreview(!showCssPreview)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold"
                    >
                      {showCssPreview ? "Hide CSS" : "View Generated CSS"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    AI generated custom design code tailored specifically for this brand. Click apply to activate it!
                  </p>
                  {showCssPreview && (
                    <pre className="text-[10px] font-mono text-cyan-300 bg-slate-900/90 p-3 rounded-xl max-h-40 overflow-y-auto border border-cyan-500/20 whitespace-pre-wrap leading-relaxed">
                      {result.customCss}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          {result ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Scan Another Photo
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply AI Design &amp; Theme</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={(!file && !userPrompt.trim()) || scanning}
                onClick={handleStartScan}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {scanning
                    ? "Designing with AI..."
                    : file && userPrompt.trim()
                    ? "Scan & Apply Prompt Style"
                    : userPrompt.trim()
                    ? "Generate Style from Prompt"
                    : "Scan & Style Photo"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

