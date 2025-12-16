# Prompt for Codex – Test frontend for chat backend (React + Vite + TS + Tailwind + SSE)

## Context
Backend already provides:
- `POST /chat` receiving `{ conversationId?: string, input: string }` and returning `{ conversationId, status }`
- `GET /chat/stream/:conversationId` (SSE events `token`, `done`, `error`)
- `GET /chat/:conversationId` to get history (messages)

Goal: a minimal **React + Vite + TypeScript** frontend with **TailwindCSS** to exercise the backend in the browser.

## Desired functionality
- Create / continue a conversation
- Send messages to the backend
- Receive responses in real time via **SSE**
- Persist `conversationId` in `localStorage` to rehydrate on reload
- Show message history (`user` and `assistant`)
- Handle basic states: SSE connecting, sending, error

## Functional requirements
1) Minimal UI (single page):
- Header with connection status (SSE connected/disconnected)
- Message list/chat feed with bubbles:
  - `user` aligned right
  - `assistant` aligned left
- Input + “Send” button
- “New chat” button that:
  - Clears history
  - Clears `conversationId` from localStorage
  - Closes current SSE if present

2) Flow:
- On app load:
  - Read `conversationId` from `localStorage` if present
  - If present:
    - Call `GET /chat/:conversationId` and render `messages`
    - Open SSE to `/chat/stream/:conversationId`
  - If not:
    - Show UI ready to start chatting (no SSE yet)
- When sending a message:
  - If NO `conversationId`:
    - Call `POST /chat` with `{ input }`
    - Save returned `conversationId` to `localStorage`
    - Open SSE to `/chat/stream/:conversationId`
  - If `conversationId` exists:
    - Call `POST /chat` with `{ conversationId, input }`
  - Insert the user message into local state immediately (optimistic UI)
  - For assistant response:
    - Create/update a temporary assistant message that fills with `token`s from SSE
    - On `done`, finalize the message

3) SSE:
- Implement with `EventSource`.
- Subscribe to:
  - `token`: append to the in-progress assistant message
  - `done`: mark end of response
  - `error`: show a banner or text
- Handle simple reconnect (optional): if it drops, show disconnected and allow “Reconnect” or reconnect on send.

4) Configuration:
- Use env var for backend:
  - `VITE_API_BASE_URL=http://localhost:3000` (or whichever)
- Create `.env.example` for the frontend with that variable.
- Consider CORS: frontend uses `fetch` to `${VITE_API_BASE_URL}/chat` and `EventSource` to `${VITE_API_BASE_URL}/chat/stream/:conversationId`.

## Technical requirements
- Vite + React + TS.
- Tailwind installed and configured.
- Simple, readable code, no state libraries (no Redux).
- Suggested structure:
```
└── src/
    ├── api/
    │   ├── chatApi.ts        // Fetch: POST /chat, GET /chat/:conversationId
    │   └── sse.ts            // EventSource wrapper (SSE)
    │
    ├── components/
    │   ├── Chat.tsx          // Orchestrates main chat flow
    │   ├── MessageBubble.tsx // Render user/assistant messages
    │   ├── ChatInput.tsx     // Input + Send button
    │
    ├── hooks/
    │   ├── useChat.ts        // Chat state + main logic
    │   └── useSSE.ts         // EventSource lifecycle
    │
    ├── types/
    │   └── chat.ts           // Types: Message, Role, API responses
    │
    ├── utils/
    │   ├── storage.ts        // localStorage helpers (conversationId)
    │   └── uuid.ts           // Simple local id generator
    │
    ├── App.tsx
    ├── main.tsx
    └── index.css             // Tailwind directives

```

## Types and contracts
- `Message`:
```ts
type Role = "user" | "assistant";
interface Message {
  id: string; // local uuid or timestamp
  role: Role;
  content: string;
  createdAt?: string;
}
```

- GET /chat/:conversationId response:
  - Assume { _id, messages: { role, content, createdAt }[] } or { conversationId, messages } (handle flexibly).
- POST /chat response:

```json
{ "conversationId": "string", "status": "streaming" }
```

## Deliverables
- Project created with Vite (commands included).
- Complete files ready:
  - React components
  - API client (fetch) and SSE wrapper
  - `.env.example`
  - `README.md` with:
    - installation
    - environment variables
    - how to run
    - how to test the backend flow

## Expected output
- Final file tree.
- Content of main files (at least: `App.tsx`, key components, `chatApi.ts`, `sse.ts`, `index.css`, Tailwind configs, `.env.example`, `README.md`).
- Clear run instructions: npm i, npm run dev.

## Notes
- Keep the frontend intentionally simple; it’s a backend testing tool.
- Ensure the `EventSource` is closed when changing conversation or unmounting to avoid leaks.
