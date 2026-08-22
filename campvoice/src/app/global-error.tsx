"use client";

/**
 * The last-resort boundary, used when the root layout itself fails. It must
 * render its own <html> and <body>, and cannot rely on the app's CSS.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#faf8f4",
          color: "#182722",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>CampVoice is having a problem</h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#40534c" }}>
            Your information is safe. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              borderRadius: "999px",
              background: "#2a4b39",
              color: "#fdfcfa",
              border: 0,
              padding: "0.7rem 1.5rem",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1.25rem", fontSize: "0.75rem", color: "#7d908a" }}>Reference {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
