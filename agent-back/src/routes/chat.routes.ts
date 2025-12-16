import { Router } from "express";
import {
  getConversation,
  postChat,
  streamConversation,
  listConversations,
  streamConversations,
} from "../controllers/chat.controller";

const router = Router();

router.get("/chat/stream/:conversationId", streamConversation);
router.post("/chat", postChat);
router.get("/chat/:conversationId", getConversation);
router.get("/conversations", listConversations);
router.get("/conversations/stream", streamConversations);

export default router;
