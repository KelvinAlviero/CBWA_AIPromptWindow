import { useEffect, useRef, useState } from "react";

const CATEGORIES = ["Coding", "Writing", "Research", "Debugging", "Study", "Other"];
const USEFULNESS = ["Good", "Needs Improvement"];

const EMPTY_FORM = {
  project_name: "",
  prompt_title: "",
  prompt_version: "",
  prompt_text: "",
  response_summary: "",
  category: "",
  usefulness: "",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

// Copy only the form fields from a capsule (leaves out id, created_at, etc.)
function toFormState(capsule) {
  const state = { ...EMPTY_FORM };
  for (const key of Object.keys(EMPTY_FORM)) {
    if (capsule[key] !== null && capsule[key] !== undefined) state[key] = capsule[key];
  }
  return state;
}

// editing = the capsule being edited, or null when adding a new one.
// onSubmit(formData) must resolve to true when the save worked.
export default function CapsuleForm({ editing, onSubmit, onCancel }) {
  const [form, setForm] = useState(editing ? toFormState(editing) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  // Load the capsule into the form when "Edit" is clicked.
  useEffect(() => {
    setForm(editing ? toFormState(editing) : EMPTY_FORM);
    if (editing) formRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [editing]);

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok && !editing) setForm(EMPTY_FORM);
  }

  return (
    <form ref={formRef} className="prompt-form" onSubmit={handleSubmit}>
      <label htmlFor="project_name">Project name</label>
      <input id="project_name" name="project_name" value={form.project_name} onChange={handleChange} required />

      <label htmlFor="prompt_title">Prompt title</label>
      <input id="prompt_title" name="prompt_title" value={form.prompt_title} onChange={handleChange} required />

      <label htmlFor="prompt_version">Prompt version</label>
      <input id="prompt_version" name="prompt_version" placeholder="v1" value={form.prompt_version} onChange={handleChange} />

      <label htmlFor="prompt_text">Prompt text</label>
      <textarea id="prompt_text" name="prompt_text" rows="4" value={form.prompt_text} onChange={handleChange} required />

      <label htmlFor="response_summary">Response summary</label>
      <textarea id="response_summary" name="response_summary" rows="3" value={form.response_summary} onChange={handleChange} />

      <label htmlFor="category">Category</label>
      <select id="category" name="category" value={form.category} onChange={handleChange}>
        <option value="">Select a category</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label htmlFor="usefulness">Usefulness</label>
      <select id="usefulness" name="usefulness" value={form.usefulness} onChange={handleChange}>
        <option value="">Select a rating</option>
        {USEFULNESS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      <div className="checkbox-row">
        <label className="checkbox-label">
          <input type="checkbox" name="reviewed" checked={form.reviewed} onChange={handleChange} />
          Response reviewed
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="improved" checked={form.improved} onChange={handleChange} />
          Output improved
        </label>
      </div>

      <label htmlFor="screenshot_url">Screenshot URL (optional)</label>
      <input id="screenshot_url" name="screenshot_url" type="url" placeholder="https://..." value={form.screenshot_url} onChange={handleChange} />

      <label htmlFor="notes">Notes</label>
      <textarea id="notes" name="notes" rows="2" value={form.notes} onChange={handleChange} />

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {editing ? "Save changes" : "Add prompt"}
        </button>
        {editing && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}
