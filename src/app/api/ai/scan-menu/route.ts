import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { getAdminDb, verifyAuthenticatedRequest } from "@/lib/firebaseAdmin";
import { SUPER_ADMIN_ROLE } from "@/lib/admin";
import type { MenuCategory, MenuItem } from "@/lib/types";

export const runtime = "nodejs";

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

const MENU_PROMPT = `You are an expert OCR and menu transcription system. Analyze this photo of a restaurant or cafe menu and output strictly valid JSON, without markdown, matching this shape: {"businessName":"string or null","currency":"PHP, USD, EUR, etc.","categories":[{"name":"Category name","items":[{"name":"Item name","description":"Short description","price":120,"isFeatured":false,"tags":["bestseller"]}]}]}. Do not invent items. Use 0 for missing prices.`;

function toMenuResult(parsed: Record<string, unknown>) {
  const detectedCurrency =
    typeof parsed.currency === "string" && parsed.currency.trim()
      ? parsed.currency.trim()
      : "PHP";
  const categoriesInput = Array.isArray(parsed.categories) ? parsed.categories : [];
  const now = Date.now();

  const categories: MenuCategory[] = categoriesInput.map((category, categoryIndex) => {
    const source = category && typeof category === "object" ? category as Record<string, unknown> : {};
    const itemsInput = Array.isArray(source.items) ? source.items : [];
    const items: MenuItem[] = itemsInput.map((item, itemIndex) => {
      const sourceItem = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const rawPrice = sourceItem.price;
      const price =
        typeof rawPrice === "number"
          ? rawPrice
          : typeof rawPrice === "string"
            ? Number.parseFloat(rawPrice) || 0
            : 0;
      return {
        id: `item_${now}_${categoryIndex}_${itemIndex}_${Math.random().toString(36).slice(2, 6)}`,
        name: typeof sourceItem.name === "string" && sourceItem.name.trim() ? sourceItem.name.trim() : `Item ${itemIndex + 1}`,
        description: typeof sourceItem.description === "string" ? sourceItem.description : "",
        price,
        currency: detectedCurrency,
        isAvailable: true,
        isFeatured: sourceItem.isFeatured === true,
        tags: Array.isArray(sourceItem.tags)
          ? sourceItem.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
        sortOrder: itemIndex,
      };
    });

    return {
      id: `cat_${now}_${categoryIndex}_${Math.random().toString(36).slice(2, 6)}`,
      name: typeof source.name === "string" && source.name.trim() ? source.name.trim() : `Category ${categoryIndex + 1}`,
      items,
      isVisible: true,
      sortOrder: categoryIndex,
    };
  });

  return {
    businessName: typeof parsed.businessName === "string" ? parsed.businessName : undefined,
    currency: detectedCurrency,
    categories,
  };
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
      throw new ApiError("Your account must be approved before using AI Menu Scan.", 403);
    }

    const limit = typeof account.aiScansLimit === "number" ? account.aiScansLimit : 5;
    const used = typeof account.aiScansUsed === "number" ? account.aiScansUsed : 0;
    if (used >= limit) {
      throw new ApiError("Your AI Menu Scan quota has been reached. Please contact the Super Admin for a top-up.", 429);
    }

    transaction.update(userRef, { aiScansUsed: used + 1 });
  });
}

// ── Gemini ────────────────────────────────────────────────────────
async function scanWithGemini(apiKey: string, buffer: Buffer, mimeType: string): Promise<string> {
  const models = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-flash-lite-latest", "gemini-2.5-flash"];
  let lastErr: unknown = null;

  for (const modelName of models) {
    try {
      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
      const result = await model.generateContent([
        MENU_PROMPT,
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: mimeType || "image/jpeg",
          },
        },
      ]);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err) {
      lastErr = err;
      console.warn(`Gemini menu model ${modelName} failed:`, err);
    }
  }

  throw lastErr || new Error("Gemini menu scan failed.");
}

// ── Groq / Vision ────────────────────────────────────────────────
async function scanWithGroq(apiKey: string, buffer: Buffer, mimeType: string): Promise<string> {
  const groq = new Groq({ apiKey });
  const base64Image = buffer.toString("base64");
  const dataUrl = `data:${mimeType || "image/jpeg"};base64,${base64Image}`;

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
              { type: "text", text: MENU_PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1800,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err) {
      lastErr = err;
      console.warn(`Groq menu scan model ${model} failed, trying fallback:`, err);
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
      throw new ApiError("Please choose a menu image to scan.", 400);
    }
    if (!image.type.startsWith("image/")) {
      throw new ApiError("Only image files can be scanned.", 400);
    }
    if (image.size > 8 * 1024 * 1024) {
      throw new ApiError("The menu image must be 8 MB or smaller.", 413);
    }

    const customKey = typeof suppliedKey === "string" ? suppliedKey.trim() : "";
    const groqKey = (customKey.startsWith("gsk_") ? customKey : null) || process.env.GROQ_API_KEY;
    const geminiKey = (!customKey.startsWith("gsk_") && customKey ? customKey : null) || process.env.GEMINI_API_KEY;

    if (!geminiKey && !groqKey) {
      throw new ApiError("AI Menu Scan is not configured. Contact the Super Admin.", 503);
    }

    await consumeScan(decoded.uid, decoded.role === SUPER_ADMIN_ROLE);

    const buffer = Buffer.from(await image.arrayBuffer());
    let text = "";
    let usedProvider = "";

    // Prioritize Groq (fast, high-precision OCR with qwen3.8-27b)
    if (groqKey) {
      try {
        text = await scanWithGroq(groqKey, buffer, image.type);
        usedProvider = "groq";
      } catch (groqError) {
        console.warn("[AI Scan] Groq failed, trying Gemini fallback:", (groqError as Error).message);
        if (geminiKey) {
          text = await scanWithGemini(geminiKey, buffer, image.type);
          usedProvider = "gemini";
        } else {
          throw groqError;
        }
      }
    } else if (geminiKey) {
      text = await scanWithGemini(geminiKey, buffer, image.type);
      usedProvider = "gemini";
    }

    // Strip markdown code fences if present
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new ApiError("AI returned an unreadable menu. Please try a clearer image.", 502);
    }

    const result = toMenuResult(parsed);
    return NextResponse.json({ ...result, _provider: usedProvider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to scan the menu.";
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
