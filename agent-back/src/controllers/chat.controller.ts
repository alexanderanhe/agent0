import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { chatService } from "../services/chat.service";
import { sseService } from "../services/sse.service";
import { env } from "../config/env";

const postChatSchema = z.object({
  conversationId: z.string().trim().optional(),
  input: z.string().trim().min(1, "input is required"),
});

const conversationParamSchema = z.object({
  conversationId: z.string().trim().min(1),
});

const conversationQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const listConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function postChat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { conversationId, input } = postChatSchema.parse(req.body);
    const conversation = await chatService.ensureConversation(conversationId);
    const createdNew = !conversationId;
    const updatedConversation = await chatService.addMessage(
      conversation.id,
      "user",
      input
    );

    res.json({ conversationId: conversation.id, status: "streaming" });

    void chatService
      .streamAssistantResponse(conversation.id, input)
      .catch((err) => {
        console.error("Streaming failed", err);
      });

    if (createdNew) {
      const summary = chatService.buildConversationSummary(updatedConversation);
      sseService.emitConversationCreated(summary);
    }
  } catch (error) {
    next(error);
  }
}

export async function getConversation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { conversationId } = conversationParamSchema.parse(req.params);
    const { before, limit } = conversationQuerySchema.parse(req.query);
    const page = await chatService.getMessagesPage(conversationId, {
      before,
      limit: Math.min(limit ?? env.chatPageSize, 100),
    });
    res.json(page);
  } catch (error) {
    next(error);
  }
}

export async function listConversations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { limit } = listConversationsQuerySchema.parse(req.query);
    const data = await chatService.listConversations(limit ?? 50);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function streamConversation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { conversationId } = conversationParamSchema.parse(req.params);
    await chatService.getConversation(conversationId);
    sseService.addClient(conversationId, res);
  } catch (error) {
    next(error);
  }
}

export async function streamConversations(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    sseService.addClient("conversations", res);
  } catch (error) {
    next(error);
  }
}
