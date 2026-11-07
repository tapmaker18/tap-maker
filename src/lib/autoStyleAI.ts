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
}

/**
 * Sends an image (photo of shop, logo, dish, or business card) to the AI Auto-Style endpoint.
 * Analyzes the visual brand identity and returns an aesthetic palette & theme configuration.
 */
export async function scanAutoStyleWithAI(
  imageFile: File,
  customApiKey?: string
): Promise<AutoStyleResult> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Please sign in before using AI Auto-Styling.");

  const formData = new FormData();
  formData.append("image", imageFile);
  if (customApiKey?.trim()) formData.append("apiKey", customApiKey.trim());

  const response = await fetch("/api/ai/auto-style", {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Unable to analyze this image."
    );
  }

  return data as AutoStyleResult;
}

