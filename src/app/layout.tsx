import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Messenger",
  description: "Phone-verified messaging with audited admin access."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
