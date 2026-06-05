import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createTRPCContext } from "./trpc";
import { setupSocketIO } from "../realtime";
import { ENV } from "./env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

// Socket.io
setupSocketIO(httpServer);

// Serve static files in production
if (ENV.nodeEnv === "production") {
  const publicPath = path.resolve(__dirname, "../../dist/public");
  app.use(express.static(publicPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

const PORT = ENV.port;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] MARSNet running on http://0.0.0.0:${PORT} in ${ENV.nodeEnv} mode`);
});
