"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "./copy-button";
import { AtSign, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SharingTextsProps {
  publicUrl: string;
}

export function InstagramBioText({ publicUrl }: SharingTextsProps) {
  const bioText = `Randevu ve hizmetlerim için: ${publicUrl}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AtSign className="size-5" />
          Instagram Biyografisi
        </CardTitle>
        <CardDescription>
          Bu metni kopyalayıp Instagram biyografinize yapıştırın.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="text-sm leading-relaxed">{bioText}</p>
        </div>
        <CopyButton value={bioText} label="Metni Kopyala" />
      </CardContent>
    </Card>
  );
}

export function WhatsAppShareText({ publicUrl }: SharingTextsProps) {
  const shareText = `Merhaba, randevu almak ve hizmetlerimi incelemek için UrGlowUp profilimi ziyaret edebilirsiniz: ${publicUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-5" />
          WhatsApp
        </CardTitle>
        <CardDescription>
          Bu mesajı kişilerinize gönderin veya linkinizi doğrudan paylaşın.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="text-sm leading-relaxed">{shareText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={shareText} label="Mesajı Kopyala" />
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <MessageCircle className="size-4" />
            WhatsApp&apos;ta Aç
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
