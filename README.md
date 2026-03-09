# Skhoflow

## Project Overview
Skhoflow is a cutting-edge monorepo structure that integrates multiple applications and shared libraries, organized for optimal collaboration and scalability.

## Tech Stack
- **Frontend**: React with TypeScript, Vite
- **Backend**: Node.js with Express, TypeScript
- **Desktop**: Electron with TypeScript
- **Utilities**: Turbo for monorepo management

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/itsnik-scrpt/skhoflow.git
   cd skhoflow
   ```
2. Install dependencies for each app and package:
   ```bash
   npm install
   cd apps/webapp && npm install
   cd ../../apps/backend && npm install
   cd ../../apps/desktop && npm install
   cd ../../packages/shared-types && npm install
   cd ../../packages/ui-components && npm install
   ```
3. Start the applications based on requirements.