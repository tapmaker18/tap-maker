"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Profile, TemplateId } from "@/lib/types";
import { getProfileById, saveProfile, isSlugAvailable } from "@/lib/storage";
import { ProfileInfoPanel } from "@/components/editor/ProfileInfoPanel";
import { LinksManagerPanel } from "@/components/editor/LinksManagerPanel";
import { ColorPickerPanel } from "@/components/editor/ColorPickerPanel";
import { PhonePreviewFrame } from "@/components/editor/PhonePreviewFrame";
import { QRCodeModal } from "@/components/editor/QRCodeModal";
import { VisualDesignStudioPanel } from "@/components/editor/VisualDesignStudioPanel";
import { AiAutoStyleModal } from "@/components/editor/AiAutoStyleModal";
import { AutoStyleResult } from "@/lib/autoStyleAI";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Save,
  Globe,
  QrCode,
  Sparkles,
  Palette,
  User,
  Link as LinkIcon,
  Layout,
  ExternalLink,
  Eye,
  Sliders,
  Check,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "links" | "colors" | "studio" | "template">("info");
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const handleApplyAiStyle = (result: AutoStyleResult) => {
    if (!profile) return;
    setProfile({
      ...profile,
      templateId: result.suggestedTemplate || profile.templateId,
      subtitle: profile.subtitle || result.tagline || "",
      themeSettings: {
        ...profile.themeSettings,
        preset: result.vibe,
        themeMode: result.themeMode,
        accentColor: result.primaryColor,
        secondaryAccent: result.secondaryAccent,
        color1: result.primaryColor,
        color2: result.secondaryAccent,
        bgPrimary: result.bgPrimary,
        bgSecondary: result.bgSecondary,
        cardBg: result.cardBg,
        borderColor: result.borderColor,
        textColor: result.textColor,
        textSecondaryColor: result.textSecondaryColor,
        fontFamily: result.fontFamily,
        buttonRadius: result.buttonRadius,
        imageFilter: result.imageFilter || "none",
        bgPattern: result.bgPattern || "none",
      },
    });
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const { user, loading: authLoading, signOut, isAdmin, isPending, isSuspended } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/editor/${profileId}`);
      return;
    }
    if (isPending || isSuspended) {
      router.push("/dashboard");
      return;
    }
  }, [user, authLoading, isPending, isSuspended, profileId, router]);

  useEffect(() => {
    if (authLoading || !user || isPending || isSuspended) return;
    async function load() {
      const data = await getProfileById(profileId);
      if (data) {
        if (data.userId && data.userId !== user?.uid && !isAdmin) {
          router.push("/dashboard");
          return;
        }
        setProfile(data);
      } else {
        router.push("/dashboard");
      }
    }
    load();
  }, [profileId, user, authLoading, router, isAdmin, isPending, isSuspended]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Tap-Maker Studio...</span>
        </div>
      </div>
    );
  }

  const handleSave = async (publishStatus?: "published" | "draft" | "unpublished") => {
    setIsSaving(true);
    setSlugError(null);

    // Validate slug
    const available = await isSlugAvailable(profile.slug, profile.id);
    if (!available) {
      setSlugError(`Slug "${profile.slug}" is reserved or already taken.`);
      setIsSaving(false);
      return;
    }

    const updatedProfile: Profile = {
      ...profile,
      status: publishStatus || profile.status,
    };

    const saved = await saveProfile(updatedProfile);
    setProfile(saved);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    if (publishStatus === "published") {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const templates: { id: TemplateId; name: string; desc: string }[] = [
    {
      id: "cyber-glow",
      name: "Cyber Glow / Neon Studio",
      desc: "Futuristic dark vibe with glowing meshes, ambient pulses & ripple badges.",
    },
    {
      id: "modern-bio",
      name: "Modern Link-in-Bio",
      desc: "Minimalist, clean, social-first presentation for creators & agencies.",
    },
    {
      id: "executive-card",
      name: "Executive Business Pass",
      desc: "Corporate smart card with vCard one-tap save, company info & call actions.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Editor Header */}
      <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                {profile.name}
              </h1>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  profile.status === "published"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : profile.status === "draft"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {profile.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              tap-maker.com/{profile.slug}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* AI Auto-Style Button */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-bold text-purple-300 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Scan logo or photo to design theme with AI"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">AI Auto-Style</span>
          </button>

          {/* QR Code Button */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            title="Share Link & QR Code"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">QR Code</span>
          </button>

          {/* Direct Public Link Button */}
          <a
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            title="Open Public Link"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Open</span>
          </a>

          {/* Desktop Save Draft Button */}
          <button
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="hidden lg:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          {/* Desktop Publish Button */}
          <button
            onClick={() => handleSave("published")}
            disabled={isSaving}
            className="hidden lg:flex px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 items-center gap-1.5 transition-all active:scale-95"
          >
            {saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-300" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <span>{saveSuccess ? "Saved!" : "Publish"}</span>
          </button>

          {/* User Profile & Sign Out */}
          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <span className="hidden xl:inline text-[11px] text-slate-400 font-mono truncate max-w-[130px]" title={user.email || ""}>
                {user.email}
              </span>
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                title="Sign Out of Studio"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Slug Error Alert Banner */}
      {slugError && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-2.5 flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{slugError}</span>
        </div>
      )}

      {/* Main Two-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Customization Controls */}
        <section
          className={`w-full lg:w-[480px] xl:w-[540px] flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 overflow-y-auto ${
            mobileMode === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 sticky top-0 z-20 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "info"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile Info</span>
            </button>

            <button
              onClick={() => setActiveTab("links")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "links"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Links & Socials</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800">
                {profile.links.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("colors")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "colors"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Colors</span>
            </button>

            <button
              onClick={() => setActiveTab("studio")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "studio"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Visual Studio</span>
            </button>

            <button
              onClick={() => setActiveTab("template")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "template"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Layout</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="p-6 flex-1">
            {activeTab === "info" && (
              <ProfileInfoPanel profile={profile} onChange={setProfile} />
            )}

            {activeTab === "links" && (
              <LinksManagerPanel profile={profile} onChange={setProfile} />
            )}

            {activeTab === "colors" && (
              <ColorPickerPanel profile={profile} onChange={setProfile} />
            )}

            {activeTab === "studio" && (
              <VisualDesignStudioPanel
                themeSettings={profile.themeSettings}
                onChange={(patch) =>
                  setProfile({
                    ...profile,
                    themeSettings: { ...profile.themeSettings, ...patch },
                  })
                }
                onOpenAiAutoStyle={() => setAiModalOpen(true)}
              />
            )}

            {activeTab === "template" && (
              <div className="flex flex-col gap-5 text-slate-200">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layout className="w-4 h-4 text-purple-400" />
                    <span>Template Engine Selector</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Switch between 3 distinct presentation layouts without losing any profile data or links.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {templates.map((tpl) => {
                    const isSelected = profile.templateId === tpl.id;

                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setProfile({ ...profile, templateId: tpl.id })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/40 shadow-xl"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-white">{tpl.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </div>
                        <p className="text-xs text-slate-400">{tpl.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Real-time Live Phone Mockup Preview */}
        <section
          className={`flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 lg:p-8 overflow-y-auto ${
            mobileMode === "edit" ? "hidden lg:flex" : "flex"
          }`}
        >
          <PhonePreviewFrame profile={profile} />
        </section>
      </div>

      {/* Mobile Sticky Bottom Floating Action Bar */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2.5 px-4 flex items-center justify-between gap-3 shadow-2xl">
        {/* Mobile Edit vs Preview Toggle */}
        <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setMobileMode("edit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mobileMode === "edit"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setMobileMode("preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mobileMode === "preview"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Preview
          </button>
        </div>

        {/* Save Draft & Publish Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Draft</span>
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            {saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-300" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <span>{saveSuccess ? "Saved!" : "Publish"}</span>
          </button>
        </div>
      </div>

      {/* QR Code & Share Modal */}
      <QRCodeModal
        profile={profile}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />

      {/* AI Auto-Style & Theme Designer Modal */}
      <AiAutoStyleModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApply={handleApplyAiStyle}
        targetType="profile"
      />
    </div>
  );
}
