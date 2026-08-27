import { describe, expect, it } from "vitest";
import { signIn, signInWithGoogleDemo, signUp } from "./auth";

describe("demo authentication", () => {
  it("rejects incomplete sign-in details", () => {
    expect(signIn("", "").ok).toBe(false);
  });

  it("creates a user from valid sign-up details", () => {
    const result = signUp("Jessa M.", "jessa@example.com", "campus123", "customer");

    expect(result).toEqual({
      ok: true,
      user: { name: "Jessa M.", email: "jessa@example.com", role: "customer" }
    });
  });

  it("provides a clearly demo-only Google session", () => {
    expect(signInWithGoogleDemo().email).toBe("demo@buksu.edu.ph");
  });
});