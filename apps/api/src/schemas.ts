import { z } from 'zod';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const imageMetaSchema = z.object({
  fileName: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sizeBytes: z.number().int().positive(),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
});

export type ImageMetaInput = z.infer<typeof imageMetaSchema>;
