import mongoose from "mongoose";
import { env } from "./config/env";

let isConnecting = false;

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (isConnecting) {
    await new Promise((resolve) =>
      mongoose.connection.once("connected", resolve)
    );
    return;
  }

  isConnecting = true;
  try {
    await mongoose.connect(env.mongoUri);
  } finally {
    isConnecting = false;
  }
}
