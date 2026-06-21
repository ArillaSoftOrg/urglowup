"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "./copy-button";
import { AtSign, ExternalLink, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { SocialIcon } from "@/components/shared/social-icons";

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
          <SocialIcon name="whatsapp" className="size-5" />
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
            <SocialIcon name="whatsapp" className="size-4" />
            WhatsApp&apos;ta Aç
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export function FacebookShareText({ publicUrl }: SharingTextsProps) {
  const shareText = `Randevu almak ve hizmetlerimi incelemek için UrGlowUp profilimi ziyaret edebilirsiniz: ${publicUrl}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SocialIcon name="facebook" className="size-5" />
          Facebook
        </CardTitle>
        <CardDescription>
          Linkinizi Facebook&apos;ta paylaşın veya gönderi metnini kopyalayın.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="text-sm leading-relaxed">{shareText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={shareText} label="Metni Kopyala" />
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink className="size-4" />
            Facebook&apos;ta Paylaş
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export function TikTokBioText({ publicUrl }: SharingTextsProps) {
  const bioText = `Randevu ve hizmetlerim için: ${publicUrl}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SocialIcon name="tiktok" className="size-5" />
          TikTok Biyografisi
        </CardTitle>
        <CardDescription>
          Bu metni kopyalayıp TikTok biyografinize yapıştırın.
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

export function EmailSignatureSnippet({ businessName, publicUrl }: { businessName: string; publicUrl: string }) {
  const html = `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#18181b;">
  <tr>
    <td style="padding-right:14px;border-right:3px solid #e879a0;">
      <strong style="font-size:15px;">${businessName}</strong><br>
      <a href="${publicUrl}" style="color:#e879a0;text-decoration:none;font-size:13px;">Randevu Al →</a>
    </td>
    <td style="padding-left:14px;font-size:12px;color:#71717a;">
      UrGlowUp üzerinden<br>online rezervasyon
    </td>
  </tr>
</table>`.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" />
          E-posta İmzası
        </CardTitle>
        <CardDescription>
          Bu HTML kodunu Outlook veya Gmail imzanıza yapıştırın.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-md border bg-muted/50 p-3">
          <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-muted-foreground">
            {html}
          </pre>
        </div>
        <CopyButton value={html} label="HTML Kopyala" />
      </CardContent>
    </Card>
  );
}
