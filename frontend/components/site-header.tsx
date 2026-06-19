import Link from "next/link";
import { Bot } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link className="brand" href="/">
          <span aria-hidden="true" className="brand-mark" />
          AgentReady
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          <Link href="/#score">Score</Link>
          <Link href="/#leaderboard">Leaderboard</Link>
          <Link href="/#procedure">Procedure</Link>
          <Link href="/#contact">Get help</Link>
        </nav>
        <a
          className="button agent-view-button"
          href="/llms.txt"
          rel="noreferrer"
          target="_blank"
        >
          <Bot aria-hidden="true" size={15} strokeWidth={1.8} />
          View as Agent
        </a>
      </div>
    </header>
  );
}
