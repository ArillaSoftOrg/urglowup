"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Sparkles,
  Store,
} from "lucide-react";
import type { ProfileCompletion } from "@/lib/profile-completion";

const VISIBLE_MISSING_COUNT = 1;

interface ProfileCompletionCardProps {
  completion: ProfileCompletion;
}

export function ProfileCompletionCard({ completion }: ProfileCompletionCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { score, completedCount, totalCount, missing } = completion;
  const completedItems = completion.items.filter((i) => i.done);

  if (score === 100) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-3 py-4">
          <Sparkles className="size-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Profil tamamlandı!</p>
            <p className="text-xs text-green-700">
              Profiliniz eksiksiz ve müşterilere tamamen görünür.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const encouragement =
    score === 0
      ? "Aşağıdaki adımları tamamlayarak profilinizi oluşturun."
      : score < 50
        ? "Profili tamamlayarak daha fazla müşteriye ulaşın."
        : "Neredeyse bitti! Birkaç adım daha profilinizi tamamlayacak.";

  const visibleMissing = showAll ? missing : missing.slice(0, VISIBLE_MISSING_COUNT);
  const hiddenCount = missing.length - VISIBLE_MISSING_COUNT;
  const nextMissing = missing[0];

  return (
    <Card className="border-[oklch(0.91_0.02_285)] bg-[oklch(0.995_0.01_285)] shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-5">
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.93_0.055_285)] text-[oklch(0.50_0.18_285)] lg:flex">
            <Store className="size-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CardTitle className="text-base">Profil Kurulumu</CardTitle>
                <span className="shrink-0 text-sm tabular-nums text-[oklch(0.48_0.16_285)]">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
                  {score}%
                </span>
                <button
                  onClick={() => setCollapsed((v) => !v)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={collapsed ? "Genişlet" : "Daralt"}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronUp className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[oklch(0.94_0.018_285)]">
              <div
                className="h-full rounded-full bg-[oklch(0.56_0.20_285)] transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{score}% tamamlandı</p>

            {!collapsed && (
              <>
                <p className="hidden text-xs text-muted-foreground sm:block">{encouragement}</p>

                <ul className="space-y-1.5">
                  {visibleMissing.map((item) => (
                    <li key={item.key} className="flex items-center gap-2 text-sm">
                      <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                      <Link
                        href={item.href}
                        className="font-medium text-primary hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {!showAll && hiddenCount > 0 && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {hiddenCount} adım daha göster
                  </button>
                )}

                {completedItems.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowCompleted((v) => !v)}
                      aria-expanded={showCompleted}
                      className="mt-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showCompleted
                        ? "Tamamlananları gizle"
                        : `Tamamlananları göster (${completedItems.length})`}
                    </button>
                    {showCompleted && (
                      <ul className="space-y-1.5">
                        {completedItems.map((item) => (
                          <li key={item.key} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                            <span className="text-muted-foreground line-through">
                              {item.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {nextMissing && (
                  <div className="flex justify-end pt-1">
                    <Link
                      href={nextMissing.href}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-9 border-[oklch(0.62_0.18_285)] px-4 text-[oklch(0.52_0.18_285)] hover:bg-[oklch(0.96_0.035_285)]"
                      )}
                    >
                      Devam Et
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
