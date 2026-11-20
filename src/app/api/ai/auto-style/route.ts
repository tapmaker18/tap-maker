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

function buildPrompt(
  userPrompt?: string,
  hasImage?: boolean,
  mode: "theme_only" | "full" = "theme_only",
  targetType: "profile" | "menu" = "profile"
): string {
  let prompt = `You are a creative brand stylist. Output ONLY valid JSON (no markdown, no fences, no explanation).
JSON shape:
{"designConcept":"title","vibe":"2-4 words","vibeExplanation":"1 sentence","tagline":"slogan",`;

  if (mode === "full") {
    if (targetType === "menu") {
      prompt += `"badgeText":"promo text or null","contactInfo":{"phone":"or null","address":"or null","openingHours":"or null","website":"or null"},`;
      prompt += `"suggestedActionButtons":[{"title":"e.g. Reserve Table","url":"#","icon":"shopping-bag","badge":"text","isPrimary":true}],`;
      prompt += `"suggestedButtons":[{"title":"e.g. Instagram","url":"#","platform":"instagram","category":"featured","badge":"text","isHighlighted":true}],`;
      prompt += `"suggestedCategories":[{"name":"Category","items":[{"name":"Item","description":"short desc","price":140,"tags":["bestseller"],"isFeatured":true}]}],`;
    } else {
      prompt += `"subtitle":"Title or Role","bio":"1-2 sentence bio","badgeText":"status or null",`;
      prompt += `"contactInfo":{"email":"or null","phone":"or null","location":"or null","company":"or null","website":"or null"},`;
      prompt += `"suggestedButtons":[{"title":"e.g. Follow on Instagram","url":"#","platform":"instagram","category":"featured","badge":"text","isHighlighted":true}],`;
      prompt += `"suggestedActionButtons":[{"title":"e.g. WhatsApp","url":"#","icon":"phone","badge":"text","isPrimary":true}],`;
    }
  }

  prompt += `"themeMode":"dark","primaryColor":"#hex","secondaryAccent":"#hex","bgPrimary":"#hex","bgSecondary":"#hex","cardBg":"rgba(...)","borderColor":"rgba(...)","textColor":"#ffffff","textSecondaryColor":"#cbd5e1","fontFamily":"Plus Jakarta Sans","buttonRadius":"rounded","suggestedTemplate":"executive-card","suggestedMenuCardStyle":"glass","imageFilter":"vibrant","bgPattern":"mesh","customCss":"/* 2-3 CSS rules */"}

RULES:
1. customCss: 2-3 short rules targeting .tmaker-profile-root/.tmaker-menu-root, .tmaker-card, .tmaker-link-item/.tmaker-action-btn with !important
2. Dark themeMode: textColor=#ffffff or #f8fafc; textSecondaryColor=#cbd5e1 or #e2e8f0
3. fontFamily: "Plus Jakarta Sans"|"Space Grotesk"|"Inter"|"Outfit"|"Playfair Display"
4. suggestedTemplate: "executive-card"|"cyber-glow"|"modern-bio"; suggestedMenuCardStyle: "clean"|"glass"|"bordered"
5. buttonRadius: "sharp"|"rounded"|"pill"; imageFilter: "none"|"vibrant"|"warm"|"noir"|"cyber"|"vintage"|"cool"; bgPattern: "none"|"grain"|"dots"|"grid"|"mesh"
6. KEEP OUTPUT UNDER 500 TOKENS. Short text, max 4 buttons, max 2 categories with 2 items each.`;

  if (mode === "full") {
    prompt += `\nBUILDER: Buttons/links/socials -> suggestedButtons + suggestedActionButtons. Food/menu -> suggestedCategories. Contact/hours/address -> contactInfo. Promo -> badgeText. Bio/story -> bio + subtitle. Omit sections the user did not ask for (use [] or null).`;
  }

  if (hasImage && userPrompt) {
    prompt += `\n\nUSER DIRECTION (Tagalog/Filipino/English):\n"${userPrompt}"\nPrioritize this direction, synthesize with the image.`;
  } else if (!hasImage && userPrompt) {
    prompt += `\n\nUSER DIRECTION (Tagalog/Filipino/English):\n"${userPrompt}"\nMatch this direction exactly.`;
  } else {
    prompt += `\n\nDesign the theme based on the image.`;
  }

  return prompt;
}

async function consumeScan(uid: string, isAdmin: boolean): Promise<void> {
  if (isAdmin) return;

  const userRef = getAdminDb().collection("users").doc(uid);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists) {
      throw new ApiError("Your member account could not be found.", 403);
    }

    const account = snapshot.data();
    if (account?.role === "customer") {
      throw new ApiError("Customer accounts cannot use AI Auto-Styling.", 403);
    }
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

async function refundScan(uid: string, isAdmin: boolean): Promise<void> {
  if (isAdmin) return;
  const userRef = getAdminDb().collection("users").doc(uid);
  try {
      await getAdminDb().runTransaction(async (transaction) => {
        const snapshot = await transaction.get(userRef);
        const used = snapshot.data()?.aiScansUsed;
        if (typeof used === "number" && used > 0) {
          transaction.update(userRef, { aiScansUsed: used - 1 });
        }
      });
    } catch (err) {
      console.warn("AI quota refund failed:", err);
    }
  }

  // ── Gemini ────────────────────────────────────────────────────────
  async function scanWithGemini(
    apiKey: string,
    prompt: string,
    buffer?: Buffer | null,
    mimeType?: string
  ): Promise<string> {
    const models = ["gemini-3.8-flash", "gemini-3.8-flash-lite", "gemini-flash-latest"];
    let lastErr: unknown = null;

    for (const modelName of models) {
      try {
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.25,
          },
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
          const contents: any[] = [prompt];
          if (buffer) {
            contents.push({
              inlineData: {
                data: buffer.toString("base64"),
                mimeType: mimeType || "image/jpeg",
              },
            });
          }

          const result = await model.generateContent(contents, {
            signal: controller.signal,
          });
          const text = result.response.text().trim();
          if (text) return text;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        lastErr = err;
        console.warn(`Gemini auto-style model ${modelName} failed or timed out:`, err);
      }
    }

    throw lastErr || new Error("Gemini auto-style failed.");
  }

  // ── Groq / Vision or Text fallback ───────────────────────────────
  async function scanWithGroq(
    apiKey: string,
    prompt: string,
    buffer?: Buffer | null,
    mimeType?: string
  ): Promise<string> {
    const groq = new Groq({ apiKey });

    if (buffer) {
      // Active Groq Vision Model: qwen/qwen3.8-27b
      const base64Image = buffer.toString("base64");
      const dataUrl = `data:${mimeType || "image/jpeg"};base64,${base64Image}`;

      const completion = await groq.chat.completions.create({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 750,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
      throw new Error("Empty response from Groq vision.");
    } else {
      // Text-only prompt (no image): use qwen which is confirmed active on Groq
      const completion = await groq.chat.completions.create({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "system",
            content: "You are a JSON-only API. Output ONLY raw valid JSON with no markdown fences, no explanation, no thinking tags. Do not use <think> tags. Keep output under 650 tokens.",
          },
          {
            role: "user",
            content: prompt + "\n\n/no_think",
          },
        ],
        temperature: 0.2,
        max_tokens: 750,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
      throw new Error("Empty response from Groq text.");
    }
  }

  function extractAndParseJson(rawOutput: string): Record<string, unknown> {
    // Strip qwen thinking tags: <think>...</think> and code fences
    let cleaned = rawOutput
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // 1. Try direct parse first
    try {
      return JSON.parse(cleaned);
    } catch {}

    const firstBrace = cleaned.indexOf("{");
    if (firstBrace === -1) {
      throw new ApiError("The AI generated a response that could not be parsed as valid JSON.", 502);
    }

    const s = cleaned.substring(firstBrace);

    // 2. Progressive salvage: recover truncated JSON by closing arrays, strings, and objects
    for (let i = s.length; i > 0; i--) {
      const ch = s[i - 1];
      if (ch === "}" || ch === '"' || ch === "]" || ch === ";") {
        let sub = s.substring(0, i);
        if (ch === ";") sub += '"';

        // Balance unescaped quotes
        const quotes = (sub.match(/(?<!\\)"/g) || []).length;
        if (quotes % 2 !== 0) sub += '"';

        // Remove any trailing comma before closing brackets
        sub = sub.replace(/,\s*$/, "");

        // Track unclosed brackets and braces
        const opens: string[] = [];
        let inString = false;
        for (let j = 0; j < sub.length; j++) {
          const c = sub[j];
          if (c === '"' && (j === 0 || sub[j - 1] !== "\\")) inString = !inString;
          if (!inString) {
            if (c === "{" || c === "[") opens.push(c);
            else if (c === "}" && opens[opens.length - 1] === "{") opens.pop();
            else if (c === "]" && opens[opens.length - 1] === "[") opens.pop();
          }
        }

        // Close all unclosed opens in reverse order
        while (opens.length > 0) {
          const op = opens.pop();
          if (op === "{") sub += "}";
          else if (op === "[") sub += "]";
        }

        try {
          const res = JSON.parse(sub);
          if (res && typeof res === "object") return res as Record<string, unknown>;
        } catch {}
      }
    }

    throw new ApiError("The AI generated a response that could not be parsed as valid JSON.", 502);
  }

  export async function POST(request: Request) {
    try {
      const decoded = await verifyAuthenticatedRequest(request);
      const formData = await request.formData();
      const image = formData.get("image");
      const userPrompt = formData.get("prompt");
      const suppliedKey = formData.get("apiKey");

      const promptText = typeof userPrompt === "string" ? userPrompt.trim() : "";
      const hasImage = image instanceof File && image.size > 0;

      if (!hasImage && !promptText) {
        throw new ApiError("Please provide a photo or enter a style prompt.", 400);
      }

      if (hasImage && image instanceof File) {
        if (!image.type.startsWith("image/")) {
          throw new ApiError("Only image files can be analyzed.", 400);
        }
        if (image.size > 10 * 1024 * 1024) {
          throw new ApiError("The image must be 10 MB or smaller.", 413);
        }
      }

      const customKey = typeof suppliedKey === "string" ? suppliedKey.trim() : "";
      const groqKey = (customKey.startsWith("gsk_") ? customKey : null) || process.env.GROQ_API_KEY;
      const geminiKey =
        (!customKey.startsWith("gsk_") && customKey ? customKey : null) || process.env.GEMINI_API_KEY;

      if (!geminiKey && !groqKey) {
        throw new ApiError(
          "AI Auto-Style is currently unavailable because no API key is configured. Please provide your own Gemini or Groq API key.",
          503
        );
      }

      const isAdmin = decoded.role === SUPER_ADMIN_ROLE;
      await consumeScan(decoded.uid, isAdmin);

      const requestedMode = (formData.get("mode") as string) === "full" ? "full" : "theme_only";
      const targetType = (formData.get("targetType") as string) === "menu" ? "menu" : "profile";

      // Auto-detect if user prompt requests functions, features, menu items, sections, buttons, or store info in Tagalog or English
      const asksForFullFeatures =
        /\b(button|buttons|pindutan|butones|link|links|shopee|grab|grabfood|foodpanda|lazada|instagram|ig|facebook|fb|whatsapp|tiktok|wifi|reserve|reservation|booking|book|call|contact|order|tawag|oras|hours|schedule|bukas|address|lugar|location|promo|announcement|sale|banner|ribbon|item|items|ulam|pagkain|menu|category|kategorya|drinks|food|kape|coffee|dessert|price|presyo|bio|subtitle|function|dagdag|add|lagyan)\b/i.test(
          promptText
        );

      const wantsFullMode = requestedMode === "full" || asksForFullFeatures;

      // Permission check: default to visual theme only unless Super Admin granted allowAiPageBuilder
      let effectiveMode: "theme_only" | "full" = "theme_only";
      if (wantsFullMode) {
        if (isAdmin) {
          effectiveMode = "full";
        } else {
          const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();
          if (userDoc.exists && userDoc.data()?.allowAiPageBuilder === true) {
            effectiveMode = "full";
          }
        }
      }

      const fullPrompt = buildPrompt(promptText, hasImage, effectiveMode, targetType);
      const buffer = hasImage && image instanceof File ? Buffer.from(await image.arrayBuffer()) : null;
      const mimeType = hasImage && image instanceof File ? image.type : undefined;

      let rawOutput: string | null = null;
      let lastError: unknown = null;
      let parsed: Record<string, unknown>;
      try {

      if (geminiKey) {
        try {
          rawOutput = await scanWithGemini(geminiKey, fullPrompt, buffer, mimeType);
        } catch (err) {
          lastError = err;
          console.warn("Gemini auto-style attempt failed or timed out, trying Groq fallback:", err);
        }
      }

      if (!rawOutput && groqKey) {
        try {
          rawOutput = await scanWithGroq(groqKey, fullPrompt, buffer, mimeType);
        } catch (err) {
          lastError = err;
          console.warn("Groq auto-style attempt failed:", err);
        }
      }

      if (!rawOutput) {
        const hint = lastError instanceof Error ? ` (${lastError.message})` : "";
        throw new ApiError(`Unable to generate theme right now${hint}. Please try again.`, 502);
      }

      parsed = extractAndParseJson(rawOutput);
    } catch (aiErr) {
      // Do not charge the member for a failed generation
      await refundScan(decoded.uid, isAdmin);
      throw aiErr;
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

    // Cross-populate suggestedButtons and suggestedActionButtons so both editors always receive the buttons
    const rawButtons = Array.isArray(parsed.suggestedButtons) ? (parsed.suggestedButtons as any[]) : [];
    const rawActionButtons = Array.isArray(parsed.suggestedActionButtons)
      ? (parsed.suggestedActionButtons as any[])
      : [];

    if (rawButtons.length > 0 && rawActionButtons.length === 0) {
      parsed.suggestedActionButtons = rawButtons.map((b) => {
        let icon = "globe";
        const p = (b.platform || "").toLowerCase();
        if (p.includes("shopee") || p.includes("grab") || p.includes("lazada") || p.includes("order")) {
          icon = "shopping-bag";
        } else if (p.includes("call") || p.includes("phone")) {
          icon = "phone";
        } else if (p.includes("insta")) {
          icon = "instagram";
        } else if (p.includes("face")) {
          icon = "facebook";
        } else if (p.includes("reserve") || p.includes("book")) {
          icon = "calendar";
        } else if (p.includes("chat") || p.includes("what")) {
          icon = "message-circle";
        }
        return {
          title: String(b.title || "Quick Action"),
          url: String(b.url || "#"),
          icon,
          badge: b.badge ? String(b.badge) : null,
          isPrimary: Boolean(b.isHighlighted),
        };
      });
    } else if (rawActionButtons.length > 0 && rawButtons.length === 0) {
      parsed.suggestedButtons = rawActionButtons.map((b) => {
        let platform = "website";
        const ic = (b.icon || "").toLowerCase();
        if (ic.includes("instagram")) platform = "instagram";
        else if (ic.includes("facebook")) platform = "facebook";
        else if (ic.includes("phone")) platform = "phone";
        else if (ic.includes("shopping")) platform = "shopee";
        else if (ic.includes("message")) platform = "whatsapp";

        return {
          title: String(b.title || "Quick Link"),
          url: String(b.url || "#"),
          platform,
          category: "featured",
          badge: b.badge ? String(b.badge) : null,
          isHighlighted: Boolean(b.isPrimary),
        };
      });
    }

    // Attach user prompt and effective builder mode to result
    if (promptText) {
      parsed.userPrompt = promptText;
    }
    parsed.builderMode = effectiveMode;

    return NextResponse.json(parsed);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Auto-Style API unhandled exception:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating the theme." },
      { status: 500 }
    );
  }
}
