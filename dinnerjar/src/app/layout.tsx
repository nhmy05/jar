import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Sans, DM_Serif_Display, Mali } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const serif = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
/* handwriting for dish names; has Vietnamese accents */
const handwriting = Mali({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-handwriting", display: "swap" });

export const metadata: Metadata = {
  title: "The Dinner Jar",
  description: "A glass jar of dishes you’ve cooked and loved. Write one on a note, drop it in, and pull one out when you can’t decide what to make.",
  applicationName: "The Dinner Jar",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#FDFAE9" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${handwriting.variable}`}>
      <body>{children}</body>
    </html>
  );
}
