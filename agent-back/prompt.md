# Prompt for Codex – Chat-like backend with Node, Express, MongoDB, and SSE

## Context

I have an existing project using **Node.js + Express** and want to implement a ChatGPT-style chat.  
The backend must store conversations in **MongoDB** and stream responses in real time via **SSE (Server-Sent Events)**.  
If the user reloads the page, they should be able to restore the saved conversation.

---

## Goal

Implement a backend that provides:

1. A **POST** endpoint to send a message (prompt / input text).
2. An **SSE (text/event-stream)** endpoint to stream the bot response in real time.

The full conversation (user and assistant messages) must be persisted in MongoDB.

---

## Functional requirements

### 1. Data model (MongoDB)

- Collection: `conversations`
- Document structure:
  - `_id`
  - `createdAt`
  - `updatedAt`
  - `messages`: array of objects:
    ```json
    {
      "role": "user" | "assistant",
      "content": "string",
      "createdAt": "Date"
    }
    ```

- Rules:
  - Create a new conversation if `conversationId` is not provided.
  - Reuse an existing conversation if `conversationId` is provided.

---

### 2. POST /chat

- Request body (JSON):
```json
  {
    "conversationId": "string (optional)",
    "input": "user text"
  }
```
- Behavior:
  - If `conversationId` does not exist, create a new conversation.
  - Store the user message in MongoDB.
  - Generate the assistant response (simulated for now).
  - Stream the response via SSE to clients connected to the conversation.
  - When streaming ends, store the full assistant message in MongoDB.

- Immediate response:
```json
{
  "conversationId": "string",
  "status": "streaming"
}
```

### 3. GET /chat/stream/:conversationId (SSE)
- Required headers:
  - Content-Type: text/event-stream
  - Cache-Control: no-cache
  - Connection: keep-alive

- Behavior:
  - Keep the connection open.
  - Emit events in real time.

- Event types:
  - event: token → text chunks
  - event: done → completion
  - event: error → errors

- Must allow multiple SSE clients connected to the same conversation.

---

### 4. Restore conversation on reload

- Additional endpoint:
  - `GET /chat/:conversationId`
- Must return:
  - The full conversation history, or at least the messages array.

---

### 5. OpenAI simulation (commented implementation)
- In the POST flow:
  - Include the real OpenAI streaming implementation using the official SDK.
  - Leave OpenAI code commented.
  - Instead:
    - Generate a simulated response.
    - Send tokens progressively (by word or character).
    - Use small delays without blocking the event loop.

- The simulation must use the exact same SSE mechanism that real OpenAI would use later.

---

### 6. Project structure
Example structure:
```lua
src/
 ├── index.ts | server.ts
 ├── config/
 │    └── env.ts
 ├── models/
 │    └── conversation.model.ts
 ├── routes/
 │    └── chat.routes.ts
 ├── controllers/
 │    └── chat.controller.ts
 ├── services/
 │    ├── chat.service.ts
 │    └── sse.service.ts
 ├── middlewares/
 │    └── error.middleware.ts
```

Additional requirements:
- Use `mongoose`.
- Basic input validation.
- Centralized error handling.

---

### 7. requests.http file
- Create a `requests.http` file with ready-to-run examples (VS Code REST Client).
- Must include:
  - POST /chat
  - GET /chat/stream/:conversationId
  - GET /chat/:conversationId

- Use variables for host and conversationId if possible.

---

### 8. README.md

Must include:

- Project description
- Requirements
- Installation
- Environment variables
- How to run in development
- Endpoint documentation
- Recommended flow:
  1. Open SSE connection
  2. Send POST with input
  3. Receive streaming
  4. Fetch history
- Notes about the OpenAI integration (commented) and how to enable it later.

---

### 9. .env.example

Must include all used variables, for example:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chat-db
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini

```

---

### Technical constraints
- Streaming must use SSE only.
- Do not use WebSockets.
- SSE must be tied to a conversation.
- If no SSE clients are connected, the response must still be generated and persisted.
- The server must keep using Express.

---

### Deliverables
- Functional complete code.
- requests.http
- README.md
- .env.example

---

### Expected output format
- Final file tree.
- Content of new and modified files.
- Clear instructions to run and test the project.
