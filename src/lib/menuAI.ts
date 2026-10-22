import { GoogleGenerativeAI } from "@google/generative-ai";
import { MenuCategory, MenuItem } from "./types";

export interface ScanMenuResult {
  businessName?: string;
  currency?: string;
  categories: MenuCategory[];
}

/**
 * Gets the Gemini API key from environment variable or localStorage.
 */
export function getGeminiApiKey(): string | null {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("tapmaker_gemini_api_key");
    if (saved && saved.trim().length > 0) return saved.trim();
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
}

/**
 * Saves a user-provided Gemini API key to localStorage.
 */
export function saveGeminiApiKey(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("tapmaker_gemini_api_key", key.trim());
  }
}

/**
 * Clears the stored Gemini API key from localStorage.
 */
export function clearGeminiApiKey(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("tapmaker_gemini_api_key");
  }
}

/**
 * Converts a File to a base64 string.
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type || "image/jpeg",
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Scans an image of a printed menu using Gemini 2.0 Flash and extracts
 * structured categories, items, prices, and descriptions.
 */
export async function scanMenuWithGemini(
  imageFile: File,
  customApiKey?: string
): Promise<ScanMenuResult> {
  const apiKey = (customApiKey && customApiKey.trim()) || getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      "Gemini API key is required. Please set NEXT_PUBLIC_GEMINI_API_KEY or provide your free Google AI Studio API key."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `
You are an expert OCR and menu transcription system.
Analyze this photo of a restaurant / café / food menu and extract all the categories and food / drink items.

Output strictly valid JSON (no markdown formatting, no code blocks, no other text) with the following structure:
{
  "businessName": "Name of the restaurant or cafe if visible, else null",
  "currency": "PHP, USD, EUR, etc. (currency symbol or code detected)",
  "categories": [
    {
      "name": "Category Name (e.g. Espresso Drinks, Appetizers, Pastas)",
      "items": [
        {
          "name": "Item Name",
          "description": "Short description of ingredients or notes if visible",
          "price": 120, // numeric price only, no currency symbol
          "isFeatured": false, // true if marked as bestseller, chef's special, or highlighted
          "tags": ["bestseller", "iced", "hot", "vegan", etc if indicated]
        }
      ]
    }
  ]
}

Important instructions:
- Do not invent items that are not in the picture.
- If an item has multiple sizes/prices (e.g. 12oz: 120, 16oz: 150), pick the base/smaller price or write the details in the description.
- Prices must be raw numbers (e.g., 150 instead of "₱150.00"). If price is missing or unreadable, default to 0.
- Group items accurately under their visible section headings.
- Clean up any OCR typos while keeping authentic names.
- Output ONLY pure JSON.
`;

  // Candidate models: gemini-2.5-flash (recommended by API), with automatic fallback to 1.5-flash
  const candidateModels = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  let response: any = null;
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, imagePart]);
      response = await result.response;
      if (response) break;
    } catch (err: any) {
      console.warn(`Gemini model ${modelName} error, trying next fallback:`, err?.message || err);
      lastError = err;
    }
  }

  if (!response) {
    throw lastError || new Error("Failed to process menu image with Gemini API.");
  }

  let text = response.text().trim();

  // Strip Markdown code fencing if present
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", text);
    throw new Error("Failed to parse menu items from AI. Please try again or take a clearer photo.");
  }

  const detectedCurrency = parsed.currency || "PHP";
  const now = Date.now();

  const categories: MenuCategory[] = (parsed.categories || []).map((cat: any, catIndex: number) => {
    const catId = `cat_${now}_${catIndex}_${Math.random().toString(36).substring(2, 6)}`;
    const items: MenuItem[] = (cat.items || []).map((item: any, itemIndex: number) => ({
      id: `item_${now}_${catIndex}_${itemIndex}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name || `Item ${itemIndex + 1}`,
      description: item.description || "",
      price: typeof item.price === "number" ? item.price : parseFloat(item.price) || 0,
      currency: detectedCurrency,
      isAvailable: true,
      isFeatured: Boolean(item.isFeatured),
      tags: Array.isArray(item.tags) ? item.tags : [],
      sortOrder: itemIndex,
    }));

    return {
      id: catId,
      name: cat.name || `Category ${catIndex + 1}`,
      items,
      isVisible: true,
      sortOrder: catIndex,
    };
  });

  return {
    businessName: parsed.businessName || undefined,
    currency: detectedCurrency,
    categories,
  };
}
