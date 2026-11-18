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
  let prompt = `You are a world-class award-winning creative art director, brand stylist, and master CSS visual architect.
DO NOT JUST PICK FLAT COLORS. You must LITERALLY CREATE A UNIQUE, BESPOKE VISUAL DESIGN and author a custom CSS stylesheet that transforms this digital profile card or menu into a genuine work of art tailored to this exact business.

Output strictly valid JSON with no markdown wrapping or fences, matching this exact shape:
{
  "designConcept": "A distinct creative design title (e.g. 'Artisan Roast & Velvet Wood', 'Tokyo Cyberpunk Hologram', 'Minimalist Scandinavian Bistro', 'Luxe Gold Leaf Executive', 'Sun-Drenched Coastal Bistro', 'Neo-Brutalist Bold Streetwear')",
  "vibe": "Short 2-4 word aesthetic description",
  "vibeExplanation": "1-2 sentences explaining why this visual design, lighting, and mood embody this brand",
  "tagline": "A punchy, attractive tagline or brand slogan",`;

  if (mode === "full") {
    if (targetType === "menu") {
      prompt += `
  "badgeText": "Floating Promo / Announcement Ribbon (e.g. 'Flash Sale: 20% Off', 'Buy 1 Take 1', 'Open Daily') or null",
  "contactInfo": {
    "phone": "Phone hotline or null",
    "address": "Store physical location / address or null",
    "openingHours": "Operating hours (e.g. 'Mon-Sun: 8:00 AM - 10:00 PM') or null",
    "website": "https://... or null"
  },
  "suggestedActionButtons": [
    {
      "title": "Button Title (e.g. Reserve Table, Order on GrabFood, Connect to WiFi, WhatsApp, Call Waiter, Waze Directions)",
      "url": "https://food.grab.com or https://wa.me/639123456789 or #",
      "icon": "shopping-bag",
      "badge": "Order Now",
      "isPrimary": true
    }
  ],
  "suggestedButtons": [
    {
      "title": "Button Title (e.g. Order Delivery, Shopee Store, Instagram, Book Appointment)",
      "url": "https://shopee.ph or https://instagram.com or #",
      "platform": "shopee",
      "category": "featured",
      "badge": "Order Now",
      "isHighlighted": true
    }
  ],
  "suggestedCategories": [
    {
      "name": "Category Name (e.g. Signature Coolers, Mains, Specialty Coffee, Pastries)",
      "items": [
        {
          "name": "Item Name (e.g. Mango Graham Shake)",
          "description": "Appetizing 1-sentence description",
          "price": 140,
          "tags": ["bestseller"],
          "isFeatured": true
        }
      ]
    }
  ],`;
    } else {
      prompt += `
  "subtitle": "Professional Title, Role, or Brand Tagline",
  "bio": "Compelling 1-2 sentence bio or brand story",
  "badgeText": "Floating Status / Announcement Ribbon (e.g. 'Open for Collabs', 'Available for Hire', 'Founder') or null",
  "contactInfo": {
    "email": "contact@email.com or null",
    "phone": "+639123456789 or null",
    "location": "City, Country or null",
    "company": "Company Name or null",
    "website": "https://... or null"
  },
  "suggestedButtons": [
    {
      "title": "Button Title (e.g. Order via GrabFood, Shopee Store, Follow on Instagram, Book Appointment, Call Us)",
      "url": "https://shopee.ph/store or https://instagram.com/brand or #",
      "platform": "instagram",
      "category": "featured",
      "badge": "Order Now",
      "isHighlighted": true
    }
  ],
  "suggestedActionButtons": [
    {
      "title": "Button Title (e.g. Reserve Table, Order Delivery, Connect to WiFi)",
      "url": "https://food.grab.com or #",
      "icon": "shopping-bag",
      "badge": "Order Now",
      "isPrimary": true
    }
  ],`;
    }
  }

  prompt += `
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
Author 4 to 6 concise, high-impact CSS rules in "customCss".
Make sure every property has !important so it overrides framework defaults cleanly.
Focus on these key target classes:
- .tmaker-profile-root, .tmaker-menu-root : Page canvas (e.g. radial ambient spotlight at top)
- .tmaker-card, .tmaker-menu-item-card : Main card containers (backdrop-blur, borders, shadows)
- .tmaker-avatar-wrap, .tmaker-menu-logo : Avatar/logo frame (accent border, glow)
- .tmaker-name, .tmaker-menu-title : Brand/person title (color, letter-spacing)
- .tmaker-subtitle, .tmaker-menu-tagline : Subtitle/tagline
- .tmaker-link-item, .tmaker-action-btn : Link/action buttons (colors, hover glow)
Keep "customCss" compact and concise so the JSON response completes without truncation.

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

  if (mode === "full") {
    prompt += `\n\nAUTONOMOUS AI PAGE, CONTENT & FUNCTION BUILDER ACTIVATED:
You are not just a color picker. You are a complete autonomous AI Page and Business Builder that literally implements any feature, function, section, or content the user requests:
1. FUNCTION & ACTION BUTTONS: If the user asks for buttons, links, or functional features (WiFi, Table Reservation, GrabFood, Shopee, Call, WhatsApp, Location/Maps, Socials), generate them in "suggestedActionButtons" and "suggestedButtons".
2. MENU CATEGORIES & ITEMS: If the user asks to add or generate menu categories, food, drinks, or dishes (e.g. "maglagay ka ng Drinks category", "add desserts with prices"), generate them with appetizing names, descriptions, realistic prices (PHP), and tags in "suggestedCategories". If they did not ask for menu items, you may omit "suggestedCategories" or keep it empty.
3. BUSINESS INFO & STORE HOURS: If the user provides or asks for store hours, address, phone number, email, or location, populate them in "contactInfo".
4. ANNOUNCEMENT & PROMO RIBBON: If the user asks for a promo, announcement, or banner (e.g. "Buy 1 Take 1", "Open Daily", "20% Off"), set it in "badgeText".
5. BIO & STORY: If the user asks for bio or role, craft a captivating bio in "bio" and role in "subtitle".
6. VISUAL BRAND IDENTITY: Author the matching bespoke theme palette and custom CSS for this brand concept.`;
  }

  if (hasImage && userPrompt) {
    prompt += `\n\nUSER'S EXPLICIT CREATIVE & STYLE DIRECTION (may be in Tagalog, Filipino, Taglish, or English):\n"${userPrompt}"\nSynthesize the visual branding from the image while STRICTLY FOLLOWING and prioritizing the user's specific creative direction and style vibe above. Understand their aesthetic vision in any language.`;
  } else if (!hasImage && userPrompt) {
    prompt += `\n\nUSER'S EXPLICIT CREATIVE & STYLE DIRECTION (may be in Tagalog, Filipino, Taglish, or English):\n"${userPrompt}"\nAuthor the entire theme, palette, typography, vibe, design concept, and bespoke custom CSS based strictly on this style direction. Understand their aesthetic vision in any language.`;
  } else {
    prompt += `\n\nExtract and author the entire bespoke theme, palette, and custom CSS based on the visual branding and atmosphere of the provided image.`;
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
async function scanWithGemini(
  apiKey: string,
  prompt: string,
  buffer?: Buffer | null,
  mimeType?: string
): Promise<string> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.25,
    },
  });

  // Fast 3.5s timeout: if Google free tier is hanging or 503-ing, abort fast and hand over to Groq
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

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
    throw new Error("Empty response from Gemini.");
  } finally {
    clearTimeout(timeoutId);
  }
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
      max_tokens: 1500,
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
          content: "You are a JSON-only API. Output ONLY raw valid JSON with no markdown fences, no explanation, no thinking tags. Do not use <think> tags.",
        },
        {
          role: "user",
          content: prompt + "\n\n/no_think",
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (text) return text;
    throw new Error("Empty response from Groq text.");
  }
}

function extractAndParseJson(rawOutput: string): Record<string, unknown> {
  // Strip qwen thinking tags: <think>...</think>
  let cleaned = rawOutput
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {}

  const firstBrace = cleaned.indexOf("{");
  if (firstBrace !== -1) {
    const candidate = cleaned.substring(firstBrace);

    // Try parsing candidate directly or up to last brace
    const lastBrace = candidate.lastIndexOf("}");
    if (lastBrace > 0) {
      try {
        return JSON.parse(candidate.substring(0, lastBrace + 1));
      } catch {}
    }

    // If truncated inside customCss string, trim back to the last complete CSS rule ending with semicolon
    const lastSemi = candidate.lastIndexOf(";");
    if (lastSemi > 0) {
      try {
        const rescued = candidate.substring(0, lastSemi + 1) + '" }';
        return JSON.parse(rescued);
      } catch {}
    }

    // Try counting unescaped quotes and closing braces
    let testStr = (lastBrace > 0 ? candidate.substring(0, lastBrace + 1) : candidate).trim();
    testStr = testStr.replace(/,\s*$/, "");
    const quoteCount = (testStr.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) testStr += '"';
    if (!testStr.endsWith("}")) testStr += "}";
    try {
      return JSON.parse(testStr);
    } catch {}
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

    const parsed = extractAndParseJson(rawOutput);

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
