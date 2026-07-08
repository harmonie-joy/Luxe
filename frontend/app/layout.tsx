import type { Metadata } from "next";
import { Inter, Libre_Caslon_Text } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const libreCaslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-libre-caslon",
});

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
    <html className={`${inter.variable} ${libreCaslon.variable}`} lang="en">
      <body>{children}</body>
    </html>
  );
}
