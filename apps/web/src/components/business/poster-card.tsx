"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

interface PosterCardProps {
  slug: string;
}

export function PosterCard({ slug }: PosterCardProps) {
  const [downloading, setDownloading] = useState(false);
  const posterUrl = `/api/poster/${slug}`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(posterUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `urglowup-poster-${slug}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-5" />
          Paylaşım Posteri
        </CardTitle>
        <CardDescription>
          İşletme adınız ve QR kodunuzla hazır bir poster — Instagram, WhatsApp veya baskı için.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt="Poster önizleme"
            className="w-full"
            loading="lazy"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="size-4" />
            {downloading ? "İndiriliyor..." : "PNG İndir"}
          </Button>
          <Link
            href={posterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink className="size-4" />
            Tam boyut gör
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
