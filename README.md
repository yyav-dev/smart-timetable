# 📅 Smart Timetable (Image → Excel)

A modern, stateless full-stack web application and microservice suite designed to convert scanned or photographed timetable images into formatted Excel (`.xlsx`) workbooks.

Built with **Angular** (Frontend UI), **Bun + Hapi.js** (Stateless Backend API), and **Python OpenCV + Tesseract** (OCR Processing Engine).

---

## 🏗️ Architecture & Stack

No authentication, no persistent database — all state lives in the browser (`TimetableProcessingState`) for the duration of the session and is sent to the stateless API endpoints as needed.

- **`apps/web`** — Angular frontend (Standalone Components, Signals, Reactive Forms, Tailwind CSS).
- **`apps/api`** — Bun + Hapi.js REST API service.
- **`services/ocr-worker`** — Python microservice leveraging OpenCV (`cv2`) for image preprocessing and Tesseract (`pytesseract`) for character recognition.
- **`packages/shared-types`** — Shared TypeScript interfaces for end-to-end type safety.
- **`docs/ARCHITECTURE.md`** — Technical specifications and state design doc.

---

## 👁️ Python OCR Engine (`services/ocr-worker/ocr_engine.py`)

The OCR worker processes cell crops using a 2-stage vision pipeline:
1. **OpenCV (`cv2`) Image Preprocessing**:
   - **Grayscale Conversion**: Reduces 3-channel BGR to 1-channel brightness intensity.
   - **Bilateral Filter**: Denoises background paper grain while preserving sharp character edges.
   - **Otsu's Adaptive Thresholding**: Converts grayscale into high-contrast black-and-white binary images.
2. **PyTesseract Character Recognition**:
   - Configured with `--psm 6` (Uniform block of text assumption).
   - Extracts character bounding boxes, raw text, and confidence scores ($0.0 - 1.0$).

---

## 📁 Repository Layout

```
smart-timetable/
├── apps/
│   ├── web/                    # Angular Standalone Application
│   └── api/                    # Bun + Hapi API Service
├── services/
│   └── ocr-worker/             # Python OpenCV + Tesseract OCR Engine
│       └── ocr_engine.py
├── packages/
│   └── shared-types/           # Shared TypeScript Interfaces & Types
├── docs/
│   └── ARCHITECTURE.md         # Full System Architecture
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+) or **Bun** (v1.0+)
- **Python** (3.9+) with `opencv-python` & `pytesseract`
- **Tesseract OCR engine** installed on host OS (`sudo apt install tesseract-ocr` or `brew install tesseract`)

---

### 2. Running the Services

#### A. Backend API (`apps/api`)
```bash
cd apps/api
bun install
bun run dev
# Running at http://localhost:3333
```

#### B. Frontend Web UI (`apps/web`)
```bash
cd apps/web
npm install
npm run start
# Running at http://localhost:4200
```

#### C. Python OCR Engine (`services/ocr-worker`)
```bash
cd services/ocr-worker
python3 -m venv venv
source venv/bin/activate
pip install opencv-python pytesseract numpy pillow
python3 ocr_engine.py
```

---

## 🔄 Re-Merge & GitHub Push Commands

To commit your updated README and push/merge your changes back into your GitHub repository, execute the following commands in your terminal:

```bash
# 1. Check current repository status
git status

# 2. Stage updated README and project files
git add README.md .gitignore

# 3. Commit your changes
git commit -m "docs: update README with OCR engine details and architecture overview"

# 4. Push / merge changes to GitHub main branch
git push origin main
```

If you are working on a feature branch (e.g., `feature/readme-update`) and want to merge it into `main`:

```bash
# Push your branch
git push origin feature/readme-update

# Switch to main branch and merge
git checkout main
git pull origin main
git merge feature/readme-update

# Push merged main branch to GitHub
git push origin main
```
