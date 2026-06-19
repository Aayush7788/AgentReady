import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
const baseConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["afdocs"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/afdocs/package.json"],
  },
};

export default function nextConfig(phase) {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  return {
    ...baseConfig,
    distDir: isDevelopment ? ".next-dev" : ".next",
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Content-Security-Policy",
              value: contentSecurityPolicy,
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=()",
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
          ],
        },
      ];
    },
  };
}
