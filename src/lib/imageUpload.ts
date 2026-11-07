import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  folder?: string;
}

/**
 * Resizes and compresses an image File in the browser using HTML5 Canvas.
 * Returns a small Blob (~20KB - 50KB) and a fallback base64 DataURL.
 */
export async function compressImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, don't re-encode via canvas, read directly as data URL or text
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ blob: file, dataUrl });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas context"));
          return;
        }

        // Draw image with smooth smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              resolve({ blob: file, dataUrl });
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file with automatic client-side compression.
 * Tries Firebase Storage first; if unavailable or blocked by rules,
 * automatically falls back to permanent compressed Base64 Data URL ($0 cost, never expires).
 */
export async function uploadImageFile(
  file: File,
  options: ImageUploadOptions = {}
): Promise<string> {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.85,
    folder = "avatars",
  } = options;

  // 1. Compress image to super-lightweight format (~20-50KB)
  const { blob, dataUrl } = await compressImage(file, maxWidth, maxHeight, quality);

  // 2. Try Firebase Storage if configured
  if (storage) {
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${folder}/${Date.now()}_${safeName}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, blob, {
        contentType: blob.type || "image/jpeg",
      });

      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (storageErr) {
      console.warn(
        "Firebase Storage upload note (falling back to permanent compressed Data URL):",
        storageErr
      );
      // Fallback to compressed base64 dataUrl
      return dataUrl;
    }
  }

  // 3. Fallback when Firebase Storage is not configured
  return dataUrl;
}

