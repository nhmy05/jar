import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Caveat, DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const serif = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const handwriting = Caveat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-handwriting", display: "swap" });

export const metadata: Metadata = {
  title: "What’s for Dinner?",
  description: "A glass jar of dishes you’ve cooked and loved. Write one on a slip, drop it in, and pull one out when you can’t decide what to make.",
  applicationName: "What’s for Dinner?",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#FFF9E3" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${handwriting.variable}`}>
      <body>{children}</body>
    </html>
  );
}
