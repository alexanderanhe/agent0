# Monorepo: backend and frontend

This repo contains two separate projects:

- `agent-back/`: Express + MongoDB backend with SSE (ChatGPT-style chat).
- `agent-ui/`: Vite + React/TypeScript frontend that consumes the chat.

## Key files and folders

### Backend (`agent-back`)
- `src/app.ts`: builds the Express app (routes and middlewares), reusable in serverless.
- `src/server.ts`: local bootstrap (uses `PORT`, connects to Mongo).
- `src/db.ts`: Mongo connection helper with reuse.
- `src/routes/chat.routes.ts` and `src/controllers/chat.controller.ts`: REST/SSE endpoints.
- `src/services/chat.service.ts`: chat logic and streaming (simulated + commented OpenAI).
- `src/services/sse.service.ts`: manages SSE clients per conversation.
- `src/models/conversation.model.ts`: Mongoose schema for conversations.
- `api/index.ts`: serverless handler for Vercel.
- `vercel.json`: routes/build for Vercel deployment.
- `requests.http`: endpoint examples.
- `.env.example`: required variables (`MONGODB_URI`, `OPENAI_*`, `PORT`).
- Pagination: `GET /chat/:conversationId` returns paginated messages (`limit`, `before`) with size configurable via `CHAT_PAGE_SIZE`.
- Conversations: `GET /conversations` returns recent threads with last message summary; `GET /conversations/stream` (SSE) emits new conversation events.

### Frontend (`agent-ui`)
- `src/main.tsx`: React + Vite entrypoint.
- `src/App.tsx` and `src/App.css`: main layout and styles.
- `src/api/`: helpers for backend calls (SSE and REST).
- `src/components/`: reusable UI (inputs, chat list, etc.).
- `src/hooks/`: hooks for state/streaming.
- `src/types/`: shared types (messages, conversations).
- `vite.config.ts`: Vite configuration.
- `public/`: public assets.
- Pagination in UI: loads latest messages and fetches older on scroll-top; size adjustable with `VITE_PAGE_SIZE`.
- Conversation selection: conversationId is taken from the URL path (`/[[id]]`); the right sidebar (hamburger icon) lists conversations from `GET /conversations` and live updates via `/conversations/stream`. New chat button also lives in the sidebar (and header on larger screens).

## How to work
- Backend: `cd agent-back && pnpm install && pnpm dev` (requires Mongo and `.env` vars).
- Frontend: `cd agent-ui && pnpm install && pnpm dev` (configure backend URL if needed).

Each project has its own `README.md` with more installation and usage details. Add notes here if you introduce new packages or scripts.
