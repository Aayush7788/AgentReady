"use client";

import { useRouter } from "next/navigation";
import type { CompanyScore } from "@/lib/types";
import { docsLabel, gradeClass } from "@/frontend/lib/format";

export type LeaderboardCompany = Omit<CompanyScore, "results" | "categoryScores">;

export function LeaderboardTable({ companies }: { companies: LeaderboardCompany[] }) {
  const router = useRouter();

  function openCompany(slug: string) {
    router.push(`/companies/${slug}`);
  }

  return (
    <div className="leaderboard-shell">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Category</th>
              <th>Grade</th>
              <th>Checks</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => {
              const className = gradeClass(company.grade);
              return (
                <tr
                  className="company-row"
                  key={company.slug}
                  onClick={() => openCompany(company.slug)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openCompany(company.slug);
                    }
                  }}
                  tabIndex={0}
                >
                  <td>
                    <span className="company-link">
                      <span className="company">{company.name}</span>
                      <span className="subtle">{docsLabel(company.docsUrl)}</span>
                    </span>
                  </td>
                  <td>{company.category}</td>
                  <td>
                    <span className={`grade grade-${className}`}>{company.grade}</span>
                  </td>
                  <td className="mono">
                    {company.checks.pass} / {company.checks.total} pass
                  </td>
                  <td className={`score-cell score-${className}`}>{company.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
