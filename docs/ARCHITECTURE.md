# Smart Timetable Image → Excel — Architecture (v1, Phase 1)

## Flow
Upload → Preprocess → Grid Detect → Grid Edit → Timeslots → Day/Period →
Subjects (per-cell OCR) → Subject Validate → Staff Extract → Staff Validate →
Assignment → Final Validate → Excel Preview → Download

No auth. No DB. No Redis. All state lives in the browser (a single
`TimetableProcessingState` object) for the duration of the session and is
sent to the API only when a step needs server-side processing (image ops,
OCR, xlsx generation). The API is stateless — every request carries whatever
data it needs and returns a result; nothing is stored server-side.

## Stack
- **apps/web** — Angular (standalone components, Signals, Reactive Forms, Tailwind)
- **apps/api** — Bun + Hapi.js + Zod (stateless REST)
- **services/ocr-worker** — Python + OpenCV + OCR abstraction (phase 2+)
- **packages/shared-types** — TS interfaces shared by web + api
- **packages/excel-generator** — xlsx workbook builder (exceljs)
- **packages/image-processing** — grid-detection helpers (phase 2)

## Folder structure
```
apps/
  web/            Angular app
  api/            Bun/Hapi API
services/
  ocr-worker/     Python OpenCV/OCR microservice (added phase 2)
packages/
  shared-types/   TimetableProcessingState & friends
  image-processing/
  excel-generator/
docs/
```

## State shape (packages/shared-types)
See `packages/shared-types/src/index.ts` — this is the single source of
truth for the whole pipeline (image, grid, days, periods, timeslots,
subjects, staff, assignments, entries, validation).

## API surface (stateless, phase 1 stubs)
```
POST /api/timetable/process-image     multipart image -> { imageMeta, processedImagePreview }
POST /api/timetable/detect-grid       { image } -> { grid }               (phase 2)
POST /api/timetable/extract-subjects  { image, grid } -> { cells[] }      (phase 3)
POST /api/timetable/extract-staff     { image } -> { staff[] }            (phase 3)
POST /api/timetable/validate          { state } -> { validationResult }   (phase 4)
POST /api/timetable/export            { state } -> xlsx file stream       (phase 4)
```

## Phase 1 scope (this delivery)
- Angular standalone `UploadComponent`: drag/drop, browse, preview, file
  meta (name/dimensions/size), rotate, remove/replace, "Process Timetable" CTA.
- Bun/Hapi API with `/api/timetable/process-image` accepting a multipart
  image, validating type/size with Zod-esque manual checks, returning image
  metadata (this is where OpenCV preprocessing hooks in during Phase 2).
- Shared `TimetableProcessingState` types used by both sides.

## Next phases (not yet built)
2. OpenCV preprocessing + dynamic grid detection + Grid Editor UI
3. Timeslot config, per-cell OCR, subject normalization, staff extraction
4. Assignment UI, final validation, exceljs workbook (7 sheets), download
