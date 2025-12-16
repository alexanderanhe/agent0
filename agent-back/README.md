# Chat-like backend with Node, Express, MongoDB, and SSE

Simple backend for ChatGPT-style conversations. Uses **Express** + **MongoDB (Mongoose)** and streams assistant responses via **Server-Sent Events (SSE)**. Conversations are persisted so they can be reloaded.

## Requirements
- Node.js 18+
- pnpm (or npm/yarn)
- MongoDB running

## Installation
```bash
pnpm install
cp .env.example .env
```
Fill the environment variables in `.env`.

## Environment variables
- `PORT`: HTTP port (e.g. `3000`).
- `MONGODB_URI`: MongoDB URI (e.g. `mongodb://localhost:27017/chat-db`).
- `OPENAI_API_KEY`: OpenAI API Key (only if you enable real integration).
- `OPENAI_MODEL`: Model to use with OpenAI (e.g. `gpt-4.1-mini`).
- `CHAT_PAGE_SIZE`: number of messages per page in history (default 10).

## Run in development
```bash
pnpm dev
```

## Endpoints
- `POST /chat`  
  Body: `{ "conversationId"?: string, "input": string }`  
  Stores the user message, triggers streaming, and responds immediately with `{ conversationId, status: "streaming" }`.

- `GET /chat/stream/:conversationId` (SSE)  
  Keeps the connection open and emits events:
  - `token`: text chunks
  - `done`: completion
  - `error`: stream error

- `GET /chat/:conversationId`  
  Returns the paginated history (latest messages by default).  
  Query params:  
  - `limit` (optional): number of messages (max 100, default `CHAT_PAGE_SIZE`).  
  - `before` (optional): ISO date; returns messages older than that (paginate backwards).  
  Response includes `messages`, `hasMore`, `nextCursor` (ISO cursor for older), and `total`.

- `GET /conversations`  
  Returns a list of conversations (sorted by `updatedAt` desc) with last message summary.  
  Query params:  
  - `limit` (optional, max 100, default 50)
- `GET /conversations/stream` (SSE)  
  Emits `conversation` events when a new conversation is created (payload includes summary).

## Recommended flow
1. Open SSE at `/chat/stream/:conversationId` (use an existing `conversationId`).
2. Send `POST /chat` with the `conversationId` (or without it to create a new one).
3. Receive `token` and `done` events in real time.
4. Fetch history with `GET /chat/:conversationId` if you need to refresh.

## OpenAI integration (commented)
The service already includes the commented logic to use the official OpenAI SDK with streaming. To enable it:
1. Set `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env`.
2. Uncomment the OpenAI block in `src/services/chat.service.ts` and remove the simulation section if you don’t need it.

## requests.http
Includes ready-to-run examples for VS Code REST Client:
- `POST /chat`
- `GET /chat/stream/:conversationId`
- `GET /chat/:conversationId`

## Notes
- Streaming is only via SSE (no WebSockets).
- If no SSE clients are connected, the response is still generated and persisted.

## Deploy to Vercel
`vercel.json` and the serverless handler are already included in `api/index.ts`.
1. Set environment variables (`MONGODB_URI`, `OPENAI_*`, optional `PORT`) in Vercel dashboard.
2. Push the repo to GitHub/GitLab/Bitbucket and link it in Vercel.
3. Vercel will build the function with `@vercel/node` using `api/index.ts`. All routes are routed there, mounting Express and connecting to MongoDB.
4. For local Vercel testing: `vercel dev`.
