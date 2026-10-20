import { CreatorNavigationGuard } from "@/features/creator/components/use-unsaved-changes";
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
  title: "THE LUXE | Creator Workspace",
  description:
    "THE LUXE is an Internal Alpha workspace for Creators and CEOs, with a bounded flow to create and resume content.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${inter.variable} ${libreCaslon.variable}`} lang="en">
      <body><CreatorNavigationGuard />{children}</body>
    </html>
  );
}
