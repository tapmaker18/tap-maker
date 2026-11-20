// Firestore hard limit is 1,048,576 bytes per document. Keep a safety margin.
export const MAX_DOC_BYTES = 1_000_000;
export const WARN_DOC_BYTES = 800_000;

export function getDocSizeBytes(data: unknown): number {
  const json = JSON.stringify(data ?? null);
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(json).length;
  return json.length;
}

export class DocTooLargeError extends Error {
  constructor(public readonly bytes: number) {
    super(
      `Unable to save: Document size is ${Math.round(bytes / 1024)} KB (maximum allowed is ~${Math.round(
        MAX_DOC_BYTES / 1024
      )} KB). Please remove or compress some images (logo, cover, or item photos).`
    );
    this.name = "DocTooLargeError";
  }
}

export function assertDocSize(data: unknown): number {
  const bytes = getDocSizeBytes(data);
  if (bytes > MAX_DOC_BYTES) throw new DocTooLargeError(bytes);
  return bytes;
}
