"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminDiscoverPlaceReferences } from "@/app/(admin)/admin/place-references/actions";
import { PLACES_DISCOVERY_MAX_RESULTS } from "@/lib/constants/external";

export function PlaceDiscoveryPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [categoryHint, setCategoryHint] = useState("");
  const [queryText, setQueryText] = useState("");
  const [maxResults, setMaxResults] = useState(PLACES_DISCOVERY_MAX_RESULTS);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await adminDiscoverPlaceReferences({
        city,
        district,
        categoryHint,
        queryText,
        maxResults,
      });
      setResult({ ok: res.success, text: res.message ?? (res.success ? "Tamamlandı." : "Hata.") });
      if (res.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          Google&apos;dan Keşfet
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Şehir/kategori için Google Places araması çalıştırır. Yalnızca yer kimliği (place_id)
            kuyruğa <strong>DISCOVERED</strong> olarak eklenir; Google&apos;dan isim, adres,
            telefon, puan veya yorum kaydedilmez.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="disc-city">Şehir *</Label>
              <Input
                id="disc-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="İstanbul"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-district">İlçe</Label>
              <Input
                id="disc-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Kadıköy"
                maxLength={100}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-category">Kategori İpucu *</Label>
              <Input
                id="disc-category"
                value={categoryHint}
                onChange={(e) => setCategoryHint(e.target.value)}
                placeholder="kuaför"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-query">Ek Arama Metni</Label>
              <Input
                id="disc-query"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="opsiyonel"
                maxLength={200}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-max">Maks. Sonuç</Label>
              <Input
                id="disc-max"
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                min={1}
                max={PLACES_DISCOVERY_MAX_RESULTS}
                className="w-24"
              />
            </div>
          </div>

          {result && (
            <p className={`text-sm ${result.ok ? "text-green-600" : "text-red-600"}`}>
              {result.text}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !city.trim() || !categoryHint.trim()}>
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Keşfet
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
