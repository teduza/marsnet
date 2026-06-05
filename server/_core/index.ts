import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import fs from "node:fs";
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
  // In production, the server is bundled into dist/index.js
  // Static files are in dist/public
  const publicPath = path.resolve(__dirname, "public");
  const indexPath = path.join(publicPath, "index.html");
  
  console.log(`[Static] __dirname: ${__dirname}`);
  console.log(`[Static] publicPath: ${publicPath}`);
  console.log(`[Static] index.html exists: ${fs.existsSync(indexPath)}`);

  // Use static middleware first
  app.use(express.static(publicPath));
  
  // Catch-all for SPA routing
  app.get("*", (req, res) => {
    console.log(`[Static] Catch-all route for: ${req.url}`);
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`[Static] Error: index.html not found at ${indexPath}`);
      res.status(404).send("Frontend build not found. Please check deployment logs.");
    }
  });
} else {
  app.get("/", (req, res) => {
    res.send("MARSNet Server is running in development mode. Use 'pnpm dev' for frontend.");
  });
}

const PORT = ENV.port;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] MARSNet running on http://0.0.0.0:${PORT} in ${ENV.nodeEnv} mode`);
});
