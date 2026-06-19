"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Menu, X } from "lucide-react";

const navigation = [
  { href: "/#score", label: "Score" },
  { href: "/#leaderboard", label: "Leaderboard" },
  { href: "/#procedure", label: "Procedure" },
  { href: "/#contact", label: "Get help" },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link className="brand" href="/">
          <span aria-hidden="true" className="brand-mark" />
          AgentReady
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
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
        <button
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? (
            <X aria-hidden="true" size={19} strokeWidth={1.8} />
          ) : (
            <Menu aria-hidden="true" size={19} strokeWidth={1.8} />
          )}
        </button>
        {menuOpen ? (
          <nav
            aria-label="Mobile navigation"
            className="mobile-navigation"
            id="mobile-navigation"
          >
            {navigation.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
