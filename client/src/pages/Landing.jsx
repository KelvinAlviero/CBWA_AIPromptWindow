import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="landing">
      <h1>AI Capsule</h1>
      <p className="lead">
        A private library for the AI prompts you actually find useful. Save the prompt, a summary
        of the response, how well it worked, and what you would change next time.
      </p>

      <ul className="feature-list">
        <li>Keep every prompt with its project, version and category</li>
        <li>Record whether you reviewed the response and whether the output improved</li>
        <li>Your records are private and only visible after you sign in</li>
      </ul>

      <div className="landing-actions">
        <Link to="/login" className="button-link">Sign in</Link>
        <Link to="/dashboard" className="button-link secondary-button">Go to dashboard</Link>
      </div>
    </main>
  );
}
