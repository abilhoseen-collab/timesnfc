/**
 * Client-side image optimization pipeline.
 *
 * - Decodes the user-selected file via createImageBitmap (HW-accelerated).
 * - Resizes to a max edge while preserving aspect ratio.
 * - Encodes as WebP when supported (~30-50% smaller than JPEG at same quality),
 *   falls back to JPEG everywhere else (Safari < 14, very old Android).
 * - Strips EXIF / metadata implicitly (canvas re-encode).
 *
 * No edge function. Zero round-trip. Original file never leaves the browser
 * un-optimized, so Storage bandwidth + cost stays low.
 */

export interface OptimizeOptions {
  /** Maximum width OR height in pixels. Aspect ratio preserved. */
  maxEdge: number;
  /** Encoder quality 0-1. Default 0.82 — visually lossless for photos. */
  quality?: number;
  /** Force a specific output mime. Default auto-detect WebP support. */
  mimeType?: "image/webp" | "image/jpeg";
}

export interface OptimizedImage {
  blob: Blob;
  mime: string;
  ext: string;
  width: number;
  height: number;
  /** Compression ratio: optimized / original. <1 means smaller. */
  ratio: number;
  originalSize: number;
}

// Cache the WebP capability check
let webpSupported: boolean | null = null;
function supportsWebPEncode(): boolean {
  if (webpSupported !== null) return webpSupported;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    webpSupported = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpSupported = false;
  }
  return webpSupported;
}

/** Load a File / Blob into an ImageBitmap (preferred) or HTMLImageElement (fallback). */
async function decode(file: Blob): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => {
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close?.();
      },
    };
  }
  // Fallback for very old browsers
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    };
  } finally {
    // revoke after draw via micro-delay
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function optimizeImage(file: File | Blob, opts: OptimizeOptions): Promise<OptimizedImage> {
  const { maxEdge, quality = 0.82 } = opts;

  // GIFs are animated — re-encoding would lose animation. Pass through.
  if ((file as File).type === "image/gif") {
    return {
      blob: file,
      mime: "image/gif",
      ext: "gif",
      width: 0,
      height: 0,
      ratio: 1,
      originalSize: file.size,
    };
  }

  const mime = opts.mimeType ?? (supportsWebPEncode() ? "image/webp" : "image/jpeg");
  const ext = mime === "image/webp" ? "webp" : "jpg";

  const src = await decode(file);
  const scale = Math.min(1, maxEdge / Math.max(src.width, src.height));
  const targetW = Math.max(1, Math.round(src.width * scale));
  const targetH = Math.max(1, Math.round(src.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d", { alpha: mime === "image/webp" });
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  // High-quality downscale
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  src.draw(ctx, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas encode failed"))),
      mime,
      quality,
    );
  });

  return {
    blob,
    mime,
    ext,
    width: targetW,
    height: targetH,
    ratio: blob.size / file.size,
    originalSize: file.size,
  };
}

/** Convenience presets matching common upload contexts. */
export const ImagePresets = {
  /** Avatar / profile photo — square-ish, displayed up to 200px. */
  avatar: { maxEdge: 800, quality: 0.85 } satisfies OptimizeOptions,
  /** Cover / banner — landscape, displayed wide. */
  cover: { maxEdge: 1600, quality: 0.82 } satisfies OptimizeOptions,
  /** Landing-page hero / large content image. */
  hero: { maxEdge: 1920, quality: 0.82 } satisfies OptimizeOptions,
  /** Gallery thumbnail. */
  thumb: { maxEdge: 400, quality: 0.8 } satisfies OptimizeOptions,
};

/** Human-readable size formatter. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Optimize + upload to Supabase Storage in one call.
 * Returns the public URL. The `path` MUST omit the extension — the optimizer
 * picks `.webp` or `.jpg` based on browser support.
 */
import { supabase } from "@/integrations/supabase/client";

export async function uploadOptimizedImage(
  file: File | Blob,
  bucket: string,
  pathWithoutExt: string,
  preset: OptimizeOptions = ImagePresets.cover,
): Promise<{ publicUrl: string; optimized: OptimizedImage; path: string }> {
  const optimized = await optimizeImage(file, preset);
  const path = `${pathWithoutExt}.${optimized.ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, optimized.blob, {
    contentType: optimized.mime,
    cacheControl: "31536000",
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl, optimized, path };
}

