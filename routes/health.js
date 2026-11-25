import { Router } from "express";

const router = Router();

// Public: lets anyone (or Render) check the backend without logging in.
router.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
