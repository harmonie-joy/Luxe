import type { ReactNode } from "react";
import { Inter, Libre_Caslon_Text } from "next/font/google";
import { PageShell } from "@/components/layout/page-shell";

const luxeSans = Inter({
  subsets: ["latin"],
  variable: "--font-luxe-sans",
});

const luxeSerif = Libre_Caslon_Text({
  subsets: ["latin"],
  variable: "--font-luxe-serif",
  weight: ["400", "700"],
});

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className={`${luxeSans.variable} ${luxeSerif.variable} luxe-app-font`}>
      <PageShell>{children}</PageShell>
    </div>
  );
}
