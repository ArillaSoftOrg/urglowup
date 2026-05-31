import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const alt = `${SITE_NAME} - güzellik ve kişisel bakım uzmanlarını keşfet`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 18% 18%, #ffe2ea 0, transparent 34%), radial-gradient(circle at 86% 20%, #fff0c8 0, transparent 30%), linear-gradient(135deg, #fffaf5 0%, #ffffff 48%, #f4fbf8 100%)",
          color: "#171717",
          padding: 72,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 22,
                background: "#171717",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
              }}
            >
              U
            </div>
            {SITE_NAME}
          </div>
          <div
            style={{
              border: "1px solid rgba(23,23,23,.12)",
              borderRadius: 999,
              padding: "14px 22px",
              fontSize: 22,
              fontWeight: 700,
              background: "rgba(255,255,255,.72)",
            }}
          >
            Güvenle randevu al
          </div>
        </div>

        <div
          style={{
            maxWidth: 860,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.02,
              letterSpacing: "-0.055em",
              fontWeight: 900,
            }}
          >
            Güzellik uzmanlarını keşfet. Gerçek işleri gör.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 29,
              lineHeight: 1.35,
              color: "#525252",
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 22,
            color: "#525252",
            fontWeight: 700,
          }}
        >
          <span>Doğrulanmış yorumlar</span>
          <span>•</span>
          <span>Portfolyo</span>
          <span>•</span>
          <span>Randevu talebi</span>
        </div>
      </div>
    ),
    size,
  );
}
