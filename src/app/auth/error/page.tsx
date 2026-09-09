"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const isAccessDenied = error === "AccessDenied";

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "0 24px", textAlign: "center" }}>
        <div style={{ height: 5, background: "#16233F", borderRadius: 2, marginBottom: 32 }} />

        <div style={{
          width: 48, height: 48, margin: "0 auto 20px", borderRadius: "50%",
          background: "rgba(154, 74, 50, 0.12)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          🔒
        </div>

        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 600, color: "#16233F", margin: "0 0 12px" }}>
          {isAccessDenied ? "Invitation required" : "Something went wrong"}
        </h1>

        <p style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 14, color: "#6E6656", lineHeight: 1.6, margin: "0 0 24px" }}>
          {isAccessDenied
            ? "This application is invite-only. To get access, ask a project owner to add your email address to their project. Once invited, come back and sign in."
            : "There was a problem signing you in. Please try again."}
        </p>

        {isAccessDenied ? (
          <div style={{
            background: "#F2ECDD", border: "1px solid #DDD3BC", borderRadius: 4,
            padding: "14px 18px", textAlign: "left", marginBottom: 24,
          }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A9762E", margin: "0 0 8px" }}>
              How to get access
            </p>
            <ol style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 13, color: "#1E2433", margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Ask a project owner to invite you by email</li>
              <li>They will share a project link with you</li>
              <li>Come back here and sign in with the invited email</li>
            </ol>
          </div>
        ) : null}

        <Link
          href="/auth/signin"
          style={{
            display: "inline-block", padding: "11px 24px", borderRadius: 3,
            border: "1px solid #16233F", background: "#16233F", color: "#FAF6EC",
            fontFamily: "'Libre Franklin', sans-serif", fontSize: 13, fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
