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

const AUTO_STYLE_PROMPT = `You are a world-class brand identity designer, visual stylist, and UI/UX color master.
Analyze this image (which may be a company logo, physical storefront, restaurant ambiance, printed dish, menu, or business card).
Extract the visual brand identity and generate a cohesive, aesthetic color palette and theme configuration.

Output strictly valid JSON with no markdown wrapping, matching this exact shape:
{
  "vibe": "Short 2-4 word aesthetic description (e.g. Artisan Warm Espresso, Futuristic Neon Studio, Luxe Executive Corporate, Clean Botanical Bistro)",
  "vibeExplanation": "1-2 sentence description explaining why these colors and mood fit the visual branding",
  "tagline": "A punchy, attractive tagline or brand slogan",
  "themeMode": "dark",
  "primaryColor": "#8b5cf6",
  "secondaryAccent": "#06b6d4",
  "bgPrimary": "#090d16",
  "bgSecondary": "#111827",
  "cardBg": "#1e293b",
  "borderColor": "#334155",
  "textColor": "#f8fafc",
  "textSecondaryColor": "#94a3b8",
  "fontFamily": "Plus Jakarta Sans",
  "buttonRadius": "rounded",
  "suggestedTemplate": "executive-card",
  "suggestedMenuCardStyle": "glass",
  "imageFilter": "vibrant",
  "bgPattern": "none"
}

Important rules:
1. Ensure high WCAG contrast between textColor and bgPrimary / cardBg.
2. If the image is dark or glowing, choose "dark" themeMode. If clean and bright, choose "light" or sleek "dark" based on the brand's aesthetic.
3. Generate realistic, gorgeous hex codes derived from or complementing the colors in the image.
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

  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.8-27b",
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
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
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

