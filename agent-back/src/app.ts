import express, { Application } from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.routes";
import { errorHandler } from "./middlewares/error.middleware";

let cachedApp: Application | null = null;

export function getApp(): Application {
  if (cachedApp) return cachedApp;

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/", chatRoutes);
  app.use(errorHandler);

  cachedApp = app;
  return app;
}
