"use client";

import React, { useState, useRef } from "react";
import { Profile, ProfileLink } from "@/lib/types";
import { IconMapper } from "@/components/ui/IconMapper";
import { Lightbox } from "@/components/ui/Lightbox";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { ChevronRight, CheckCircle2 } from "lucide-react";

interface TemplateProps {
  profile: Profile;
  isPreview?: boolean;
  onLinkClick?: (linkId: string, linkTitle: string) => void;
}

export const CyberGlowTemplate: React.FC<TemplateProps> = ({ profile, isPreview = false, onLinkClick }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { themeSettings, layoutSettings, links } = profile;
  const activeLinks = links.filter((l) => l.isActive);

  // Group links by category
  const categories = Array.from(new Set(activeLinks.map((l) => l.category)));

  const handleRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!themeSettings.enableRipples) return;
    const button = e.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add("ripple-circle");

    const existing = button.querySelector(".ripple-circle");
    if (existing) existing.remove();

    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  };

  // Profile image shape
  const getAvatarRadius = () => {
    if (layoutSettings.avatarShape === "squircle") return "rounded-[32px]";
    if (layoutSettings.avatarShape === "rounded-square") return "rounded-2xl";
    return "rounded-full";
  };

  // Button radius
  const getButtonRadius = () => {
    if (themeSettings.buttonRadius === "sharp") return "rounded-md";
    if (themeSettings.buttonRadius === "pill") return "rounded-full";
    return "rounded-2xl";
  };

  const color1 = themeSettings.color1 || themeSettings.accentColor || "#a37bf7";
  const color2 = themeSettings.color2 || themeSettings.secondaryAccent || "#1bdfcf";
  const additional = themeSettings.additionalColors || [];

  // Multi-color gradient string including Color 1, Color 2, and any added colors
  const brandGradient = [
    color1,
    color2,
    ...additional,
    color1,
  ].join(", ");

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center overflow-x-hidden selection:bg-purple-500 selection:text-white"
      style={{
        backgroundColor: themeSettings.bgPrimary,
        color: themeSettings.textColor,
        fontFamily: themeSettings.fontFamily,
      }}
    >
      {/* Dynamic Ambient Radial Glow Background */}
      {themeSettings.enableGlow && (
        <div className="absolute inset-0 pointer-events-none z-0 filter blur-[40px] opacity-70 overflow-hidden">
          <div
            className="absolute w-[500px] h-[500px] -top-24 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${themeSettings.accentColor}33 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute w-[420px] h-[420px] top-[60%] right-[-10%] rounded-full"
            style={{
              background: `radial-gradient(circle, ${themeSettings.secondaryAccent}26 0%, transparent 60%)`,
            }}
          />
          <div
            className="absolute w-[450px] h-[450px] bottom-[-10%] left-[-10%] rounded-full"
            style={{
              background: `radial-gradient(circle, ${themeSettings.accentColor}24 0%, transparent 60%)`,
            }}
          />
          {themeSettings.additionalColors?.map((c, i) => (
            <div
              key={i}
              className="absolute w-[380px] h-[380px] rounded-full"
              style={{
                top: `${(i + 1) * 28}%`,
                left: i % 2 === 0 ? "5%" : "70%",
                background: `radial-gradient(circle, ${c}25 0%, transparent 60%)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Subtle Mesh Grid */}
      {themeSettings.enableMeshTexture && (
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      )}

      {/* Main Responsive Profile Container */}
      <main className="relative z-10 w-full max-w-[460px] px-5 py-10 flex flex-col items-center gap-7 animate-fade-slide-up">
        {/* Profile Header */}
        <header className="flex flex-col items-center text-center gap-3 w-full">
          <div
            className={`relative group ${
              profile.avatarUrl && profile.avatarUrl !== "/image.png" ? "cursor-pointer" : ""
            }`}
            onClick={() => {
              if (profile.avatarUrl && profile.avatarUrl !== "/image.png") {
                setLightboxOpen(true);
              }
            }}
          >
            {/* Glowing Aura Halo (kept strictly behind the avatar with z-0) */}
            <div
              className={`absolute -inset-1.5 ${getAvatarRadius()} animate-gradient-shift z-0 pointer-events-none ${
                themeSettings.enableGlow ? "animate-ring-pulse opacity-85" : "opacity-40"
              }`}
              style={{
                background: `linear-gradient(135deg, ${brandGradient})`,
              }}
            />
            <div className="relative z-10">
              <LetterAvatar
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                shapeClass={getAvatarRadius()}
                className="w-28 h-28"
                accentColor={color1}
                secondaryAccent={color2}
              />
            </div>
          </div>

          {/* Business / Artist Name */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: themeSettings.textColor }}
            >
              {profile.name}
            </h1>
            {layoutSettings.showVerificationBadge && profile.verified && (
              <CheckCircle2
                className="w-5 h-5 flex-shrink-0"
                style={{ color: themeSettings.secondaryAccent }}
              />
            )}
          </div>

          {/* Subtitle Pill Badge */}
          {layoutSettings.showSubtitlePill && profile.subtitle && (
            <div
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border shadow-sm backdrop-blur-md"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: themeSettings.borderColor,
                color: themeSettings.textSecondaryColor,
              }}
            >
              {profile.subtitle}
            </div>
          )}

          {/* Short Bio */}
          {profile.bio && (
            <p
              className="text-sm font-medium leading-relaxed max-w-sm mt-1"
              style={{ color: themeSettings.textSecondaryColor }}
            >
              {profile.bio}
            </p>
          )}
        </header>

        {/* Link Sections */}
        <div className="w-full flex flex-col gap-6">
          {categories.map((cat) => {
            const catLinks = activeLinks.filter((l) => l.category === cat);
            const sectionTitle =
              profile.sections.find((s) => s.sectionKey === cat)?.title ||
              (cat === "music"
                ? "Music & Releases"
                : cat === "social"
                ? "Official Socials"
                : cat === "contact"
                ? "Connect & Fan Hub"
                : cat.toUpperCase());

            return (
              <section key={cat} className="flex flex-col gap-2.5 w-full">
                {/* Section Label */}
                <h2
                  className="text-xs uppercase tracking-wider font-bold px-1 opacity-75"
                  style={{ color: themeSettings.secondaryAccent }}
                >
                  {sectionTitle}
                </h2>

                {/* Link Buttons */}
                <div className="flex flex-col gap-3 w-full">
                  {catLinks.map((link) => {
                    const isHighlighted = link.isHighlighted;

                    return (
                      <a
                        key={link.id}
                        href={isPreview ? undefined : link.url}
                        target={isPreview ? "_self" : "_blank"}
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          handleRipple(e);
                          if (!isPreview && onLinkClick) {
                            onLinkClick(link.id, link.title);
                          }
                        }}
                        className={`ripple-container relative group flex items-center justify-between p-3.5 border transition-all duration-300 ${getButtonRadius()} ${
                          isHighlighted
                            ? "shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25 scale-[1.01]"
                            : "hover:translate-y-[-2px]"
                        }`}
                        style={{
                          backgroundColor: isHighlighted
                            ? "rgba(255, 255, 255, 0.08)"
                            : themeSettings.cardBg,
                          borderColor: isHighlighted
                            ? themeSettings.accentColor
                            : themeSettings.borderColor,
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        {/* Glow outline on highlight */}
                        {isHighlighted && (
                          <div
                            className={`absolute inset-0 ${getButtonRadius()} opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none`}
                            style={{
                              background: `linear-gradient(90deg, ${themeSettings.accentColor}44, ${themeSettings.secondaryAccent}44)`,
                            }}
                          />
                        )}

                        {/* Left: Platform Icon */}
                        <div className="relative z-10 flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          <IconMapper platform={link.platform} className="w-7 h-7 object-contain" />
                        </div>

                        {/* Middle: Title & Badge */}
                        <div className="relative z-10 flex-1 px-3 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-semibold text-sm tracking-tight"
                              style={{ color: themeSettings.textColor }}
                            >
                              {link.title}
                            </span>
                            {link.badge && (
                              <span
                                className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                                style={{
                                  background: `linear-gradient(135deg, ${themeSettings.accentColor}, ${themeSettings.secondaryAccent})`,
                                  color: "#0a0814",
                                }}
                              >
                                {link.badge}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Chevron Arrow */}
                        <div
                          className="relative z-10 flex-shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                          style={{ color: themeSettings.textColor }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        {layoutSettings.showFooterBranding && (
          <footer className="mt-4 text-center">
            <p
              className="text-xs font-medium tracking-wide opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: themeSettings.textSecondaryColor }}
            >
              {layoutSettings.footerText || "Powered by Tap-Maker • Smart Digital Profile"}
            </p>
          </footer>
        )}
      </main>

      {/* Fullscreen Lightbox Modal */}
      {profile.avatarUrl && profile.avatarUrl !== "/image.png" && (
        <Lightbox
          src={profile.avatarUrl}
          alt={profile.name}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
