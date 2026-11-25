import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useUser } from "../components/ProtectedRoute.jsx";
import CapsuleForm from "../components/CapsuleForm.jsx";
import CapsuleList from "../components/CapsuleList.jsx";

// This is the old app.js, rewritten: the `prompts` array and localStorage are
// replaced by state that mirrors what the server returns.
export default function Dashboard() {
  const user = useUser();
  const navigate = useNavigate();

  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // capsule being edited, or null
  const [error, setError] = useState("");

  // If the session expired, any API call returns 401 -> back to the login page.
  function handleError(err) {
    if (err.status === 401) {
      navigate("/login", { replace: true });
      return;
    }
    setError(err.message);
  }

  async function refresh() {
    try {
      setCapsules(await api.list());
      setError("");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // CREATE or UPDATE depending on whether we are editing
  async function handleSave(data) {
    try {
      if (editing) await api.update(editing.id, data);
      else await api.create(data);
      await refresh();
      setEditing(null);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  async function handleDelete(capsule) {
    if (!window.confirm(`Delete "${capsule.prompt_title}"?`)) return;
    try {
      await api.remove(capsule.id);
      if (editing?.id === capsule.id) setEditing(null);
      await refresh();
    } catch (err) {
      handleError(err);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <section className="database-page">
      <header className="topbar">
        <h1>AI Capsule</h1>
        <div className="topbar-right">
          {user && <span className="user-label">Signed in as {user.login}</span>}
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="sheet">
        <CapsuleForm editing={editing} onSubmit={handleSave} onCancel={() => setEditing(null)} />

        <div className="list-header">
          <h2>Saved prompts</h2>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {loading ? (
          <p className="empty-message">Loading…</p>
        ) : (
          <CapsuleList capsules={capsules} onEdit={setEditing} onDelete={handleDelete} />
        )}
      </div>
    </section>
  );
}
