import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-serif), serif", fontSize: 40, fontWeight: 400, margin: 0 }}>This note isn’t in the jar</h1>
        <p style={{ margin: "12px 0 24px" }}>The page you’re looking for doesn’t exist.</p>
        <Link className="button button-primary" href="/">Back to the jar</Link>
      </div>
    </main>
  );
}
