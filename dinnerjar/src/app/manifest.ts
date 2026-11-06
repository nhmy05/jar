import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Dinner Jar",
    short_name: "Dinner Jar",
    description: "Can’t decide? Ask the jar.",
    start_url: "/",
    display: "standalone",
    background_color: "#FDFAE9",
    theme_color: "#FDFAE9",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
