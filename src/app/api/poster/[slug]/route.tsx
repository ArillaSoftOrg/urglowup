import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/get-app-url";

export const dynamic = "force-dynamic";

// Module-level font cache — survives across requests in the same worker
let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

async function loadFonts() {
  if (!fontRegular || !fontBold) {
    const [reg, bold] = await Promise.all([
      fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.1/files/inter-latin-400-normal.woff").then(
        (r) => r.arrayBuffer()
      ),
      fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.1/files/inter-latin-700-normal.woff").then(
        (r) => r.arrayBuffer()
      ),
    ]);
    fontRegular = reg;
    fontBold = bold;
  }
  return { fontRegular: fontRegular!, fontBold: fontBold! };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const QR = require("qr.js") as (text: string) => { modules: boolean[][] };

function buildQrSvgDataUrl(text: string, size: number): string {
  const { modules } = QR(text);
  const cellSize = size / modules.length;

  const rects = modules
    .flatMap((row: boolean[], r: number) =>
      row.map((cell, c) =>
        cell
          ? `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#111111"/>`
          : ""
      )
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const business = await db.business.findUnique({
    where: { slug },
    select: { name: true, slug: true, status: true, logoUrl: true },
  });

  if (!business || business.status === "SUSPENDED" || business.status === "REJECTED") {
    return new Response("Not found", { status: 404 });
  }

  const publicUrl = getAppUrl(`/b/${business.slug}`);
  const qrDataUrl = buildQrSvgDataUrl(publicUrl, 440);

  const { fontRegular: reg, fontBold: bold } = await loadFonts();

  // Truncate long business names
  const name = business.name.length > 30 ? business.name.slice(0, 28) + "…" : business.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          background: "#FEFCF8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "64px 80px",
          fontFamily: "Inter",
        }}
      >
        {/* Top brand bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 700, color: "#C2185B", letterSpacing: "-0.5px" }}>
            UrGlowUp
          </span>
          <span style={{ fontSize: 20, color: "#999", fontWeight: 400 }}>
            urglowup.com
          </span>
        </div>

        {/* Center section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Business name */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#111111",
              textAlign: "center",
              letterSpacing: "-1px",
              lineHeight: 1.1,
              marginBottom: 40,
              maxWidth: 800,
            }}
          >
            {name}
          </div>

          {/* QR code card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 4px 40px rgba(194,24,91,0.10)",
              border: "2px solid #F8BBD9",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={440} height={440} alt="QR" />
          </div>

          {/* Scan text */}
          <div
            style={{
              marginTop: 32,
              fontSize: 26,
              color: "#666",
              fontWeight: 400,
              textAlign: "center",
            }}
          >
            Randevu almak için QR kodu tara
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FDE8F0",
            borderRadius: 50,
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 32,
            paddingRight: 32,
          }}
        >
          <span style={{ fontSize: 22, color: "#C2185B", fontWeight: 700 }}>
            {publicUrl.replace("https://", "")}
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [
        { name: "Inter", data: reg, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
