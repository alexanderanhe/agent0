import { env } from "./config/env";
import { connectToDatabase } from "./db";
import { getApp } from "./app";

async function bootstrap() {
  await connectToDatabase();
  const app = getApp();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
