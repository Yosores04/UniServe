import { useRef, useState, type FormEvent } from "react";
import { GraduationCap, LockKeyhole } from "lucide-react";
import type { AuthUser } from "../lib/auth";
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
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const user =
        mode === "login"
          ? await loginWithApi(email.trim(), password)
          : await registerWithApi(name.trim(), email.trim(), password, role);
      onAuthenticated(user);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
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
          <GraduationCap size={26} strokeWidth={1.6} />
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
          role="group"
          aria-label="Authentication mode"
        >
          <button
            className={mode === "login" ? "selected" : ""}
            aria-pressed={mode === "login"}
            type="button"
            disabled={busy}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            className={mode === "signup" ? "selected" : ""}
            aria-pressed={mode === "signup"}
            type="button"
            disabled={busy}
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
                required minLength={2} maxLength={100} autoComplete="name"
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
              required maxLength={254} autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@buksu.edu.ph"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required minLength={6} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            <LockKeyhole size={17} />
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="auth-note">
          Sign in with your UniServe account. Student entrepreneurs can register,
          set up a shop, and request admin verification.
        </p>
      </section>
    </main>
  );
}
