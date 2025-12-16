import { Response } from "express";

type SSEClient = Response;

class SSEService {
  private clients = new Map<string, Set<SSEClient>>();

  addClient(conversationId: string, res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`: connected to ${conversationId}\n\n`);

    const existing = this.clients.get(conversationId) || new Set<SSEClient>();
    existing.add(res);
    this.clients.set(conversationId, existing);

    res.on("close", () => {
      this.removeClient(conversationId, res);
    });
  }

  removeClient(conversationId: string, res: Response) {
    const set = this.clients.get(conversationId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
      this.clients.delete(conversationId);
    }
  }

  emitToken(conversationId: string, token: string) {
    this.broadcast(conversationId, "token", { token });
  }

  emitDone(conversationId: string) {
    this.broadcast(conversationId, "done", { status: "completed" });
  }

  emitError(conversationId: string, message: string) {
    this.broadcast(conversationId, "error", { message });
  }

  emitConversationCreated(summary: unknown) {
    this.broadcast("conversations", "conversation", {
      type: "created",
      conversation: summary,
    });
  }

  private broadcast(conversationId: string, event: string, payload: unknown) {
    const set = this.clients.get(conversationId);
    if (!set || set.size === 0) return;
    const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of set) {
      res.write(data);
    }
  }
}

export const sseService = new SSEService();
