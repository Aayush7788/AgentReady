import Link from "next/link";

export default function NotFound() {
  return (
    <main className="scan-status-page">
      <div className="scan-status-panel">
        <p className="eyebrow">Not found</p>
        <h1>This report does not exist.</h1>
        <p>The company may not be public, or the private scan may have expired.</p>
        <Link className="button button-primary" href="/">
          Return to AgentReady
        </Link>
      </div>
    </main>
  );
}
