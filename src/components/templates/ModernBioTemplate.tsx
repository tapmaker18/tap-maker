"use client";

import React, { useState } from "react";
import { Profile } from "@/lib/types";
import { IconMapper } from "@/components/ui/IconMapper";
import { Lightbox } from "@/components/ui/Lightbox";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { ChevronRight, CheckCircle, ExternalLink } from "lucide-react";
import {
  getImageFilterStyle,
  getBgPatternStyle,
  sanitizeCustomCss,
} from "@/lib/visualEffects";

interface TemplateProps {
  profile: Profile;
  isPreview?: boolean;
  onLinkClick?: (linkId: string, linkTitle: string) => void;
}

export const ModernBioTemplate: React.FC<TemplateProps> = ({ profile, isPreview = false, onLinkClick }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { themeSettings, layoutSettings, links } = profile;
  const activeLinks = links.filter((l) => l.isActive);

  const color1 = themeSettings.color1 || themeSettings.accentColor || "#4f46e5";
  const color2 = themeSettings.color2 || themeSettings.secondaryAccent || "#06b6d4";

  const getAvatarRadius = () => {
    if (layoutSettings.avatarShape === "squircle") return "rounded-[28px]";
    if (layoutSettings.avatarShape === "rounded-square") return "rounded-2xl";
    return "rounded-full";
  };

  const getButtonRadius = () => {
    if (themeSettings.buttonRadius === "sharp") return "rounded-lg";
    if (themeSettings.buttonRadius === "pill") return "rounded-full";
    return "rounded-2xl";
  };

  const getNameSizeClass = (name: string = "") => {
    const len = name.trim().length;
    if (len > 28) return "text-lg sm:text-xl";
    if (len > 18) return "text-xl sm:text-2xl";
    return "text-2xl sm:text-3xl";
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 tmaker-profile-root"
      style={{
        backgroundColor: themeSettings.bgPrimary,
        color: themeSettings.textColor,
        fontFamily: themeSettings.fontFamily,
      }}
    >
      {themeSettings.customCss && (
        <style
          dangerouslySetInnerHTML={{
            __html: sanitizeCustomCss(themeSettings.customCss),
          }}
        />
      )}

      {getBgPatternStyle(themeSettings.bgPattern) && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20 z-0"
          style={getBgPatternStyle(themeSettings.bgPattern) || undefined}
        />
      )}

      <div className="w-full max-w-md flex flex-col items-center gap-6 my-auto py-6 animate-fade-slide-up relative z-10">
        {/* Floating Custom Badge */}
        {themeSettings.badgeText && (
          <span
            className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md z-20 animate-fade-in tmaker-badge"
            style={{
              backgroundColor: themeSettings.badgeColor || themeSettings.accentColor || color1,
              color: "#ffffff",
            }}
          >
            {themeSettings.badgeText}
          </span>
        )}

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={`relative group transition-transform duration-300 tmaker-avatar-wrap ${
              profile.avatarUrl && profile.avatarUrl !== "/image.png"
                ? "cursor-pointer hover:scale-105"
                : ""
            }`}
            style={getImageFilterStyle(themeSettings)}
            onClick={() => {
              if (profile.avatarUrl && profile.avatarUrl !== "/image.png") {
                setLightboxOpen(true);
              }
            }}
          >
            <div
              className={`absolute -inset-1 ${getAvatarRadius()} opacity-50 blur-sm z-0 pointer-events-none`}
              style={{ backgroundColor: color1 }}
            />
            <div className="relative z-10">
              <LetterAvatar
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                shapeClass={getAvatarRadius()}
                className="w-24 h-24"
                accentColor={color1}
                secondaryAccent={color2}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-1 px-4 text-center">
            <h1 className={`font-bold tracking-tight break-words leading-tight tmaker-name ${getNameSizeClass(profile.name)}`}>
              {profile.name}
              {layoutSettings.showVerificationBadge && profile.verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500/20 inline-block ml-1.5 align-middle flex-shrink-0" />
              )}
            </h1>
          </div>

          {layoutSettings.showSubtitlePill && profile.subtitle && (
            <p className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 opacity-80 tmaker-subtitle">
              {profile.subtitle}
            </p>
          )}

          {profile.bio && (
            <p
              className="text-xs sm:text-sm font-normal max-w-xs leading-relaxed tmaker-bio"
              style={{ color: themeSettings.textSecondaryColor }}
            >
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links Stack */}
        <div className="w-full flex flex-col gap-3">
          {activeLinks.map((link) => (
            <a
              key={link.id}
              href={isPreview ? undefined : link.url}
              target={isPreview ? "_self" : "_blank"}
              rel="noopener noreferrer"
              className={`group flex items-center justify-between p-3.5 border transition-all duration-200 hover:shadow-md hover:translate-y-[-1px] tmaker-link-item ${getButtonRadius()}`}
              onClick={() => {
                if (!isPreview && onLinkClick) {
                  onLinkClick(link.id, link.title);
                }
              }}
              style={{
                backgroundColor: themeSettings.cardBg,
                borderColor: link.isHighlighted
                  ? themeSettings.accentColor
                  : themeSettings.borderColor,
              }}
            >
              <div className="flex items-center gap-3">
                <IconMapper platform={link.platform} className="w-6 h-6 flex-shrink-0" />
                <span className="font-semibold text-sm tracking-tight">
                  {link.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {link.badge && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: themeSettings.accentColor }}
                  >
                    {link.badge}
                  </span>
                )}
                <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {layoutSettings.showFooterBranding && (
        <footer className="text-xs opacity-50 pb-4 text-center">
          {layoutSettings.footerText || "Created with Tap-Maker"}
        </footer>
      )}

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
