import jwt from "jsonwebtoken";

// Verifies the application JWT stored in the HttpOnly cookie named "token".
// On success the verified identity is attached to the request; the rest of the
// app must use req.userId and never read a user id from the request body.
export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.userId = String(payload.sub);
    req.userLogin = payload.login;
    next();
  } catch {
    // Covers malformed, tampered and expired tokens (e.g. "fake-token-123").
    return res.status(401).json({ error: "Unauthorized" });
  }
}
