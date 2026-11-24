import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import capsulesRouter from "./routes/capsules.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(here, "..", "client", "dist");

const app = express();

// Render terminates HTTPS at a proxy in front of Express. Without this,
// Express thinks the request is plain HTTP and Secure cookies can misbehave.
app.set("trust proxy", 1);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// API + auth routes
app.use(healthRouter);
app.use(authRouter);
app.use("/api/capsules", capsulesRouter);

// Any other /api path: JSON 404 (never fall through to the React page)
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// The built React app is served by this same server -> one origin, no CORS.
app.use(express.static(clientDist));

// React Router fallback so refreshing /dashboard or /login still loads the app.
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/auth")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`AI Capsule listening on port ${port}`);
});
