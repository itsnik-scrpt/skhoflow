# SkhoFlow

A comprehensive educational productivity suite with Word, Coding, and Presentation modes.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Desktop**: Electron + TypeScript
- **State Management**: Zustand
- **Build Tool**: Turbo (monorepo)

## Project Structure

```
skhoflow/
├── apps/
│   ├── webapp/          # React web application
│   ├── backend/         # Express API server
│   └── desktop/         # Electron desktop app
├── packages/
│   ├── shared-types/    # Shared TypeScript types
│   └── ui-components/   # Shared React UI components
├── turbo.json
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Installation

```bash
npm install
```

### Development

```bash
# Start all apps
npm run dev

# Start only the webapp
cd apps/webapp && npm run dev

# Start only the backend
cd apps/backend && npm run dev
```

### Database Setup

```bash
# Start PostgreSQL with Docker
docker-compose up postgres

# Or configure DATABASE_URL in apps/backend/.env
```

### Build

```bash
npm run build
```

## Features

- 📝 **Word Mode** – Rich text editor powered by TipTap
- 💻 **Code Mode** – Monaco Editor with multi-tab support and syntax highlighting
- 📊 **Slides Mode** – PowerPoint-like presentation editor
- 🌙 **Dark/Light Theme** – System-aware theme toggle
- 🔐 **Authentication** – JWT-based auth with user accounts
- 📄 **Document Management** – Create, edit, and save documents
