import { ImageResponse } from "next/og";

export const alt = "The Dinner Jar: Can’t decide? Ask the jar.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FDFAE9", gap: 70 }}>
        <svg width="340" height="340" viewBox="0 0 64 64">
          <g transform="translate(8 6) scale(.075)">
            <path d="M130 90 L136 130 C80 160 40 240 40 370 C40 500 140 600 230 610 L410 610 C500 600 600 500 600 370 C600 240 560 160 504 130 L510 90 Z" fill="#fff" stroke="#3d4a33" strokeWidth="38" strokeLinejoin="round" />
            <path d="M320 470 S200 400 200 320 c0-40 30-70 66-70 26 0 44 14 54 32 10-18 28-32 54-32 36 0 66 30 66 70 0 80-120 150-120 150Z" fill="#e8dbb0" stroke="#c9a94f" strokeWidth="30" strokeLinejoin="round" />
          </g>
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, color: "#3d4a33", fontWeight: 700 }}>Can’t decide?</div>
          <div style={{ fontSize: 76, color: "#46603A", fontStyle: "italic", fontWeight: 700 }}>Ask the jar</div>
          <div style={{ fontSize: 30, color: "#6b6a55", marginTop: 24 }}>the dinner jar</div>
        </div>
      </div>
    ),
    size,
  );
}
