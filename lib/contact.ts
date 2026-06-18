import { z } from "zod";
import { normalizeDocsUrl } from "./slug";

const contactRequestSchema = z.object({
  email: z.string().trim().email().max(254),
  docsUrl: z.string().trim().max(2_048),
  website: z.string().trim().max(200).optional(),
});

export interface ContactRequestInput {
  email: string;
  docsUrl: string;
  source: string;
}
export type ContactRequestParseResult =
  | { success: true; data: ContactRequestInput; isBot: boolean }
  | { success: false; message: string };

export function parseContactRequest(input: unknown): ContactRequestParseResult {
  const parsed = contactRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Provide a valid work email and public documentation URL.",
    };
  }

  const docsUrl = normalizeDocsUrl(parsed.data.docsUrl);
  if (!docsUrl) {
    return {
      success: false,
      message: "Provide a valid public documentation URL.",
    };
  }

  return {
    success: true,
    isBot: Boolean(parsed.data.website),
    data: {
      email: parsed.data.email.toLowerCase(),
      docsUrl,
      source: "website_audit_request",
    },
  };
}
