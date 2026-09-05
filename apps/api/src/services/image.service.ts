import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../schemas';

export interface ProcessImageResult {
  imageMeta: {
    fileName: string;
    width: number;
    height: number;
    sizeBytes: number;
    mimeType: string;
  };
  // Phase 1: we just pass the original back as a data URL.
  // Phase 2: this becomes the OpenCV-preprocessed image
  // (grayscale/denoise/threshold/deskew/perspective-correct) produced by
  // handing the buffer to services/ocr-worker (Python + OpenCV).
  processedImagePreviewUrl: string;
}

export class UnsupportedImageError extends Error {}
export class FileTooLargeError extends Error {}

export async function processImage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ProcessImageResult> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    throw new UnsupportedImageError(`Unsupported file type: ${mimeType}`);
  }
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError('File exceeds the 15MB limit');
  }

  // Placeholder dimension probe (real impl reads actual header / delegates
  // to the OpenCV worker). Kept simple & dependency-free for phase 1.
  const { width, height } = probeDimensions(buffer, mimeType);

  const base64 = buffer.toString('base64');
  const processedImagePreviewUrl = `data:${mimeType};base64,${base64}`;

  return {
    imageMeta: { fileName, width, height, sizeBytes: buffer.byteLength, mimeType },
    processedImagePreviewUrl,
  };
}

// Minimal PNG/JPEG dimension reader so we don't need a native dep in phase 1.
function probeDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } {
  try {
    if (mimeType === 'image/png') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker >= 0xc0 && marker <= 0xc3) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const segmentLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + segmentLength;
      }
    }
  } catch {
    // fall through to default
  }
  return { width: 0, height: 0 };
}
