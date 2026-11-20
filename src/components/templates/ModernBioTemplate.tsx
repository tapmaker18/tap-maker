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
  getRootBackgroundStyle,
  getLinkButtonStyle,
  getAvatarSizeClass,
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
      className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-x-hidden tmaker-profile-root"
      style={{
        ...getRootBackgroundStyle(themeSettings),
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

      {/* Optional Full-Bleed Top Hero Cover Banner */}
      {themeSettings.showHeroBanner && (
        <div
          className="relative w-full h-36 sm:h-44 flex-shrink-0 overflow-hidden z-10"
          style={
            themeSettings.heroBannerImage
              ? {
                  backgroundImage: `url(${themeSettings.heroBannerImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
                }
          }
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 20%, ${themeSettings.bgPrimary || "#0a0814"} 100%)`,
            }}
          />
        </div>
      )}

      {getBgPatternStyle(themeSettings.bgPattern) && (
        <div
          className="absolute inset-0 pointer-events-none opacity-45 z-0"
          style={getBgPatternStyle(themeSettings.bgPattern) || undefined}
        />
      )}

      {/* Full-Viewport Content Container (No Outer Card Box) */}
      <div
        className={`w-full max-w-[480px] flex-1 flex flex-col items-center gap-6 px-5 ${
          themeSettings.showHeroBanner ? "-mt-16 pb-8" : "py-8 sm:py-10"
        } animate-fade-slide-up relative z-10`}
      >
        {/* Floating Custom Badge */}
        {themeSettings.badgeText && (
          <span
            className="text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-full shadow-lg z-20 animate-fade-in tmaker-badge"
            style={{
              backgroundColor: themeSettings.badgeColor || themeSettings.accentColor || color1,
              color: "#ffffff",
            }}
          >
            {themeSettings.badgeText}
          </span>
        )}

        {/* Profile Header */}
        <div
          className={`flex flex-col gap-3 w-full ${
            themeSettings.headerAlign === "left"
              ? "items-start text-left"
              : "items-center text-center"
          }`}
        >
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
              className={`absolute -inset-1.5 ${getAvatarRadius()} opacity-60 blur-md z-0 pointer-events-none`}
              style={{ backgroundColor: color1 }}
            />
            <div className="relative z-10">
              <LetterAvatar
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                shapeClass={getAvatarRadius()}
                className={getAvatarSizeClass(themeSettings.avatarSize)}
                accentColor={color1}
                secondaryAccent={color2}
              />
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 mt-1 ${
              themeSettings.headerAlign === "left"
                ? "justify-start text-left"
                : "justify-center text-center px-4"
            }`}
          >
            <h1
              className={`font-extrabold tracking-tight break-words leading-tight tmaker-name ${getNameSizeClass(profile.name)}`}
              style={{ color: themeSettings.textColor || "#ffffff" }}
            >
              {profile.name}
              {layoutSettings.showVerificationBadge && profile.verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500/20 inline-block ml-1.5 align-middle flex-shrink-0" />
              )}
            </h1>
          </div>

          {layoutSettings.showSubtitlePill && profile.subtitle && (
            <p
              className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border shadow-sm backdrop-blur-md tmaker-subtitle"
              style={{
                backgroundColor: (themeSettings.accentColor || color1) + "25",
                color: themeSettings.accentColor || color1,
                borderColor: (themeSettings.accentColor || color1) + "50",
              }}
            >
              {profile.subtitle}
            </p>
          )}

          {profile.bio && (
            <p
              className="text-xs sm:text-sm font-medium max-w-xs leading-relaxed tmaker-bio"
              style={{ color: themeSettings.textSecondaryColor || "#cbd5e1" }}
            >
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links Stack or 2-Column Grid */}
        <div
          className={
            themeSettings.linkLayout === "grid"
              ? "w-full grid grid-cols-2 gap-3"
              : "w-full flex flex-col gap-2.5"
          }
        >
          {activeLinks.map((link) => {
            const isGrid = themeSettings.linkLayout === "grid";
            const btnAppearance = getLinkButtonStyle(themeSettings, link.isHighlighted);
            return (
              <a
                key={link.id}
                href={isPreview ? undefined : link.url}
                target={isPreview ? "_self" : "_blank"}
                rel="noopener noreferrer"
                className={`group border transition-all duration-200 hover:shadow-lg hover:translate-y-[-2px] tmaker-link-item ${getButtonRadius()} ${
                  isGrid
                    ? "flex flex-col items-center justify-center text-center p-4 gap-2.5 min-h-[110px]"
                    : "flex items-center justify-between p-3.5"
                }`}
                onClick={() => {
                  if (!isPreview && onLinkClick) {
                    onLinkClick(link.id, link.title);
                  }
                }}
                style={btnAppearance.style}
              >
                <div
                  className={
                    isGrid
                      ? "flex flex-col items-center gap-2"
                      : "flex items-center gap-3"
                  }
                >
                  <IconMapper platform={link.platform} className="w-6 h-6 flex-shrink-0" />
                  <span
                    className="font-semibold text-sm tracking-tight"
                    style={{ color: btnAppearance.textColor }}
                  >
                    {link.title}
                  </span>
                </div>

                {!isGrid && (
                  <div className="flex items-center gap-2">
                    {link.badge && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
                        style={{ backgroundColor: themeSettings.accentColor || color1 }}
                      >
                        {link.badge}
                      </span>
                    )}
                    <ExternalLink
                      className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity"
                      style={{ color: btnAppearance.textColor }}
                    />
                  </div>
                )}
              </a>
            );
          })}
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
