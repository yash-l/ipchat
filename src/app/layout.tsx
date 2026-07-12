import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "IPChat — Private Messenger", template: "%s · IPChat" },
  description: "Private, expressive messaging with phone verification, disappearing moments and audited safety controls.",
  applicationName: "IPChat"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
