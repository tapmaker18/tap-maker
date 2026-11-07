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
      backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    };
  }

  if (pattern === "grid") {
    return {
      backgroundImage:
        "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
    };
  }

  if (pattern === "grain") {
    return {
      backgroundImage:
        "radial-gradient(rgba(255, 255, 255, 0.8) 10%, transparent 10%)",
      backgroundSize: "4px 4px",
    };
  }

  if (pattern === "mesh") {
    return {
      background:
        "radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.3) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.3) 0px, transparent 50%)",
    };
  }

  return null;
}

/**
 * Sanitizes AI-generated or user-provided custom CSS to ensure safety against injection.
 */
export function sanitizeCustomCss(css?: string): string {
  if (!css || typeof css !== "string") return "";
  return css
    .replace(/<[^>]*>/g, "") // Strip any HTML/XML tags
    .replace(/@import\b[^;]*;/gi, "") // Disallow external stylesheet imports
    .replace(/expression\s*\([^)]*\)/gi, "") // Disallow old IE expressions
    .replace(/javascript\s*:/gi, "") // Disallow javascript protocols
    .trim();
}


