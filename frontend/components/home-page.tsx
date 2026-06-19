import Link from "next/link";
import type { LeaderboardCompany } from "@/frontend/components/leaderboard-table";
import { ContactForm } from "@/frontend/components/contact-form";
import { LeaderboardTable } from "@/frontend/components/leaderboard-table";
import { HashScrollRestorer } from "@/frontend/components/hash-scroll-restorer";
import { FlickeringGrid } from "@/frontend/components/magicui/flickering-grid";
import { ScoreChecker } from "@/frontend/components/score-checker";
import { SiteFooter } from "@/frontend/components/site-footer";
import { SiteHeader } from "@/frontend/components/site-header";
import { readinessCategories, readinessPrinciples } from "@/frontend/lib/content";

export function HomePage({ companies }: { companies: LeaderboardCompany[] }) {
  return (
    <>
      <HashScrollRestorer />
      <SiteHeader />
      <main id="top">
        <Link className="agent-directive" href="/llms.txt">
          Agent-readable site index: /llms.txt
        </Link>

        <section className="hero">
          <FlickeringGrid
            className="hero-flickering-grid"
            squareSize={4}
            gridGap={6}
            color="#4d8412"
            maxOpacity={0.18}
            flickerChance={0.12}
          />
          <div className="shell hero-inner">
            <div className="hero-main">
              <h1>Are your business documents ready for AI agents?</h1>
              <p className="eyebrow">Take your business ahead of your competitors</p>
              <p className="hero-copy">
                Most websites are built for human eyes, not for AI agents. Test whether an
                agent can discover what your product does, understand the actions available,
                and return useful output.
              </p>
              <ScoreChecker />
              <div className="helper" aria-label="Scoring details">
                <span>23 checks</span>
                <span>7 readiness categories</span>
                <span>Public documentation only</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="leaderboard">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="eyebrow">Documentation index</p>
                <h2>One comparable standard.</h2>
              </div>
              <p className="section-note">Leaderboard.</p>
            </div>
            <LeaderboardTable companies={companies} />
          </div>
        </section>

        <section className="section" id="procedure">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="eyebrow">Open procedure</p>
                <h2>23 checks under 7 categories</h2>
              </div>
              <p className="section-note">The AgentReady engine uses AFDocs.</p>
            </div>
            <div className="method-grid">
              {readinessCategories.map((category) => (
                <article className="method" key={category.id}>
                  <span className="method-index">
                    {category.index} / {category.checks} checks
                  </span>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </article>
              ))}
              <article className="method">
                <span className="method-index">SCORING</span>
                <h3>Transparent output</h3>
                <p>
                  Every warning and failure exposes evidence, impact, and a concrete
                  remediation path.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="eyebrow">Why it matters</p>
                <h2>Your website has a new customer: AI agents</h2>
                <h3 className="section-subheading">
                  Save tokens and context-window space for agents
                </h3>
              </div>
            </div>
            <div className="principles">
              {readinessPrinciples.map((principle) => (
                <article className="principle" key={principle.title}>
                  <h3>{principle.title}</h3>
                  <p>{principle.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="shell">
            <div className="contact">
              <div className="contact-copy">
                <p className="eyebrow">Need a remediation plan?</p>
                <h2>Make your business documentation usable by agents.</h2>
                <p>
                  Share your work email and documentation URL. AgentReady will use the scan
                  results to prepare a focused discussion about the highest-impact fixes.
                </p>
              </div>
              <ContactForm />
            </div>
            <p className="credit">
              Special thanks to <strong>Dachary Carey</strong>, creator and developer of
              AFDocs.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
