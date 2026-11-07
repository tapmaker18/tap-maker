import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { getAdminDb, verifyAuthenticatedRequest } from "@/lib/firebaseAdmin";
import { SUPER_ADMIN_ROLE } from "@/lib/admin";

export const runtime = "nodejs";

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

const AUTO_STYLE_PROMPT = `You are a world-class award-winning creative art director, brand stylist, and master CSS visual architect.
Analyze this image (which may be a company logo, physical storefront, restaurant ambiance, signature dish, printed menu, or business card).
DO NOT JUST PICK FLAT COLORS. You must LITERALLY CREATE A UNIQUE, BESPOKE VISUAL DESIGN and author a custom CSS stylesheet that transforms this digital profile card or menu into a genuine work of art tailored to this exact business.

Output strictly valid JSON with no markdown wrapping or fences, matching this exact shape:
{
  "designConcept": "A distinct creative design title (e.g. 'Artisan Roast & Velvet Wood', 'Tokyo Cyberpunk Hologram', 'Minimalist Scandinavian Bistro', 'Luxe Gold Leaf Executive', 'Sun-Drenched Coastal Bistro', 'Neo-Brutalist Bold Streetwear')",
  "vibe": "Short 2-4 word aesthetic description",
  "vibeExplanation": "1-2 sentences explaining why this visual design, lighting, and mood embody this brand",
  "tagline": "A punchy, attractive tagline or brand slogan",
  "themeMode": "dark",
  "primaryColor": "#f59e0b",
  "secondaryAccent": "#d97706",
  "bgPrimary": "#0e0906",
  "bgSecondary": "#1a120c",
  "cardBg": "rgba(30, 20, 14, 0.8)",
  "borderColor": "rgba(245, 158, 11, 0.25)",
  "textColor": "#ffffff",
  "textSecondaryColor": "#cbd5e1",
  "fontFamily": "Plus Jakarta Sans",
  "buttonRadius": "rounded",
  "suggestedTemplate": "executive-card",
  "suggestedMenuCardStyle": "glass",
  "imageFilter": "vibrant",
  "bgPattern": "mesh",
  "customCss": "/* Scoped custom CSS designed specifically for this brand */"
}

CUSTOM CSS DESIGN INSTRUCTIONS:
Author 10 to 25 lines of elegant, creative, high-impact CSS rules in "customCss".
Make sure every property has !important so it overrides framework defaults cleanly.
Use the following target classes:
- .tmaker-profile-root, .tmaker-menu-root : Page canvas (give it unique radial ambient lighting spotlight at the top reflecting the primary color, e.g. radial-gradient(circle at 50% 12%, [primaryColor]25 0%, transparent 60%), [bgPrimary] !important)
- .tmaker-card, .tmaker-menu-item-card : Main card containers (give them distinctive borders, glassmorphism backdrop-blur: 20px, custom border-radius: 28px, deep box-shadows with subtle primary color glow)
- .tmaker-avatar-wrap, .tmaker-menu-logo : Avatar/logo frame (custom box-shadow glow ring with primary color, smooth hover scale)
- .tmaker-name, .tmaker-menu-title : Brand/person title (pure white #ffffff, letter-spacing: -0.02em, subtle text-shadow with primary color glow)
- .tmaker-subtitle, .tmaker-menu-tagline : Subtitle/tagline (pill with subtle primary color background tint, glowing border, crisp readable text)
- .tmaker-bio : Bio text (crisp readable light color #e2e8f0, never dark or muddy)
- .tmaker-link-item : Profile link buttons (subtle glass background, border highlight, smooth hover translateY(-3px) and glow on hover)
- .tmaker-action-btn : Primary action buttons (Save Contact, Call store)
- .tmaker-badge, .tmaker-menu-badge : Custom badge or ribbon (metallic gradient, neon tag, or frosted pill)
- .tmaker-menu-category-btn : Menu category navigation pills
- .tmaker-menu-item-price : Dish price tag styling

CRITICAL CONTRAST & READABILITY RULES:
1. textColor MUST ALWAYS be #ffffff or #f8fafc on dark themeMode. NEVER generate dark brown, dark gray, or low-contrast text.
2. textSecondaryColor MUST ALWAYS be light and easily readable (#cbd5e1 or #e2e8f0). NEVER generate dark gray or dark brown on dark backgrounds.
3. In "customCss", write ONLY pure CSS rules. NEVER include <style> tags or HTML.
4. "fontFamily" must be one of: "Plus Jakarta Sans", "Space Grotesk", "Inter", "Outfit", "Playfair Display".
5. "suggestedTemplate" must be one of: "executive-card", "cyber-glow", "modern-bio".
6. "suggestedMenuCardStyle" must be one of: "clean", "glass", "bordered".
7. "buttonRadius" must be one of: "sharp", "rounded", "pill".
8. "imageFilter" must be one of: "none", "vibrant", "warm", "noir", "cyber", "vintage", "cool".
9. "bgPattern" must be one of: "none", "grain", "dots", "grid", "mesh".`;

async function consumeScan(uid: string, isAdmin: boolean): Promise<void> {
  if (isAdmin) return;

  const userRef = getAdminDb().collection("users").doc(uid);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists) {
      throw new ApiError("Your member account could not be found.", 403);
    }

    const account = snapshot.data();
    if (account?.status !== "approved") {
      throw new ApiError("Your account must be approved before using AI Auto-Styling.", 403);
    }

    const limit = typeof account.aiScansLimit === "number" ? account.aiScansLimit : 5;
    const used = typeof account.aiScansUsed === "number" ? account.aiScansUsed : 0;
    if (used >= limit) {
      throw new ApiError(
        "Your AI quota has been reached. Please contact the Super Admin for a top-up.",
        429
      );
    }

    transaction.update(userRef, { aiScansUsed: used + 1 });
  });
}

// ── Gemini ────────────────────────────────────────────────────────
async function scanWithGemini(apiKey: string, buffer: Buffer, mimeType: string): Promise<string> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  const result = await model.generateContent([
    AUTO_STYLE_PROMPT,
    {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: mimeType || "image/jpeg",
      },
    },
  ]);
  return result.response.text().trim();
}

// ── Groq / Vision fallback ───────────────────────────────────────
async function scanWithGroq(apiKey: string, buffer: Buffer, mimeType: string): Promise<string> {
  const groq = new Groq({ apiKey });
  const base64Image = buffer.toString("base64");
  const dataUrl = `data:${mimeType || "image/jpeg"};base64,${base64Image}`;

  // Try llama-3.2-11b-vision-preview first (higher limits), then qwen
  const models = ["llama-3.2-11b-vision-preview", "qwen/qwen3.8-27b"];
  let lastErr: unknown = null;

  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: AUTO_STYLE_PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 750, // Keep within Groq on-demand OTPM limit of 1000
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err) {
      lastErr = err;
      console.warn(`Groq model ${model} auto-style failed, trying fallback:`, err);
    }
  }

  throw lastErr || new Error("Groq vision analysis failed.");
}

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthenticatedRequest(request);
    const formData = await request.formData();
    const image = formData.get("image");
    const suppliedKey = formData.get("apiKey");

    if (!(image instanceof File) || image.size === 0) {
      throw new ApiError("Please choose an image or photo to analyze.", 400);
    }
    if (!image.type.startsWith("image/")) {
      throw new ApiError("Only image files can be analyzed.", 400);
    }
    if (image.size > 10 * 1024 * 1024) {
      throw new ApiError("The image must be 10 MB or smaller.", 413);
    }

    const customKey = typeof suppliedKey === "string" ? suppliedKey.trim() : "";
    const groqKey = (customKey.startsWith("gsk_") ? customKey : null) || process.env.GROQ_API_KEY;
    const geminiKey =
      (!customKey.startsWith("gsk_") && customKey ? customKey : null) || process.env.GEMINI_API_KEY;

    if (!geminiKey && !groqKey) {
      throw new ApiError(
        "AI Auto-Style is currently unavailable because no API key is configured. Please provide your own Gemini API key or contact support.",
        503
      );
    }

    const isAdmin = decoded.role === SUPER_ADMIN_ROLE;
    await consumeScan(decoded.uid, isAdmin);

    const buffer = Buffer.from(await image.arrayBuffer());
    let rawOutput: string | null = null;
    let lastError: unknown = null;

    if (geminiKey) {
      try {
        rawOutput = await scanWithGemini(geminiKey, buffer, image.type);
      } catch (err) {
        lastError = err;
        console.warn("Gemini auto-style attempt failed:", err);
      }
    }

    if (!rawOutput && groqKey) {
      try {
        rawOutput = await scanWithGroq(groqKey, buffer, image.type);
      } catch (err) {
        lastError = err;
        console.warn("Groq auto-style attempt failed:", err);
      }
    }

    if (!rawOutput) {
      const hint = lastError instanceof Error ? ` (${lastError.message})` : "";
      throw new ApiError(`Unable to analyze the image right now${hint}. Please try another photo.`, 502);
    }

    // Clean JSON markdown fences if present
    const cleaned = rawOutput
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new ApiError("The AI generated a response that could not be parsed as valid JSON.", 502);
    }

    // Safety auto-correction for contrast & readability:
    // If dark mode is selected, ensure textColor and textSecondaryColor are never dark or muddy
    const isDarkHex = (hex: unknown): boolean => {
      if (typeof hex !== "string" || !hex.startsWith("#")) return false;
      const clean = hex.replace("#", "");
      const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
      if (isNaN(num)) return false;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      return lum < 140; // below 140 is too dark for dark backgrounds
    };

    if (parsed.themeMode === "dark" || !parsed.themeMode) {
      if (!parsed.textColor || isDarkHex(parsed.textColor)) {
        parsed.textColor = "#ffffff";
      }
      if (!parsed.textSecondaryColor || isDarkHex(parsed.textSecondaryColor)) {
        parsed.textSecondaryColor = "#cbd5e1";
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Auto-Style API unhandled exception:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while analyzing the image." },
      { status: 500 }
    );
  }
}

