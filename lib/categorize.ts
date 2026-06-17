export const CATEGORIES = [
  "AI/ML",
  "Banking & Fintech",
  "Payments",
  "Commerce",
  "Cloud & Infrastructure",
  "Developer Tools",
  "Communication",
  "Business Software",
  "Travel & Mobility",
  "Healthcare",
  "Government & Utilities",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_PATTERNS: Array<{ category: Category; pattern: RegExp }> = [
  {
    category: "Payments",
    pattern: /\b(razorpay|cashfree|payu|juspay|phonepe|easebuzz|ccavenue|payment|payout|gateway|upi|checkout)\b/i,
  },
  {
    category: "Banking & Fintech",
    pattern: /\b(setu|signzy|finbox|decentro|karza|bank|kyc|lending|credit|fintech|account aggregator)\b/i,
  },
  {
    category: "AI/ML",
    pattern: /\b(sarvam|krutrim|composio|portkey|nanonets|hasura|ai|llm|model|agent|embedding|inference|ocr)\b/i,
  },
  {
    category: "Communication",
    pattern: /\b(exotel|msg91|kaleyra|gupshup|sms|voice|whatsapp|email|notification|communication)\b/i,
  },
  {
    category: "Business Software",
    pattern: /\b(zoho|freshworks|moengage|clevertap|webengage|crm|support|marketing|automation|analytics)\b/i,
  },
  {
    category: "Developer Tools",
    pattern: /\b(postman|frappe|devrev|docs|api|sdk|developer|framework|database|graphql|workflow)\b/i,
  },
  {
    category: "Travel & Mobility",
    pattern: /\b(mappls|ola|rapido|redbus|travel|maps|mobility|location|geocode)\b/i,
  },
  {
    category: "Healthcare",
    pattern: /\b(eka|health|medical|patient|clinic|care)\b/i,
  },
  {
    category: "Government & Utilities",
    pattern: /\b(ondc|aadhaar|gst|government|utility|public network)\b/i,
  },
  {
    category: "Commerce",
    pattern: /\b(shop|commerce|catalog|storefront|order|inventory|marketplace)\b/i,
  },
  {
    category: "Cloud & Infrastructure",
    pattern: /\b(cloud|infra|hosting|database|storage|serverless|observability|monitoring)\b/i,
  },
];

export function inferCategory(docsUrl: string, name?: string): Category {
  const haystack = `${docsUrl} ${name ?? ""}`.toLowerCase();
  return CATEGORY_PATTERNS.find((entry) => entry.pattern.test(haystack))?.category ?? "Other";
}

