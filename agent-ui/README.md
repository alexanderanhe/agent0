# Agent UI (React + Vite + Tailwind + SSE)

Lightweight frontend to test the chat backend with SSE streaming. Start/continue a conversation, send messages, and see assistant responses in real time.

## Requirements
- Node 18+
- Backend with endpoints:
  - `POST /chat` → `{ conversationId?: string, input: string }`
  - `GET /chat/stream/:conversationId` (SSE events `token`, `done`, `error`)
  - `GET /chat/:conversationId` for history (paginated)

## Configuration
1. Copy the env example:
   ```bash
   cp .env.example .env
   ```
2. Set `VITE_API_BASE_URL` if your backend isn’t on `http://localhost:3000`.
3. (Optional) `VITE_PAGE_SIZE` controls messages per page (default 10).

## Install and run
```bash
npm install        # or pnpm install
npm run dev        # start Vite dev server
```
Open the shown port (default http://localhost:5173).

## UI flow
- On load: reads `conversationId` from the URL path (`/[[id]]`), fetches history, and opens SSE.
- History is paginated (latest N messages); scrolling to top loads the next older page with a loader.
- Conversations list: fetched with `GET /conversations` and live-updated via SSE `/conversations/stream`; shown in a right sidebar opened via a hamburger icon (responsive).
- Send message:
  - If no conversation, POST `/chat` with only `input`, store `conversationId`, open SSE.
  - If conversation exists, POST `/chat` with `conversationId`.
  - Optimistic UI for the user message; assistant message is built from SSE `token`s.
- “New chat” button: clears history, `conversationId`, and closes SSE.
- Status bar shows SSE connection, errors, and allows reconnect.

## Structure
```
src/
  api/            // fetch and SSE
  components/     // UI (chat feed, input, etc.)
  hooks/          // useChat + useSSE
  types/          // message types
  utils/          // storage and uuid
```

## Test with your backend
1. Start your API with CORS allowing this origin.
2. Set `VITE_API_BASE_URL`.
3. Send a message in the UI and check:
   - History loads if there was a previous conversation.
   - SSE connects (status in header).
   - Tokens arrive in real time and compose the assistant message.

## Available scripts
- `npm run dev` – development server.
- `npm run build` – production build.
- `npm run preview` – preview the build.
- `npm run lint` – linting.
