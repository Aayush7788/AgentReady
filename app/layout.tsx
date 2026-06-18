import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/frontend/styles/site.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "AgentReady",
    template: "%s | AgentReady",
  },
  description:
    "Test whether public business documentation is discoverable, understandable, and usable by AI agents.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AgentReady",
    description:
      "Score public documentation across 23 agent-readiness checks and seven categories.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${jetBrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
