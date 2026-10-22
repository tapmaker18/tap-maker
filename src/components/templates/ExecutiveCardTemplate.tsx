"use client";

import React, { useState } from "react";
import { Profile } from "@/lib/types";
import { IconMapper } from "@/components/ui/IconMapper";
import { Lightbox } from "@/components/ui/Lightbox";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  UserPlus,
  Building,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface TemplateProps {
  profile: Profile;
  isPreview?: boolean;
  onLinkClick?: (linkId: string, linkTitle: string) => void;
}

export const ExecutiveCardTemplate: React.FC<TemplateProps> = ({ profile, isPreview = false, onLinkClick }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { themeSettings, layoutSettings, contactInfo, links } = profile;
  const activeLinks = links.filter((l) => l.isActive);

  const color1 = themeSettings.color1 || themeSettings.accentColor || "#0ea5e9";
  const color2 = themeSettings.color2 || themeSettings.secondaryAccent || "#6366f1";

  // Download real vCard .vcf file for direct smartphone import
  const downloadVCard = () => {
    if (isPreview) return;

    const vcard = `BEGIN:VCARD
VERSION:3.0
N:${profile.name};;;;
FN:${profile.name}
ORG:${contactInfo.company || profile.subtitle || "Tap-Maker Digital"}
TITLE:${profile.subtitle || ""}
TEL;TYPE=CELL:${contactInfo.phone || ""}
EMAIL:${contactInfo.email || ""}
URL:${contactInfo.website || ""}
NOTE:${profile.bio || ""}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${profile.slug}-contact.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAvatarRadius = () => {
    if (layoutSettings.avatarShape === "circle") return "rounded-full";
    if (layoutSettings.avatarShape === "squircle") return "rounded-[32px]";
    return "rounded-2xl";
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6"
      style={{
        backgroundColor: themeSettings.bgPrimary,
        color: themeSettings.textColor,
        fontFamily: themeSettings.fontFamily,
      }}
    >
      <main className="w-full max-w-md flex flex-col gap-5 my-auto py-6 animate-fade-slide-up">
        {/* Executive Virtual Card Container */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 border shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: themeSettings.cardBg,
            borderColor: themeSettings.borderColor,
          }}
        >
          {/* Top Decorative Gradient Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background: `linear-gradient(90deg, ${color1}, ${color2})`,
            }}
          />

          {/* Profile Header */}
          <div className="flex items-start gap-4 pt-2">
            {/* Avatar */}
            <div
              className={`relative group flex-shrink-0 ${
                profile.avatarUrl && profile.avatarUrl !== "/image.png" ? "cursor-pointer" : ""
              }`}
              onClick={() => {
                if (profile.avatarUrl && profile.avatarUrl !== "/image.png") {
                  setLightboxOpen(true);
                }
              }}
            >
              <LetterAvatar
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                shapeClass={getAvatarRadius()}
                className="w-20 h-20"
                accentColor={color1}
                secondaryAccent={color2}
              />
            </div>

            {/* Name & Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold tracking-tight truncate">
                  {profile.name}
                </h1>
                {layoutSettings.showVerificationBadge && profile.verified && (
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: themeSettings.accentColor }}
                  />
                )}
              </div>

              {profile.subtitle && (
                <p
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: themeSettings.accentColor }}
                >
                  {profile.subtitle}
                </p>
              )}

              {contactInfo.company && (
                <p className="text-xs flex items-center gap-1 mt-1 opacity-70">
                  <Building className="w-3.5 h-3.5" />
                  <span className="truncate">{contactInfo.company}</span>
                </p>
              )}
            </div>
          </div>

          {/* Bio Statement */}
          {profile.bio && (
            <p
              className="text-xs leading-relaxed mt-4 pt-3 border-t font-normal"
              style={{
                borderColor: themeSettings.borderColor,
                color: themeSettings.textSecondaryColor,
              }}
            >
              {profile.bio}
            </p>
          )}

          {/* Direct Quick Action Buttons (Save Contact, Call, Email) */}
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <button
              onClick={() => {
                downloadVCard();
                if (!isPreview && onLinkClick) {
                  onLinkClick("vcard-save", "Save Contact (vCard)");
                }
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: themeSettings.accentColor,
                color: "#ffffff",
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Save Contact</span>
            </button>

            {contactInfo.phone ? (
              <a
                href={isPreview ? undefined : `tel:${contactInfo.phone}`}
                onClick={() => {
                  if (!isPreview && onLinkClick) {
                    onLinkClick("phone-call", "Call Directly");
                  }
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs border transition-all duration-200 hover:bg-white/10 active:scale-95"
                style={{
                  borderColor: themeSettings.borderColor,
                  color: themeSettings.textColor,
                }}
              >
                <Phone className="w-4 h-4" />
                <span>Call Directly</span>
              </a>
            ) : (
              <a
                href={isPreview ? undefined : `mailto:${contactInfo.email}`}
                onClick={() => {
                  if (!isPreview && onLinkClick) {
                    onLinkClick("email-click", "Send Email");
                  }
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs border transition-all duration-200 hover:bg-white/10 active:scale-95"
                style={{
                  borderColor: themeSettings.borderColor,
                  color: themeSettings.textColor,
                }}
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
            )}
          </div>

          {/* Contact Coordinates List */}
          <div
            className="flex flex-col gap-2 mt-4 pt-4 border-t text-xs"
            style={{
              borderColor: themeSettings.borderColor,
              color: themeSettings.textSecondaryColor,
            }}
          >
            {contactInfo.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 opacity-60 flex-shrink-0" />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="hover:underline truncate"
                >
                  {contactInfo.email}
                </a>
              </div>
            )}
            {contactInfo.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 opacity-60 flex-shrink-0" />
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="hover:underline truncate"
                >
                  {contactInfo.phone}
                </a>
              </div>
            )}
            {contactInfo.location && (
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 opacity-60 flex-shrink-0" />
                <span className="truncate">{contactInfo.location}</span>
              </div>
            )}
            {contactInfo.website && (
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 opacity-60 flex-shrink-0" />
                <a
                  href={contactInfo.website}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline truncate"
                >
                  {contactInfo.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Links Stack */}
        <div className="flex flex-col gap-2.5 w-full">
          <h2
            className="text-[11px] uppercase tracking-wider font-bold px-1 opacity-60"
            style={{ color: themeSettings.textSecondaryColor }}
          >
            Online Presence & Portfolios
          </h2>

          {activeLinks.map((link) => (
            <a
              key={link.id}
              href={link.url === "#vcard" ? undefined : isPreview ? undefined : link.url}
              onClick={() => {
                if (link.url === "#vcard") {
                  downloadVCard();
                  if (!isPreview && onLinkClick) {
                    onLinkClick(link.id, link.title);
                  }
                } else if (!isPreview && onLinkClick) {
                  onLinkClick(link.id, link.title);
                }
              }}
              target={isPreview || link.url === "#vcard" ? "_self" : "_blank"}
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg"
              style={{
                backgroundColor: themeSettings.cardBg,
                borderColor: link.isHighlighted
                  ? themeSettings.accentColor
                  : themeSettings.borderColor,
              }}
            >
              <div className="flex items-center gap-3">
                <IconMapper platform={link.platform} className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold text-xs tracking-tight">
                  {link.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {link.badge && (
                  <span
                    className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: themeSettings.accentColor,
                      color: "#ffffff",
                    }}
                  >
                    {link.badge}
                  </span>
                )}
                <ExternalLink className="w-3.5 h-3.5 opacity-40" />
              </div>
            </a>
          ))}
        </div>

        {layoutSettings.showFooterBranding && (
          <footer className="text-center mt-2">
            <p
              className="text-xs opacity-50"
              style={{ color: themeSettings.textSecondaryColor }}
            >
              {layoutSettings.footerText || "Official Digital Business Pass"}
            </p>
          </footer>
        )}
      </main>

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
