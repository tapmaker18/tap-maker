import { auth } from "./firebase";
import type {
  ThemeSettings,
  MenuThemeSettings,
  TemplateId,
  ImageFilterPreset,
  BgPatternType,
} from "./types";

export interface AutoStyleResult {
  vibe: string;
  designConcept?: string;
  userPrompt?: string;
  vibeExplanation?: string;
  tagline?: string;
  themeMode: "dark" | "light";
  primaryColor: string;
  secondaryAccent: string;
  bgPrimary: string;
  bgSecondary: string;
  cardBg: string;
  borderColor: string;
  textColor: string;
  textSecondaryColor: string;
  fontFamily: "Plus Jakarta Sans" | "Space Grotesk" | "Inter" | "Outfit" | "Playfair Display";
  buttonRadius: "sharp" | "rounded" | "pill";
  suggestedTemplate: TemplateId;
  suggestedMenuCardStyle: "clean" | "glass" | "bordered";
  imageFilter?: ImageFilterPreset;
  bgPattern?: BgPatternType;
  customCss?: string;
}

/**
 * Sends an image or a style prompt (or both) to the AI Auto-Style endpoint.
 * Analyzes the visual brand identity and returns an aesthetic palette & theme configuration.
 * Supports an optional userPrompt to steer the visual design style, or run prompt-only without an image.
 */
export async function scanAutoStyleWithAI(
  imageFile?: File | null,
  customApiKey?: string,
  userPrompt?: string
): Promise<AutoStyleResult> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Please sign in before using AI Auto-Styling.");

  if (!imageFile && !userPrompt?.trim()) {
    throw new Error("Please provide either a photo or a style prompt.");
  }

  const formData = new FormData();
  if (imageFile) formData.append("image", imageFile);
  if (customApiKey?.trim()) formData.append("apiKey", customApiKey.trim());
  if (userPrompt?.trim()) formData.append("prompt", userPrompt.trim());

  const response = await fetch("/api/ai/auto-style", {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Unable to analyze or generate theme."
    );
  }

  return data as AutoStyleResult;
}

