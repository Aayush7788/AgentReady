import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div className="shell footer-inner">
        <div>
          <Link className="brand" href="/">
            <span aria-hidden="true" className="brand-mark" />
            AgentReady
          </Link>
          <p className="footer-credit">Developed by Aayush Kotadia.</p>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <a href="https://aayushkotadia.vercel.app/" rel="noreferrer" target="_blank">
            Website
          </a>
          <a
            href="https://www.linkedin.com/in/aayush-kotadia/"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
          <span aria-label="X profile link will be added later">X (coming soon)</span>
          <a href="mailto:aayushkotadia76@gmail.com">Email</a>
        </div>
      </div>
    </footer>
  );
}
