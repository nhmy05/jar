import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Sans, DM_Serif_Display, Mali } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const serif = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
/* handwriting for dish names; has Vietnamese accents */
const handwriting = Mali({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-handwriting", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3457"),
  title: "The Dinner Jar",
  description: "A glass jar of dishes you’ve cooked and loved. Write one on a note, drop it in, and pull one out when you can’t decide what to make.",
  applicationName: "The Dinner Jar",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  openGraph: { title: "The Dinner Jar", description: "Can’t decide? Ask the jar.", siteName: "The Dinner Jar", type: "website" },
  twitter: { card: "summary_large_image", title: "The Dinner Jar", description: "Can’t decide? Ask the jar." },
  appleWebApp: { capable: true, title: "Dinner Jar", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#FDFAE9" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${handwriting.variable}`}>
      <body>{children}</body>
    </html>
  );
}
