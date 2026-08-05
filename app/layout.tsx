import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sided — Scegli da che parte stai",
  description:
    "Il social delle scelte. Scopri cosa pensano davvero le persone e costruisci la tua identità, una scelta alla volta.",
  icons: {
    icon: "/sided-icon.png",
    shortcut: "/sided-icon.png",
    apple: "/sided-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
