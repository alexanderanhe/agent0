import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../src/db";
import { getApp } from "../src/app";

const app = getApp();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  await connectToDatabase();
  return app(req as any, res as any);
}
