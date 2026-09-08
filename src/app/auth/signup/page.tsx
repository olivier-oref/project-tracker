"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.url) {
      window.location.href = result.url;
    } else {
      setError("Account created but sign-in failed. Try signing in manually.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ height: 5, background: "#16233F", borderRadius: 2, marginBottom: 32 }} />

        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 600, color: "#16233F", margin: "0 0 8px" }}>
          Create account
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6E6656", margin: "0 0 28px" }}>
          Project Tracker
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          style={{
            width: "100%", padding: "11px 16px", borderRadius: 3,
            border: "1px solid #C9BDA0", background: "#F2ECDD", color: "#1E2433",
            fontFamily: "'Libre Franklin', sans-serif", fontSize: 13, fontWeight: 500,
            cursor: "pointer", marginBottom: 20,
          }}
        >
          Continue with Google
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: 12, margin: "0 0 20px",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6E6656",
          textTransform: "uppercase", letterSpacing: "0.12em",
        }}>
          <span style={{ flex: 1, height: 1, background: "#DDD3BC" }} />
          or
          <span style={{ flex: 1, height: 1, background: "#DDD3BC" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              padding: "10px 12px", borderRadius: 3, border: "1px solid #C9BDA0",
              background: "#F2ECDD", color: "#1E2433", fontFamily: "'Libre Franklin', sans-serif", fontSize: 13,
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "10px 12px", borderRadius: 3, border: "1px solid #C9BDA0",
              background: "#F2ECDD", color: "#1E2433", fontFamily: "'Libre Franklin', sans-serif", fontSize: 13,
            }}
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              padding: "10px 12px", borderRadius: 3, border: "1px solid #C9BDA0",
              background: "#F2ECDD", color: "#1E2433", fontFamily: "'Libre Franklin', sans-serif", fontSize: 13,
            }}
          />

          {error ? (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#9A4A32", margin: 0 }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "11px 16px", borderRadius: 3, border: "1px solid #16233F",
              background: "#16233F", color: "#FAF6EC", fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 13, fontWeight: 500, cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6E6656", marginTop: 20, textAlign: "center" }}>
          Already have an account?{" "}
          <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} style={{ color: "#A9762E", textDecoration: "underline" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
