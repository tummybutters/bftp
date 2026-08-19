import { siteConfig } from "@/lib/site-config";

/**
 * Getting a customer's photos into a request the platform will actually accept.
 *
 * Vercel rejects a function request body over 4.5 MB at the edge, before any
 * route code runs, and answers in plain text rather than JSON. Measured against
 * the live site on 2026-08-19: a 6 MB POST to /api/contact returns
 * `413 FUNCTION_PAYLOAD_TOO_LARGE` with the body "Request Entity Too Large" and
 * never reaches the handler. The route's own 15 MB check could therefore never
 * fire -- it sat below a ceiling a third its height.
 *
 * That ceiling is not theoretical for this form. It asks for device photos, and
 * one photo off any current phone is 3-12 MB, so two of them exceed the cap on
 * their own. Two customers hit it (2026-06-08 and 2026-08-13), each tried twice,
 * and neither ever got through.
 *
 * So images are shrunk in the browser before they are ever attached. A backflow
 * assembly photographed for identification has to be legible, not printable:
 * 1600px on the long edge at JPEG 0.82 reads fine and lands near 300 KB. PDFs
 * cannot be compressed here and pass through untouched, which is why a total
 * check still runs afterward -- and why it explains itself in the customer's
 * terms instead of failing at the gateway.
 */

/** What the platform will take. Above this the request dies before our code runs. */
export const PLATFORM_REQUEST_LIMIT_BYTES = Math.round(4.5 * 1024 * 1024);

/**
 * What we will attempt, leaving the form fields and multipart framing room under
 * the platform limit. Deliberately short of the ceiling: a request refused here
 * refuses in words, one refused at the ceiling refuses in a stack trace.
 */
export const UPLOAD_BUDGET_BYTES = Math.round(3.5 * 1024 * 1024);

/** Below this an image is already small enough that re-encoding only loses quality. */
const COMPRESS_ABOVE_BYTES = 600 * 1024;

const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function totalBytes(files: File[]) {
  return files.reduce((sum, file) => sum + file.size, 0);
}

function isPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/**
 * GIFs and SVGs are excluded on purpose: flattening an animation to one frame
 * or rasterizing vector art is a worse outcome than sending the original.
 */
function isShrinkableImage(file: File) {
  return (
    file.type.startsWith("image/") &&
    file.type !== "image/gif" &&
    file.type !== "image/svg+xml"
  );
}

function withJpegExtension(name: string) {
  const base = name.replace(/\.[^./\\]+$/, "");

  return `${base || "photo"}.jpg`;
}

async function downscale(file: File): Promise<File> {
  // `from-image` applies the EXIF rotation phones write. Without it a portrait
  // photo arrives on its side, because drawing to a canvas discards the EXIF
  // that told the viewer to rotate it.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("This browser gave us no 2d canvas.");
    }

    // JPEG has no alpha, so anything transparent would encode as black. A
    // scanned notice letter saved as a PNG is exactly that shape of file.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    if (!blob) {
      throw new Error("The browser produced no image.");
    }

    return new File([blob], withJpegExtension(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

/**
 * Never returns worse than what it was given. A failed decode, a browser with
 * no `createImageBitmap`, or a re-encode that came out larger all fall back to
 * the original file and let the size check downstream have the last word.
 */
async function shrinkIfWorthwhile(file: File): Promise<File> {
  if (!isShrinkableImage(file) || file.size <= COMPRESS_ABOVE_BYTES) {
    return file;
  }

  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  try {
    const shrunk = await downscale(file);

    return shrunk.size < file.size ? shrunk : file;
  } catch {
    return file;
  }
}

function tooLargeMessage(files: File[], total: number) {
  const pdfBytes = totalBytes(files.filter(isPdf));
  const largest = [...files].sort((a, b) => b.size - a.size)[0];
  // Naming the actual bulk matters: telling someone to shrink their photos when
  // the weight is a 4 MB scanned PDF sends them to fix the wrong thing.
  const subject = pdfBytes > total / 2 ? "PDFs" : "files";

  return [
    `Your ${subject} come to ${formatFileSize(total)}, which is more than we can send in one message.`,
    largest ? ` Remove ${largest.name} (${formatFileSize(largest.size)}) and send the rest,` : " Send fewer at a time,",
    ` or email everything to ${siteConfig.email.address}.`,
  ].join("");
}

export interface PreparedUploads {
  /** What to attach. Same order as the input, shrunk where shrinking helped. */
  files: File[];
  originalBytes: number;
  finalBytes: number;
  /** Set when even the shrunk files will not fit. The form must not submit. */
  error: string | null;
}

export async function prepareUploads(files: File[]): Promise<PreparedUploads> {
  const prepared = await Promise.all(files.map(shrinkIfWorthwhile));
  const finalBytes = totalBytes(prepared);

  return {
    files: prepared,
    originalBytes: totalBytes(files),
    finalBytes,
    error: finalBytes > UPLOAD_BUDGET_BYTES ? tooLargeMessage(prepared, finalBytes) : null,
  };
}
