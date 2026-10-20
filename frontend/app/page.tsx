import { HomeShell } from "@/features/home/components/home-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "THE LUXE — Context for Creators and CEOs",
  description:
    "THE LUXE is being built for Creators and CEOs to carry context into their work and resume a post. The current Internal Alpha is limited to idea and drafting.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return <HomeShell />;
}
