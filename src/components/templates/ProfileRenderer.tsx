"use client";

import React from "react";
import { Profile } from "@/lib/types";
import { CyberGlowTemplate } from "./CyberGlowTemplate";
import { ModernBioTemplate } from "./ModernBioTemplate";
import { ExecutiveCardTemplate } from "./ExecutiveCardTemplate";

interface ProfileRendererProps {
  profile: Profile;
  isPreview?: boolean;
  onLinkClick?: (linkId: string, linkTitle: string) => void;
}

export const ProfileRenderer: React.FC<ProfileRendererProps> = ({ profile, isPreview = false, onLinkClick }) => {
  switch (profile.templateId) {
    case "modern-bio":
      return <ModernBioTemplate profile={profile} isPreview={isPreview} onLinkClick={onLinkClick} />;
    case "executive-card":
      return <ExecutiveCardTemplate profile={profile} isPreview={isPreview} onLinkClick={onLinkClick} />;
    case "cyber-glow":
    default:
      return <CyberGlowTemplate profile={profile} isPreview={isPreview} onLinkClick={onLinkClick} />;
  }
};
