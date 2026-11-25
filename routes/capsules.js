import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// One line protects GET, POST, PUT and DELETE below: every route registered on
// this router runs requireAuth first.
router.use(requireAuth);

const TEXT_FIELDS = [
  "project_name",
  "prompt_title",
  "prompt_version",
  "prompt_text",
  "response_summary",
  "category",
  "usefulness",
  "screenshot_url",
  "notes",
];
const REQUIRED = ["project_name", "prompt_title", "prompt_text"];

// Whitelist the fields we accept. user_id, id and created_at in the request
// body are ignored on purpose.
function readBody(body = {}) {
  const data = {};
  for (const field of TEXT_FIELDS) {
    data[field] = typeof body[field] === "string" ? body[field].trim() : "";
  }
  data.reviewed = body.reviewed ? 1 : 0;
  data.improved = body.improved ? 1 : 0;
  return data;
}

function validate(data) {
  const missing = REQUIRED.filter((f) => !data[f]);
  if (missing.length) return `Missing required field(s): ${missing.join(", ")}`;
  // Only allow http(s) links so a "javascript:" URL can never end up in an href.
  if (data.screenshot_url && !/^https?:\/\//i.test(data.screenshot_url)) {
    return "screenshot_url must start with http:// or https://";
  }
  return null;
}

// Send the client booleans, and never expose user_id.
function toDto(row) {
  const { user_id, ...rest } = row;
  return { ...rest, reviewed: !!row.reviewed, improved: !!row.improved };
}

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// READ - only this user's records
router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM capsules WHERE user_id = ? ORDER BY id DESC")
    .all(req.userId);
  res.json(rows.map(toDto));
});

// CREATE - owner comes from the verified JWT
router.post("/", (req, res) => {
  const data = readBody(req.body);
  const error = validate(data);
  if (error) return res.status(400).json({ error });

  const result = db
    .prepare(
      `INSERT INTO capsules
        (user_id, project_name, prompt_title, prompt_version, prompt_text,
         response_summary, category, usefulness, reviewed, improved,
         screenshot_url, notes)
       VALUES
        (@user_id, @project_name, @prompt_title, @prompt_version, @prompt_text,
         @response_summary, @category, @usefulness, @reviewed, @improved,
         @screenshot_url, @notes)`
    )
    .run({ ...data, user_id: req.userId });

  const row = db.prepare("SELECT * FROM capsules WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(toDto(row));
});

// UPDATE - "AND user_id = ?" means someone else's id simply matches nothing
router.put("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: "Not found" });

  const data = readBody(req.body);
  const error = validate(data);
  if (error) return res.status(400).json({ error });

  const result = db
    .prepare(
      `UPDATE capsules SET
         project_name = @project_name, prompt_title = @prompt_title,
         prompt_version = @prompt_version, prompt_text = @prompt_text,
         response_summary = @response_summary, category = @category,
         usefulness = @usefulness, reviewed = @reviewed, improved = @improved,
         screenshot_url = @screenshot_url, notes = @notes
       WHERE id = @id AND user_id = @user_id`
    )
    .run({ ...data, id, user_id: req.userId });

  if (result.changes === 0) return res.status(404).json({ error: "Not found" });

  const row = db.prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?").get(id, req.userId);
  res.json(toDto(row));
});

// DELETE - same ownership rule
router.delete("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: "Not found" });

  const result = db
    .prepare("DELETE FROM capsules WHERE id = ? AND user_id = ?")
    .run(id, req.userId);

  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
