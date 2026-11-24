const yesNo = (value) => (value ? "Yes" : "No");

// React escapes text automatically, so the old escapeHtml() is not needed.
export default function CapsuleList({ capsules, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Prompt title</th>
            <th>Version</th>
            <th>Category</th>
            <th>Prompt text</th>
            <th>Response summary</th>
            <th>Usefulness</th>
            <th>Reviewed</th>
            <th>Improved</th>
            <th>Screenshot</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {capsules.map((c) => (
            <tr key={c.id}>
              <td>{c.project_name}</td>
              <td>{c.prompt_title}</td>
              <td>{c.prompt_version}</td>
              <td>{c.category}</td>
              <td>{c.prompt_text}</td>
              <td>{c.response_summary}</td>
              <td>{c.usefulness}</td>
              <td>{yesNo(c.reviewed)}</td>
              <td>{yesNo(c.improved)}</td>
              <td>
                {/^https?:\/\//i.test(c.screenshot_url || "") && (
                  <a href={c.screenshot_url} target="_blank" rel="noreferrer">View</a>
                )}
              </td>
              <td>{c.notes}</td>
              <td className="row-actions">
                <button type="button" className="edit-button" onClick={() => onEdit(c)}>Edit</button>
                <button type="button" className="delete-button" onClick={() => onDelete(c)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {capsules.length === 0 && <p className="empty-message">No prompts saved yet.</p>}
    </div>
  );
}
