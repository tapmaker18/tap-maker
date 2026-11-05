import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

    const apiKey =
      typeof suppliedKey === "string" && suppliedKey.trim()
        ? suppliedKey.trim()
        : process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ApiError("AI Menu Scan is not configured. Contact the Super Admin.", 503);
    }

    await consumeScan(decoded.uid, decoded.role === SUPER_ADMIN_ROLE);

    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const buffer = Buffer.from(await image.arrayBuffer());
    const result = await model.generateContent([
      `You are an expert OCR and menu transcription system. Analyze this photo of a restaurant or cafe menu and output strictly valid JSON, without markdown, matching this shape: {"businessName":"string or null","currency":"PHP, USD, EUR, etc.","categories":[{"name":"Category name","items":[{"name":"Item name","description":"Short description","price":120,"isFeatured":false,"tags":["bestseller"]}]}]}. Do not invent items. Use 0 for missing prices.`,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: image.type || "image/jpeg",
        },
      },
    ]);
    let text = result.response.text().trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new ApiError("AI returned an unreadable menu. Please try a clearer image.", 502);
    }

    return NextResponse.json(toMenuResult(parsed));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to scan the menu.";
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
