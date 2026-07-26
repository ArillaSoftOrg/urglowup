"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Link2,
  Loader2,
  MapPin,
  Search,
  Unlink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  findGooglePlaceCandidates,
  matchGooglePlaceToBusiness,
  removeGooglePlaceMatch,
  type AdminGooglePlaceCandidate,
} from "@/app/(admin)/admin/businesses/google-place-actions";

type BusinessForGoogleMatch = {
  id: string;
  name: string;
  googlePlaceId: string | null;
};

export function GooglePlaceMatchPanel({
  business,
}: {
  business: BusinessForGoogleMatch;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<AdminGooglePlaceCandidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);

  function searchCandidates() {
    setMessage(null);
    setIsError(false);
    startTransition(async () => {
      const result = await findGooglePlaceCandidates(business.id);
      setCandidates(result.candidates);
      setMessage(result.message ?? null);
      setIsError(!result.success);
    });
  }

  function matchCandidate(candidate: AdminGooglePlaceCandidate) {
    setActivePlaceId(candidate.placeId);
    setMessage(null);
    setIsError(false);
    startTransition(async () => {
      const result = await matchGooglePlaceToBusiness({
        businessId: business.id,
        placeId: candidate.placeId,
      });
      setMessage(result.message);
      setIsError(!result.success);
      setActivePlaceId(null);
      if (result.success) {
        setCandidates([]);
        router.refresh();
      }
    });
  }

  function removeMatch() {
    setMessage(null);
    setIsError(false);
    startTransition(async () => {
      const result = await removeGooglePlaceMatch(business.id);
      setMessage(result.message);
      setIsError(!result.success);
      if (result.success) router.refresh();
    });
  }

  const currentMapsUrl = business.googlePlaceId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        business.name,
      )}&query_place_id=${encodeURIComponent(business.googlePlaceId)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Google işletme eşleşmesi</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Doğru Google işletmesini onaylayarak profil yorumlarını etkinleştirin.
            </p>
          </div>
          <span
            translate="no"
            className="whitespace-nowrap text-sm font-normal tracking-normal text-muted-foreground"
          >
            Google Maps
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {business.googlePlaceId ? (
          <div className="flex flex-col gap-3 rounded-lg bg-surface-cream p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-success-foreground" />
                <p className="font-semibold">Eşleştirildi</p>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {business.googlePlaceId}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentMapsUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={currentMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Google Maps
                  <ExternalLink className="size-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={removeMatch}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Unlink className="size-3.5" />
                )}
                Eşleşmeyi kaldır
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-cream text-muted-foreground">
                <Link2 className="size-4" />
              </span>
              <div>
                <p className="font-semibold">Henüz eşleştirilmedi</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  İsim ve adres bilgileriyle Google&apos;da aday arayın.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={searchCandidates}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Google&apos;da ara
            </Button>
          </div>
        )}

        {message && (
          <p
            role={isError ? "alert" : "status"}
            className={
              isError
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {message}
          </p>
        )}

        {candidates.length > 0 && (
          <div className="divide-y divide-border/70 border-y border-border/70">
            {candidates.map((candidate) => {
              const isLinked = Boolean(candidate.linkedBusinessName);
              const isActive = activePlaceId === candidate.placeId;

              return (
                <div
                  key={candidate.placeId}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{candidate.name}</p>
                      {candidate.rating !== null && (
                        <span className="text-sm text-muted-foreground">
                          {candidate.rating.toLocaleString("tr-TR", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          ({candidate.userRatingCount})
                        </span>
                      )}
                      {isLinked && (
                        <Badge variant="neutral">
                          {candidate.linkedBusinessName}
                        </Badge>
                      )}
                    </div>
                    {candidate.formattedAddress && (
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        {candidate.formattedAddress}
                      </p>
                    )}
                    {candidate.googleMapsUri && (
                      <a
                        href={candidate.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        translate="no"
                        className="mt-2 inline-flex min-h-7 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Google Maps
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending || isLinked}
                    onClick={() => matchCandidate(candidate)}
                  >
                    {isActive ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    Bu işletmeyle eşleştir
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
