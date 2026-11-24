import type { Metadata } from "next";
import { SessionProvider } from "@/components/tripthread/session";
import "./tripthread.css";

export const metadata: Metadata = {
  title: "Tripthread | Shared trip expenses",
  description: "Start a trip, invite your friends, and keep track of who paid for what.",
  icons: { icon: "/tripthread.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body><SessionProvider>{children}</SessionProvider></body></html>;
}
