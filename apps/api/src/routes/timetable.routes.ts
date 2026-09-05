import type { ServerRoute } from '@hapi/hapi';
import {
  processImage,
  UnsupportedImageError,
  FileTooLargeError,
} from '../services/image.service';

export const timetableRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/api/timetable/process-image',
    options: {
      payload: {
        output: 'data',
        parse: true,
        multipart: { output: 'data' },
        maxBytes: 20 * 1024 * 1024,
      },
    },
    handler: async (request, h) => {
      const payload = request.payload as Record<string, any>;
      const file = payload?.file;

      if (!file || !file._data) {
        return h.response({ error: 'No image file provided (field name: "file").' }).code(400);
      }

      try {
        const buffer: Buffer = file._data;
        const fileName: string = file.hapi?.filename ?? 'upload.jpg';
        const mimeType: string = file.hapi?.headers?.['content-type'] ?? 'image/jpeg';

        const result = await processImage(buffer, fileName, mimeType);
        return h.response(result).code(200);
      } catch (err) {
        if (err instanceof UnsupportedImageError) {
          return h.response({ error: err.message }).code(415);
        }
        if (err instanceof FileTooLargeError) {
          return h.response({ error: err.message }).code(413);
        }
        request.log(['error'], err as Error);
        return h
          .response({ error: 'Unable to process image. Please try a different file.' })
          .code(500);
      }
    },
  },

  // Stubs for the remaining pipeline steps — wired up in later phases.
  {
    method: 'POST',
    path: '/api/timetable/detect-grid',
    handler: (_request, h) =>
      h.response({ error: 'Grid detection is not implemented yet (phase 2).' }).code(501),
  },
  {
    method: 'POST',
    path: '/api/timetable/extract-subjects',
    handler: (_request, h) =>
      h.response({ error: 'Subject extraction is not implemented yet (phase 3).' }).code(501),
  },
  {
    method: 'POST',
    path: '/api/timetable/extract-staff',
    handler: (_request, h) =>
      h.response({ error: 'Staff extraction is not implemented yet (phase 3).' }).code(501),
  },
  {
    method: 'POST',
    path: '/api/timetable/validate',
    handler: (_request, h) =>
      h.response({ error: 'Validation is not implemented yet (phase 4).' }).code(501),
  },
  {
    method: 'POST',
    path: '/api/timetable/export',
    handler: (_request, h) =>
      h.response({ error: 'Excel export is not implemented yet (phase 4).' }).code(501),
  },
];
