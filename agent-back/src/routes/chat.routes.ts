import { Router } from "express";
import {
  getConversation,
  postChat,
  streamConversation,
  listConversations,
  streamConversations,
  deleteConversation,
} from "../controllers/chat.controller";

const router = Router();

router.get("/chat/stream/:conversationId", streamConversation);
router.post("/chat", postChat);
router.get("/chat/:conversationId", getConversation);
router.get("/conversations", listConversations);
router.delete("/conversations/:conversationId", deleteConversation);
router.get("/conversations/stream", streamConversations);

export default router;
