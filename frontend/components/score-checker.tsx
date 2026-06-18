"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";

interface ScoreStartResponse {
  existing?: boolean;
  jobId?: string;
  slug?: string;
  message?: string;
  suggestion?: string;
}
export function ScoreChecker() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json().catch(() => ({}))) as ScoreStartResponse;

      if (!response.ok) {
        const suggestion = data.suggestion ? ` ${data.suggestion}` : "";
        throw new Error(`${data.message ?? "The scan could not be started."}${suggestion}`);
      }

      if (data.existing && data.slug) {
        router.push(`/companies/${data.slug}`);
        return;
      }

      if (!data.jobId) {
        throw new Error("The scan started without a job identifier. Please try again.");
      }

      router.push(`/scans/${data.jobId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The scan could not be started.");
      setSubmitting(false);
    }
  }

  return (
    <div id="score">
      <form className="scanner" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="documentation-url">
          Public documentation URL
        </label>
        <input
          autoComplete="url"
          id="documentation-url"
          inputMode="url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://docs.yourcompany.com"
          required
          type="url"
          value={url}
        />
        <button className="button button-primary" disabled={submitting} type="submit">
          {submitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="spin" size={16} />
              Starting scan
            </>
          ) : (
            <>
              Run readiness scan
              <ArrowRight aria-hidden="true" size={16} />
            </>
          )}
        </button>
      </form>
      {error ? (
        <p className="form-message form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
