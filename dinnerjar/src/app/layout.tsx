import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./fonts.css";
import "./globals.css";

/* fetched early, so text and notes don't wait for them */
const preloadFonts = ["dm-sans-v17-latin", "dm-serif-display-v17-latin", "dm-serif-display-v17-latin-italic", "shantell-sans-v13-latin"];

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
    <html lang="en">
      <body>
        {preloadFonts.map((name) => <link key={name} rel="preload" href={`/fonts/${name}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />)}
        {children}
      </body>
    </html>
  );
}
