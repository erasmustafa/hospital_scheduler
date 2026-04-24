import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Hospital Workforce Manager",
  description: "Shift planning, staffing and realtime operations dashboard.",
  icons: {
    icon: "/icons/medishift-brand.png",
    shortcut: "/icons/medishift-brand.png",
    apple: "/icons/medishift-brand.png",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
