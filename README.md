# SkhoFlow

> **One platform for writing, presenting, and building. Everywhere.**

SkhoFlow is a professional productivity suite — a unified workspace for documents, presentations, and code — accessible on the web and desktop, with mobile planned. Built for students, developers, and professionals who want serious tools without the overhead of managing separate applications.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [What's Built](#whats-built)
  - [Marketing Site](#marketing-site)
  - [Authentication](#authentication)
  - [Dashboard](#dashboard)
  - [Document Editor](#document-editor)
  - [Slides Editor](#slides-editor)
  - [IDE](#ide)
  - [Workspace (Multi-panel)](#workspace-multi-panel)
  - [Theming](#theming)
  - [Internationalisation](#internationalisation)
  - [Export / Save System](#export--save-system)
  - [Backend API](#backend-api)
- [What's Left / Next](#whats-left--next)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + CSS custom properties (design tokens) |
| Animation | Framer Motion |
| Rich text | TipTap v2 (ProseMirror) |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| State | Zustand (persisted slices) |
| Routing | React Router v7 |
| i18n | i18next + react-i18next |
| Export | `docx`, `jspdf`, `html2canvas` |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 |
| Desktop | Electron + TypeScript |
| Monorepo | Turborepo |
| Containers | Docker / docker-compose |

---

## Project Structure

```
skhoflow/
├── apps/
│   ├── webapp/                  # React web application (main product)
│   │   └── src/
│   │       ├── App.tsx           # Root router + auth guard + page transitions
│   │       ├── main.tsx          # Entry — i18n init, theme rehydration
│   │       ├── index.css         # Design tokens, global resets, dark mode vars
│   │       ├── components/
│   │       │   ├── app/          # AppNav (authenticated top nav)
│   │       │   ├── marketing/    # MarketingNav, Footer
│   │       │   └── workspace/    # DocumentPanel, SlidesPanel, IDEPanel,
│   │       │                     #   WorkspacePage, SaveDialog
│   │       ├── hooks/            # useDocument, useEditor, useTheme
│   │       ├── i18n/             # en, es, fr, it translations
│   │       ├── layouts/          # AppLayout (app shell), MarketingLayout
│   │       ├── modes/            # WordMode, SlidesMode, IDEMode (legacy)
│   │       ├── pages/            # All top-level page components
│   │       ├── services/         # api.ts (Axios), auth.ts
│   │       ├── store/            # Zustand: auth, document, editor, theme, workspace
│   │       ├── types/            # Shared frontend types (Slide, CodeFile, etc.)
│   │       └── utils/            # helpers, saveFile, constants
│   ├── backend/                 # Express REST API
│   │   └── src/
│   │       ├── server.ts         # Express app setup, middleware, routes mount
│   │       ├── config/           # database.ts (pg Pool), env.ts, schema.sql
│   │       ├── controllers/      # auth, document, presentation, code
│   │       ├── middleware/       # auth (JWT verify), errorHandler
│   │       ├── models/           # User, Document, Presentation
│   │       ├── routes/           # auth, documents, presentations, code
│   │       ├── services/         # authService, documentService, fileService
│   │       └── utils/            # logger
│   └── desktop/                 # Electron wrapper
│       └── src/
│           ├── main.ts           # Electron main process
│           └── preload.ts        # Context bridge
├── packages/
│   ├── shared-types/            # Types shared between webapp & backend
│   └── ui-components/           # Button, Card, Input, Modal (shared)
├── turbo.json
├── docker-compose.yml
└── package.json                 # Workspace root (npm workspaces)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)

### Installation

```bash
npm install
```

### Development

```bash
# Start all apps (webapp + backend) via Turborepo
npm run dev

# Webapp only
cd apps/webapp && npm run dev

# Backend only
cd apps/backend && npm run dev
```

### Database

```bash
# Start PostgreSQL with Docker
docker-compose up postgres

# Apply schema
psql $DATABASE_URL -f apps/backend/src/config/schema.sql
```

Copy `apps/backend/.env.example` to `apps/backend/.env` and set:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/skhoflow
JWT_SECRET=your_secret
PORT=3001
```

### Build

```bash
npm run build
```

---

## What's Built

### Marketing Site

Full public-facing website at `/`, `/products`, `/pricing`:

- **Home page** (`HomePage.tsx`) — animated hero with typewriter headline cycling through user personas, live feature demo previews, animated partner logo marquee, scroll-triggered reveal sections, newsletter signup form, and a full-page dark/light-aware design using CSS design tokens.
- **Products page** (`ProductsPage.tsx`) — detailed feature breakdown for each tool (Document, Slides, IDE) with animated illustrations.
- **Pricing page** (`PricingPage.tsx`) — four-tier pricing (Free / Pro $9 / Team $19 / Enterprise), monthly/annual toggle with 20% discount display, feature comparison per plan, i18n-ready. Highlighted "Pro" card.
- **Marketing layout** (`MarketingLayout.tsx`) — shared nav + footer wrapper for all public pages.
- **Footer** (`Footer.tsx`) — links, socials, branding.
- **MarketingNav** — sticky top nav with logo, links, theme toggle, CTA.

### Authentication

- **Login page** (`LoginPage.tsx`) — email + password form, animated, links to register.
- **Register page** (`RegisterPage.tsx`) — full name + email + password, client-side validation.
- **Auth store** (`authStore.ts`) — Zustand persisted slice: `user`, `token`, `login()`, `logout()`, `register()`.
- **Backend** — JWT-based auth: `POST /api/auth/register`, `POST /api/auth/login`. Passwords hashed with bcrypt. Token returned on login, verified via `auth` middleware on protected routes.
- **Route guard** — `ProtectedRoute` component in `App.tsx` redirects unauthenticated users to `/login`.

### Dashboard

`DashboardPage.tsx` — the main hub after login:

- **Sidebar navigation** with four sections: Overview, Documents, Presentations, IDE Projects.
- **Overview tab** — greeting by time of day, "New" dropdown to create any file type, recent files grid grouped by tool type with last-modified time.
- **Documents / Presentations / IDE tabs** — filtered lists of the user's files grouped by date (Today / This week / This month / Older).
- **File management** — rename (inline), delete, open in editor, all with animated context menus.
- **Search bar** — filters files across all types in real time.
- **Document store** (`documentStore.ts`) — Zustand persisted slice storing all user documents (title, content, type, timestamps) in localStorage. Acts as the local data layer until backend sync is wired.
- **New file creation** — generates a UUID, creates a document record, navigates directly to the correct editor.

### Document Editor

`DocumentEditorPage.tsx` — a full Word-like rich text editor:

- **Engine**: TipTap v2 (ProseMirror under the hood).
- **Extensions loaded**: StarterKit (bold, italic, strike, code, blockquote, lists, headings, history), TextStyle, Color, Underline, FontFamily, TextAlign, CharacterCount, Highlight (multicolor), Table + TableRow + TableHeader + TableCell, Image (inline + base64), Link, TaskList + TaskItem (nested), Superscript, Subscript.
- **Toolbar (ribbon-style)**: Undo/Redo, font family selector (8 fonts), font size selector (15 sizes), bold/italic/underline/strikethrough/sub/superscript, text color picker, highlight, alignment (L/C/R/Justify), H1/H2/H3, bullet list, numbered list, checklist, link, image, table insert, blockquote, code block.
- **Word-like pagination**: Single TipTap editor flowing freely in an absolutely-positioned div. N white A4-sized page cards (shadow + border-radius) stacked with 20px grey gutter strips between them. A `ResizeObserver` watches the ProseMirror element height and recomputes page count dynamically. As text overflows a page the gutter appears and a new card is added beneath — exactly like Word/Google Docs. Page count is accurate to A4 content height at 96 dpi.
- **Zoom control**: 50–200%, all page geometry recalculates on zoom change.
- **Status bar**: Live "Page X of Y", word count, character count.
- **File open**: Web File System Access API (`showOpenFilePicker`) supporting `.html`, `.skho`, `.txt`, `.md`.
- **Save dialog**: Modal with filename input + format selector (`.docx` or `.skho`).
- **Export**: `.docx` via the `docx` library (paragraphs, headings, inline styles), `.skho` as JSON, `.pdf` via jsPDF + html2canvas.
- **Dirty tracking**: "● Unsaved changes" badge in title bar.

### Slides Editor

`SlidesPanel.tsx` / `SlidesEditorPage.tsx` — a PowerPoint-like presentation builder:

- **Canvas**: Fixed 960×540 (16:9) canvas with scale-to-fit rendering.
- **Elements**: Text blocks and shape elements (rectangle, ellipse). Drag to move, 8-handle resize (nw/n/ne/e/se/s/sw/w).
- **Editing**: Double-click any text element to edit inline via `contentEditable`.
- **Styling panel**: Font size, bold, italic, text alignment (L/C/R), element foreground/background color pickers.
- **Slide management**: Add slide, delete slide, reorder (move up/down), thumbnail strip sidebar.
- **Per-slide background**: Color picker per slide.
- **Undo/Redo**: Full history stack.
- **Templates**: One-click template picker (Title Slide, Two-Column layout) to bootstrap new slides.
- **Save/Export**: `.pdf` (each slide rendered via html2canvas → jsPDF) or `.skhop` (JSON). Open `.skhop` files back in.
- **Persistence**: Auto-saves to document store on every change when opened from dashboard.

### IDE

`IDEPanel.tsx` / `IDEPage.tsx` — a browser-based integrated development environment:

- **Editor**: Monaco Editor (VS Code engine) with full syntax highlighting.
- **Language detection**: Automatic from file extension — supports JS, JSX, TS, TSX, Python, Go, Rust, C/C++, Java, HTML, CSS, SCSS, JSON, Markdown, SQL, YAML, Shell, Ruby, PHP, Swift, Kotlin, C#, and more.
- **File explorer**: Tree view with folder/file hierarchy. Expand/collapse folders. File icons coloured by language.
- **File management**: New file (with path/name prompt), new folder, rename (inline), delete.
- **Multi-tab editor**: Open multiple files simultaneously. Tab bar with active highlight and close button. Unsaved indicator per tab.
- **Project open**: Open a folder from disk (File System Access API), reads all files recursively into the in-memory tree.
- **Save**: Save individual files back to disk, or export the whole project as a `.skho` archive.
- **Integrated terminal**: Simulated terminal panel (toggle with button) — accepts basic commands (`ls`, `clear`, `echo`, `node`, `python`, etc.) with simulated output. Resizable panel via drag handle.
- **Theme-aware**: Monaco switches between `vs-dark` and `light` based on the app theme.

### Workspace (Multi-panel)

`WorkspacePage.tsx` — a split-pane workspace where multiple editors run simultaneously:

- Up to N panels open side by side (document, slides, or IDE) — resizable with drag handles.
- "Add panel" dropdown to open any tool type.
- Panel tabs with close button per panel.
- Focused panel state passed down to each panel component.
- Stores state in `workspaceStore.ts` (Zustand).

### Theming

- **Dark / light mode** — toggled via `ThemeToggle.tsx`. Persisted in localStorage via `themeStore.ts`. Defaults to dark.
- **Design tokens** — all colours, borders, backgrounds defined as CSS custom properties in `index.css` and switched via `.dark` class on `<html>`. Every component uses `var(--bg)`, `var(--text-1)`, `var(--accent)`, etc.
- **Accent palette**: Indigo accent (`--accent`), orange (`--orange`), gold (`--gold`) for tool-type differentiation.

### Internationalisation

- **4 languages**: English (`en`), Spanish (`es`), French (`fr`), Italian (`it`).
- Language selector in the app nav, persisted to `localStorage`.
- All marketing copy (hero, features, pricing, nav) is translated.
- Powered by `i18next` + `react-i18next`.

### Export / Save System

`utils/saveFile.ts` — unified export utility:

| Format | How |
|---|---|
| `.docx` | `docx` library — parses HTML into `Paragraph`/`TextRun` nodes with bold, italic, underline, headings |
| `.pdf` | `html2canvas` captures the rendered DOM → `jsPDF` inserts each page as an image |
| `.skho` | JSON blob containing document content + metadata |
| `.skhop` | JSON blob of slides array |

`SaveDialog.tsx` — animated modal dialog for filename input + format selection. Format options adapt to the tool type (document / slides / IDE).

### Backend API

Express server (`apps/backend/src/server.ts`) with PostgreSQL:

**Auth routes** (`/api/auth`):
- `POST /register` — create user, hash password, return JWT
- `POST /login` — verify credentials, return JWT

**Document routes** (`/api/documents`) — CRUD for documents, protected by JWT middleware.

**Presentation routes** (`/api/presentations`) — CRUD for presentations.

**Code routes** (`/api/code`) — store/retrieve code projects.

Schema (`schema.sql`): `users`, `documents`, `presentations` tables with foreign keys, timestamps, and full-text search on content.

---

## What's Left / Next

### 🔴 Critical / Core (must-have before any launch)

| # | Item | Notes |
|---|---|---|
| 1 | **Wire frontend to backend** | All CRUD (documents, slides, IDE projects) currently lives in Zustand/localStorage. Needs to call the real API with the JWT token. |
| 2 | **Document pagination — gutter fix** | The grey gutter strips that simulate page breaks between cards are currently flowing over the text (text visible through the gutter). The `z-index` stacking needs to be resolved so gutters cleanly clip the editor without blocking interaction. |
| 3 | **Auth flow polish** | Register/login forms need proper error display, loading states, and token refresh logic. |
| 4 | **Cloud document sync** | Auto-save to backend every N seconds. Conflict resolution on multi-device. |
| 5 | **User account page** | `AccountPage.tsx` exists but is mostly a stub — needs real profile editing, password change, avatar upload. |

### 🟡 High Priority (quality & completeness)

| # | Item |
|---|---|
| 6 | **Document editor — font size via TextStyle** — The font size selector uses `setMark('textStyle', { fontSize })` which requires a custom `fontSize` attribute on the TextStyle extension. Needs a `FontSize` custom extension. |
| 7 | **Slides — proper PDF export** — Each slide needs to be individually rendered at full resolution then stitched into the PDF. Current html2canvas capture has scaling issues. |
| 8 | **IDE — real terminal** — The simulated terminal should be replaced with a WebSocket-connected pty (via `node-pty` on the backend) for real command execution. |
| 9 | **IDE — file save-to-disk** — Currently saves back via the File System Access API only when a file handle is retained. Needs full bidirectional sync when a folder is opened. |
| 10 | **Workspace — resizable panels** — Drag handles between panels exist in the UI but the actual resize logic (percentage widths) is not fully implemented. |
| 11 | **Mobile layout** — All editors are desktop-only currently. Needs responsive breakpoints or a dedicated mobile view for the document editor at minimum. |
| 12 | **Offline support** — Service worker / PWA manifest for offline access. |

### 🟢 Features / Nice-to-have

| # | Item |
|---|---|
| 13 | **Real-time collaboration** — WebSocket presence + CRDT (Yjs) for multiplayer editing in the document editor. |
| 14 | **Document templates** — Starter templates (resume, report, letter, meeting notes) for the document editor. |
| 15 | **Slides — more element types** — Lines, arrows, images (drag-drop), embedded charts. |
| 16 | **Slides — presenter mode** — Full-screen slide show with keyboard navigation. |
| 17 | **AI writing assistant** — Inline AI suggestions / rewrite / summarise via OpenAI API in the document editor. |
| 18 | **Search across all documents** — Full-text search powered by PostgreSQL `tsvector`. |
| 19 | **File sharing / public links** — Share a document or presentation via a read-only public URL. |
| 20 | **Desktop app packaging** — Bundle the Electron app for Windows / macOS / Linux with auto-update. |
| 21 | **Mobile app** — React Native or Capacitor wrapper for iOS and Android. |
| 22 | **Payment integration** — Stripe for Pro and Team plan subscriptions. |
| 23 | **Team / workspace collaboration** — Shared workspaces, member invites, role-based access. |
| 24 | **Version history** — Per-document revision history with diff view and restore. |
| 25 | **Comments / annotations** — Inline comments on document text, resolved/unresolved thread UI. |

---

*Built with React, TipTap, Monaco, and way too much attention to detail.*
