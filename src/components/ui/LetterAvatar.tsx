"use client";

import React, { useState } from "react";

interface LetterAvatarProps {
  name: string;
  avatarUrl?: string;
  shapeClass?: string;
  className?: string;
  accentColor?: string;
  secondaryAccent?: string;
}

export function getInitials(name: string): string {
  if (!name || !name.trim()) return "T";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const LetterAvatar: React.FC<LetterAvatarProps> = ({
  name,
  avatarUrl,
  shapeClass = "rounded-full",
  className = "w-28 h-28",
  accentColor = "#a37bf7",
  secondaryAccent = "#1bdfcf",
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);

  // If avatarUrl exists and has not failed loading
  if (avatarUrl && avatarUrl.trim() && !imageError && avatarUrl !== "/image.png") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImageError(true)}
        className={`${className} ${shapeClass} object-cover shadow-xl border-2 border-slate-900 bg-slate-950 relative z-10`}
      />
    );
  }

  // Derive font size based on size class if not explicitly provided
  let textSize = "text-3xl sm:text-4xl";
  if (className.includes("w-10") || className.includes("h-10")) {
    textSize = "text-xs font-bold";
  } else if (className.includes("w-12") || className.includes("h-12")) {
    textSize = "text-sm font-bold";
  } else if (className.includes("w-16") || className.includes("h-16")) {
    textSize = "text-lg font-bold";
  } else if (className.includes("w-20") || className.includes("h-20")) {
    textSize = "text-2xl font-extrabold";
  } else if (className.includes("w-24") || className.includes("h-24")) {
    textSize = "text-3xl font-extrabold";
  }

  // Otherwise, render a clean letter avatar with brand gradient
  return (
    <div
      className={`${className} ${shapeClass} flex items-center justify-center font-extrabold text-white shadow-xl border-2 border-slate-900 select-none flex-shrink-0 relative z-10`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}, ${secondaryAccent})`,
      }}
      title={name}
    >
      <span className={`${textSize} tracking-tight drop-shadow-md`}>
        {initials}
      </span>
    </div>
  );
};
