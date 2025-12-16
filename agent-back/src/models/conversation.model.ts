import mongoose, { Document, Schema } from "mongoose";

export type MessageRole = "user" | "assistant";

export interface Message {
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface ConversationDocument extends Document {
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<Message>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new Schema<ConversationDocument>(
  {
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "conversations",
  }
);

export const Conversation = mongoose.model<ConversationDocument>(
  "Conversation",
  conversationSchema
);
