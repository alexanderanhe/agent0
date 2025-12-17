import OpenAI from "openai";
import mongoose from "mongoose";
import { env } from "../config/env";
import {
  Conversation,
  ConversationDocument,
  MessageRole,
  Message,
} from "../models/conversation.model";
import { sseService } from "./sse.service";
import { HttpError } from "../utils/httpError";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type MessageWithIsoDate = Omit<Message, "createdAt"> & { createdAt: string };

type MessagesPage = {
  conversationId: string;
  messages: MessageWithIsoDate[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export class ChatService {
  private openai = env.openAiApiKey
    ? new OpenAI({ apiKey: env.openAiApiKey })
    : null;

  async getConversation(conversationId: string): Promise<ConversationDocument> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new HttpError(400, "Invalid conversationId");
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new HttpError(404, "Conversation not found");
    }
    return conversation;
  }

  async ensureConversation(conversationId?: string) {
    if (conversationId) {
      return this.getConversation(conversationId);
    }
    const created = await Conversation.create({ messages: [] });
    return created;
  }

  async addMessage(
    conversationId: string,
    role: MessageRole,
    content: string
  ): Promise<ConversationDocument> {
    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: {
          messages: {
            role,
            content,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!updated) {
      throw new HttpError(404, "Conversation not found");
    }
    return updated;
  }

  async getMessagesPage(
    conversationId: string,
    options: { before?: string; limit: number }
  ): Promise<MessagesPage> {
    const conversation = await this.getConversation(conversationId);
    const limit = Math.max(1, options.limit);
    const beforeDate = options.before ? new Date(options.before) : null;

    const messages: MessageWithIsoDate[] = conversation.messages
      .map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.createdAt).toISOString(),
      }))
      .sort(
        (a: MessageWithIsoDate, b: MessageWithIsoDate) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    const filtered = beforeDate
      ? messages.filter(
          (msg: MessageWithIsoDate) =>
            new Date(msg.createdAt).getTime() < beforeDate.getTime()
        )
      : messages;

    const start = Math.max(filtered.length - limit, 0);
    const page = filtered.slice(start);
    const hasMore = start > 0;
    const nextCursor =
      hasMore && page.length > 0
        ? new Date(page[0].createdAt).toISOString()
        : null;

    return {
      conversationId: conversation.id,
      messages: page,
      total: messages.length,
      hasMore,
      nextCursor,
    };
  }

  async listConversations(limit: number) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const conversations = await Conversation.find({})
      .sort({ updatedAt: -1 })
      .limit(safeLimit)
      .lean();

    return conversations.map((conv) => {
      const lastMessage = conv.messages[conv.messages.length - 1];
      return {
        id: conv._id.toString(),
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessage: lastMessage
          ? {
              role: lastMessage.role,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
            }
          : null,
        messagesCount: conv.messages.length,
      };
    });
  }

  async streamAssistantResponse(conversationId: string, userInput: string) {
    try {
      // --- Real OpenAI streaming example (commented) ---
      // if (!this.openai) {
      //   throw new HttpError(400, "Missing OPENAI_API_KEY");
      // }
      //
      // const stream = await this.openai.chat.completions.create({
      //   model: env.openAiModel,
      //   messages: [{ role: "user", content: userInput }],
      //   stream: true,
      // });
      //
      // let collected = "";
      // for await (const chunk of stream) {
      //   const delta = chunk.choices[0]?.delta?.content || "";
      //   if (!delta) continue;
      //   collected += delta;
      //   sseService.emitToken(conversationId, delta);
      // }
      // await this.addMessage(conversationId, "assistant", collected.trim());
      // sseService.emitDone(conversationId);

      // --- Simulated streaming fallback ---
      const simulated = this.buildSimulatedResponse(userInput);
      const tokens = simulated.split(" ");
      let assembled = "";

      for (const token of tokens) {
        const chunk = `${token} `;
        assembled += chunk;
        sseService.emitToken(conversationId, chunk);
        await delay(120);
      }

      const finalMessage = assembled.trim();
      await this.addMessage(conversationId, "assistant", finalMessage);
      sseService.emitDone(conversationId);
    } catch (error) {
      sseService.emitError(
        conversationId,
        error instanceof Error ? error.message : "Streaming failed"
      );
      throw error;
    }
  }

  private buildSimulatedResponse(userInput: string) {
    const template =
      "Simulated assistant reply for your message. Streaming tokens one by one.";
    return `${template} Detail: ${userInput}`;
  }

  buildConversationSummary(conversation: ConversationDocument) {
    const plain = conversation.toObject();
    const lastMessage = plain.messages[plain.messages.length - 1];
    return {
      id: conversation.id,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
      messagesCount: plain.messages.length,
      lastMessage: lastMessage
        ? {
            role: lastMessage.role,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
          }
        : null,
    };
  }
}

export const chatService = new ChatService();
