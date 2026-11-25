import { useSearchParams } from "react-router-dom";

const ERROR_MESSAGES = {
  state: "Login could not be verified. Please try again.",
  oauth: "GitHub sign-in failed. Please try again.",
  config: "GitHub sign-in is not configured on the server.",
};

export default function Login() {
  const [params] = useSearchParams();
  const errorKey = params.get("error");

  return (
    <section className="login-page" aria-labelledby="login-title">
      <h1 id="login-title">AI Capsule</h1>

      <p className="error" role="alert">
        {errorKey ? ERROR_MESSAGES[errorKey] || "Sign-in failed." : ""}
      </p>

      {/* A normal link, not fetch(): the browser must follow the redirect to GitHub. */}
      <a href="/auth/github" className="button-link github-button">
        Sign in with GitHub
      </a>
    </section>
  );
}
