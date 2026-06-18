"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, RotateCcw } from "lucide-react";
import type { ScoreJobState } from "@/lib/types";
import { ReportView } from "@/frontend/components/report-view";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 5 * 60_000;

export function ScanResultLoader({ jobId }: { jobId: string }) {
  const [state, setState] = useState<ScoreJobState>({ status: "running" });
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (cancelled) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setRequestError(
          "The scan is taking longer than five minutes. The documentation site may be blocking automated requests.",
        );
        return;
      }

      try {
        const response = await fetch(`/api/score/${jobId}`, { cache: "no-store" });
        const data = (await response.json().catch(() => ({}))) as ScoreJobState & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "The scan status could not be loaded.");
        }
        if (cancelled) return;

        setState(data);
        if (data.status === "running") {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (caught) {
        if (cancelled) return;
        setRequestError(
          caught instanceof Error ? caught.message : "The scan status could not be loaded.",
        );
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  if (state.status === "complete" && state.company) {
    return <ReportView privateResult report={state.company} />;
  }

  const errorMessage =
    state.status === "error" ? state.message : requestError || undefined;

  return (
    <main className="scan-status-page">
      <div className="scan-status-panel">
        {errorMessage ? (
          <>
            <span className="status-fail mono">SCAN FAILED</span>
            <h1>The report could not be completed.</h1>
            <p>{errorMessage}</p>
            <Link className="button button-primary" href="/#score">
              <RotateCcw aria-hidden="true" size={16} />
              Try another URL
            </Link>
          </>
        ) : (
          <>
            <LoaderCircle aria-hidden="true" className="scan-loader spin" size={34} />
            <p className="eyebrow">Readiness scan in progress</p>
            <h1>Inspecting the documentation.</h1>
            <p>
              AgentReady is running 23 checks across seven categories. Large
              documentation sites can take several minutes.
            </p>
            <span className="mono scan-job-id">Job {jobId}</span>
          </>
        )}
      </div>
    </main>
  );
}
