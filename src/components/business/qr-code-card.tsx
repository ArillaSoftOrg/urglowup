"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, QrCode } from "lucide-react";

interface QRCodeCardProps {
  publicUrl: string;
  businessSlug: string;
}

export function QRCodeCard({ publicUrl, businessSlug }: QRCodeCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  async function handleDownload() {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;

    setDownloading(true);
    setDownloadError(false);

    try {
      const svgString = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const size = 400;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setDownloadError(true);
          setDownloading(false);
          URL.revokeObjectURL(svgUrl);
          return;
        }

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `urglowup-qr-${businessSlug}.png`;
        a.click();

        URL.revokeObjectURL(svgUrl);
        setDownloading(false);
      };
      img.onerror = () => {
        setDownloadError(true);
        setDownloading(false);
        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    } catch (err) {
      console.error("[qr-download]", err);
      setDownloadError(true);
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="size-5" />
          QR Kod
        </CardTitle>
        <CardDescription>
          Bu QR kodu yazdırın veya paylaşın. Taranınca randevu sayfanız açılır.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div ref={containerRef} className="rounded-lg border bg-white p-4">
          <QRCode
            value={publicUrl}
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading || downloadError}
        >
          <Download className="size-4" />
          {downloading ? "Hazırlanıyor..." : downloadError ? "İndirme mevcut değil" : "PNG İndir"}
        </Button>

        {downloadError && (
          <p className="text-xs text-muted-foreground">
            Bu tarayıcıda PNG indirme mevcut değil. QR kodu ekran görüntüsü alabilirsiniz.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
