import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE LUXE | Brand Voice Content Cockpit",
  description:
    "AI-powered brand voice, workflow, and compliance cockpit for planning, drafting, reviewing, and scheduling branded content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
