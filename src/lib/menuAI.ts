import { auth } from "./firebase";
import type { MenuCategory } from "./types";

export interface ScanMenuResult {
  businessName?: string;
  currency?: string;
  categories: MenuCategory[];
}

/** Stores only a customer-provided key for their own scans. */
export function getGeminiApiKey(): string | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("tapmaker_gemini_api_key");
  return saved?.trim() || null;
}

export function saveGeminiApiKey(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("tapmaker_gemini_api_key", key.trim());
  }
}

export function clearGeminiApiKey(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("tapmaker_gemini_api_key");
  }
}

/**
 * Sends the image to the authenticated server endpoint. The app-owned Gemini
 * key and quota transaction stay on the server and never reach the browser.
 */
export async function scanMenuWithGemini(
  imageFile: File,
  customApiKey?: string
): Promise<ScanMenuResult> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Please sign in before using AI Menu Scan.");

  const formData = new FormData();
  formData.append("image", imageFile);
  if (customApiKey?.trim()) formData.append("apiKey", customApiKey.trim());

  const response = await fetch("/api/ai/scan-menu", {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Unable to scan this menu image.");
  }
  return data as ScanMenuResult;
}
