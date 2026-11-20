import React from "react";
import type { ThemeSettings, MenuThemeSettings } from "./types";

/**
 * Returns dynamic CSS filter property combining brightness, contrast, saturation,
 * and 1-click photo filter presets (e.g. vibrant, warm, noir, cyber, vintage, cool).
 */
export function getImageFilterStyle(
  theme?: Partial<ThemeSettings> | Partial<MenuThemeSettings>
): React.CSSProperties {
  if (!theme) return {};

  const b = ("imageBrightness" in theme ? theme.imageBrightness : undefined) ?? 100;
  const c = ("imageContrast" in theme ? theme.imageContrast : undefined) ?? 100;
  const s = ("imageSaturation" in theme ? theme.imageSaturation : undefined) ?? 100;

  let filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;

  switch (theme.imageFilter) {
    case "vibrant":
      filter += " saturate(145%) contrast(110%)";
      break;
    case "warm":
      filter += " sepia(25%) saturate(120%)";
      break;
    case "noir":
      filter += " grayscale(100%) contrast(120%)";
      break;
    case "cyber":
      filter += " hue-rotate(15deg) contrast(120%) brightness(105%)";
      break;
    case "vintage":
      filter += " sepia(35%) contrast(95%) brightness(95%)";
      break;
    case "cool":
      filter += " hue-rotate(-15deg) saturate(110%)";
      break;
    case "none":
    default:
      break;
  }

  return { filter: filter.trim() };
}

/**
 * Returns CSS classes for glassmorphism blur intensity.
 */
export function getGlassBlurClass(intensity?: string): string {
  switch (intensity) {
    case "sm":
      return "backdrop-blur-sm";
    case "md":
      return "backdrop-blur-md";
    case "lg":
      return "backdrop-blur-xl";
    case "none":
    default:
      return "";
  }
}

/**
 * Returns inline style for background texture overlay patterns.
 */
export function getBgPatternStyle(pattern?: string): React.CSSProperties | null {
  if (!pattern || pattern === "none") return null;

  if (pattern === "dots") {
    return {
      backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.55) 1.5px, transparent 1.5px)",
      backgroundSize: "22px 22px",
    };
  }

  if (pattern === "grid") {
    return {
      backgroundImage:
        "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)",
      backgroundSize: "30px 30px",
    };
  }

  if (pattern === "grain") {
    return {
      backgroundImage:
        "radial-gradient(rgba(255, 255, 255, 0.7) 12%, transparent 12%)",
      backgroundSize: "5px 5px",
    };
  }

  if (pattern === "mesh") {
    return {
      background:
        "radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.45) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.45) 0px, transparent 55%)",
    };
  }

  return null;
}

/**
 * Computes full-viewport root background styling for solid, gradient, or aurora mesh modes.
 */
export function getRootBackgroundStyle(theme: Partial<ThemeSettings>): React.CSSProperties {
  const bg1 = theme.bgPrimary || "#0a0814";
  const bg2 = theme.bgSecondary || "#1e1b4b";
  const c1 = theme.color1 || theme.accentColor || "#a37bf7";
  const c2 = theme.color2 || theme.secondaryAccent || "#1bdfcf";
  const angle = typeof theme.bgGradientAngle === "number" ? theme.bgGradientAngle : 135;

  if (theme.bgType === "gradient") {
    return {
      backgroundColor: bg1,
      backgroundImage: `linear-gradient(${angle}deg, ${bg1} 0%, ${bg2} 100%)`,
    };
  }

  if (theme.bgType === "mesh") {
    return {
      backgroundColor: bg1,
      backgroundImage: `radial-gradient(circle at 15% 15%, ${c1}38 0%, transparent 48%), radial-gradient(circle at 85% 80%, ${c2}30 0%, transparent 50%), linear-gradient(180deg, ${bg1} 0%, ${bg2} 100%)`,
    };
  }

  return {
    backgroundColor: bg1,
  };
}

/**
 * Computes high-impact link button inline styles based on buttonStyle
 * (glass, gradient, flat, outline, shadow) so changes are immediately dramatic.
 */
export function getLinkButtonStyle(
  theme: Partial<ThemeSettings>,
  isHighlighted = false
): { style: React.CSSProperties; textColor: string } {
  const c1 = theme.color1 || theme.accentColor || "#a37bf7";
  const c2 = theme.color2 || theme.secondaryAccent || "#1bdfcf";
  const textCol = theme.textColor || "#ffffff";
  const mode = theme.buttonStyle || "glass";

  if (mode === "gradient") {
    return {
      style: {
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        borderColor: "rgba(255, 255, 255, 0.25)",
        boxShadow: isHighlighted ? `0 12px 30px -6px ${c1}80` : `0 6px 20px -6px ${c1}55`,
      },
      textColor: "#ffffff",
    };
  }

  if (mode === "flat") {
    return {
      style: {
        backgroundColor: c1,
        borderColor: c1,
        boxShadow: isHighlighted ? `0 10px 26px -6px ${c1}80` : "none",
      },
      textColor: "#ffffff",
    };
  }

  if (mode === "outline") {
    return {
      style: {
        backgroundColor: isHighlighted ? `${c1}18` : "transparent",
        borderColor: isHighlighted ? c2 : c1,
        borderWidth: "2px",
      },
      textColor: textCol,
    };
  }

  if (mode === "shadow") {
    return {
      style: {
        backgroundColor: theme.cardBg || "rgba(15, 23, 42, 0.9)",
        borderColor: c1,
        borderWidth: "2px",
        boxShadow: `4px 4px 0px ${isHighlighted ? c2 : c1}`,
      },
      textColor: textCol,
    };
  }

  // Default: glass
  return {
    style: {
      backgroundColor: isHighlighted ? `${c1}26` : theme.cardBg || "rgba(255, 255, 255, 0.06)",
      borderColor: isHighlighted ? c1 : theme.borderColor || "rgba(255, 255, 255, 0.14)",
      backdropFilter: "blur(14px)",
    },
    textColor: textCol,
  };
}

export function getAvatarSizeClass(size?: string): string {
  if (size === "sm") return "w-20 h-20";
  if (size === "lg") return "w-36 h-36";
  return "w-28 h-28";
}

/**
 * Sanitizes AI-generated or user-provided custom CSS to ensure safety against injection.
 */
export function sanitizeCustomCss(css?: string): string {
  if (!css || typeof css !== "string") return "";
  return css
    .slice(0, 15000) // Cap maximum CSS length against DoS
    .replace(/<[^>]*>/g, "") // Strip any HTML/XML tags (including </style>)
    .replace(/@import\b[^;]*;?/gi, "") // Disallow external stylesheet imports
    .replace(/expression\s*\([^)]*\)/gi, "") // Disallow old IE expressions
    .replace(/javascript\s*:/gi, "") // Disallow javascript protocols
    .replace(/url\s*\(\s*['"]?\s*(?:https?:|data:text\/html|\/\/)[^)]*\)/gi, "none") // Block external URL tracking/exfiltration in CSS
    .trim();
}


