import { useState, type FormEvent } from "react";
import { Chrome, LockKeyhole, UserRound } from "lucide-react";
import { signInWithGoogleDemo, type AuthUser } from "../lib/auth";
import { loginWithApi, registerWithApi } from "../lib/authClient";
import type { Role } from "../types";

export function AuthScreen({
  onAuthenticated,
}: {
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const user = mode === "login"
        ? await loginWithApi(email, password)
        : await registerWithApi(name, email, password, role);
      onAuthenticated(user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    }
  }

  function switchMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-mark" aria-hidden="true">
          <span>U</span>
          <i />
        </div>
        <p className="auth-kicker">UniServe</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-intro">
          {mode === "login"
            ? "Sign in to manage your campus deliveries."
            : "Join the campus delivery community in a few seconds."}
        </p>

        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            className={mode === "login" ? "selected" : ""}
            type="button"
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            className={mode === "signup" ? "selected" : ""}
            type="button"
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Jessa M."
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@buksu.edu.ph"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
          </label>
          {mode === "signup" && (
            <label>
              Use UniServe as
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
              >
                <option value="customer">Student / customer</option>
                <option value="courier">Courier</option>
                <option value="store">Entrepreneur</option>
              </select>
            </label>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button auth-submit" type="submit">
            <LockKeyhole size={17} />
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>
        <button
          className="google-button"
          type="button"
          onClick={() => onAuthenticated(signInWithGoogleDemo())}
        >
          <Chrome size={17} />
          Continue with Google
        </button>
        <button
          className="guest-button"
          type="button"
          onClick={() =>
            onAuthenticated({
              name: "Guest User",
              email: "guest@demo.local",
              role: "customer",
            })
          }
        >
          <UserRound size={16} />
          Continue as guest
        </button>
        <p className="auth-note">
          Create your account here and get started with UniServe.
        </p>
      </section>
    </main>
  );
}
