"use client";

import { useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";

type ContactState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<ContactState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          docsUrl: formData.get("docsUrl"),
          website: formData.get("website"),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Your request could not be submitted.");

      form.reset();
      setState("success");
      setMessage(data.message ?? "Your request has been received.");
    } catch (caught) {
      setState("error");
      setMessage(caught instanceof Error ? caught.message : "Your request could not be submitted.");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="contact-email">Work email</label>
        <input
          autoComplete="email"
          id="contact-email"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
      </div>
      <div className="field">
        <label htmlFor="contact-docs">Documentation URL</label>
        <input
          autoComplete="url"
          id="contact-docs"
          inputMode="url"
          name="docsUrl"
          placeholder="https://docs.company.com"
          required
          type="url"
        />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          autoComplete="off"
          id="contact-website"
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>
      <button className="button" disabled={state === "submitting"} type="submit">
        {state === "submitting" ? (
          <>
            <LoaderCircle aria-hidden="true" className="spin" size={16} />
            Sending request
          </>
        ) : state === "success" ? (
          <>
            <Check aria-hidden="true" size={16} />
            Request received
          </>
        ) : (
          <>
            Request an audit call
            <ArrowRight aria-hidden="true" size={16} />
          </>
        )}
      </button>
      {message ? (
        <p
          className={`form-message ${state === "error" ? "form-error" : "form-success"}`}
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
