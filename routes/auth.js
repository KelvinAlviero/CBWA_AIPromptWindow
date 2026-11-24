import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const TOKEN_LIFETIME_SECONDS = 2 * 60 * 60; // 2 hours

const isProd = () => process.env.NODE_ENV === "production";
const baseUrl = () => (process.env.BASE_URL || "").replace(/\/$/, "");

// HttpOnly: JavaScript cannot read it. Secure: HTTPS only (on in production;
// off locally because plain http://localhost is not HTTPS). SameSite=Lax
// still lets the cookie ride along after the redirect back from GitHub.
function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

// Step 1: send the browser to GitHub. A random "state" value is stored in a
// short-lived cookie and checked on the way back to block login CSRF.
router.get("/auth/github", (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.redirect("/login?error=config");
  }
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, cookieOptions(10 * 60 * 1000));

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${baseUrl()}/auth/github/callback`,
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub sends the user back with ?code=... We exchange the code for a
// GitHub access token (used once, never stored or sent to the browser), read
// the GitHub user, then issue OUR OWN JWT as the session.
router.get("/auth/github/callback", async (req, res) => {
  const { code, state } = req.query;
  const expectedState = req.cookies?.oauth_state;
  res.clearCookie("oauth_state", { path: "/" });

  if (!code || !state || !expectedState || state !== expectedState) {
    return res.redirect("/login?error=state");
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${baseUrl()}/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(`GitHub did not return an access token: ${tokenData.error || "unknown"}`);
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "ai-capsule",
      },
    });
    if (!userRes.ok) {
      throw new Error(`GitHub user lookup failed with status ${userRes.status}`);
    }
    const ghUser = await userRes.json();

    // sub = the GitHub user ID. This becomes capsules.user_id.
    const token = jwt.sign(
      { sub: String(ghUser.id), login: ghUser.login },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: TOKEN_LIFETIME_SECONDS }
    );

    res.cookie("token", token, cookieOptions(TOKEN_LIFETIME_SECONDS * 1000));
    res.redirect("/dashboard");
  } catch (err) {
    console.error("OAuth callback failed:", err.message);
    res.redirect("/login?error=oauth");
  }
});

// The cookie is HttpOnly, so only the server can remove it.
router.post("/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
  });
  res.status(204).end();
});

// Used by the React app to learn who is logged in (and whether anyone is).
router.get("/api/me", requireAuth, (req, res) => {
  res.json({ id: req.userId, login: req.userLogin });
});

export default router;
