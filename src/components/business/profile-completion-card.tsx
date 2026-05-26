"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Sparkles } from "lucide-react";
import type { ProfileCompletion } from "@/lib/profile-completion";

const VISIBLE_MISSING_COUNT = 4;

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

  return (
    <Card className="bg-surface-cream">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CardTitle className="text-base">Profil Kurulumu</CardTitle>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-pink-foreground transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{score}% tamamlandı</p>

        {!collapsed && (
          <>
            <p className="text-xs text-muted-foreground">{encouragement}</p>

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
                {hiddenCount} adım daha göster ↓
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
