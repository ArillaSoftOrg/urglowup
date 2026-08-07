"use client";

import { useActionState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Check, AlertCircle } from "lucide-react";
import { updateBusinessSlug, type SlugActionState } from "@/app/(business)/business/public-link/actions";

interface SlugEditCardProps {
  currentSlug: string;
  appUrl: string;
}

export function SlugEditCard({ currentSlug, appUrl }: SlugEditCardProps) {
  const initial: SlugActionState = { success: false, error: "" };
  const [state, formAction, isPending] = useActionState(updateBusinessSlug, initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success && inputRef.current) {
      inputRef.current.value = state.newSlug;
    }
  }, [state]);

  const slug = state.success ? state.newSlug : currentSlug;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5" />
          URL&apos;nizi Özelleştirin
        </CardTitle>
        <CardDescription>
          Profilinizin web adresini kişiselleştirin. Sadece küçük harf, rakam ve tire kullanabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="shrink-0 text-muted-foreground">{appUrl}/b/</span>
          <span className="font-semibold text-foreground">{slug}</span>
        </div>

        <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center overflow-hidden rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring">
            <span className="flex shrink-0 items-center border-r bg-muted px-3 py-2 text-sm text-muted-foreground select-none">
              /b/
            </span>
            <input
              ref={inputRef}
              name="slug"
              defaultValue={currentSlug}
              placeholder="isletme-adiniz"
              maxLength={60}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" disabled={isPending} className="shrink-0">
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>

        {state.success && (
          <p className="flex items-center gap-1.5 text-xs text-success-foreground">
            <Check className="size-3.5" />
            URL güncellendi.
          </p>
        )}
        {!state.success && state.error && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5" />
            {state.error}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          URL değişince eski adres artık çalışmaz. Paylaştığınız linkleri güncellemeyi unutmayın.
        </p>
      </CardContent>
    </Card>
  );
}
