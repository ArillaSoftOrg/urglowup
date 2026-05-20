import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import type { ProfileCompletion } from "@/lib/profile-completion";

interface ProfileCompletionCardProps {
  completion: ProfileCompletion;
}

export function ProfileCompletionCard({ completion }: ProfileCompletionCardProps) {
  const { score, completedCount, totalCount, missing, items } = completion;

  if (score === 100) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-3 py-4">
          <Sparkles className="size-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Profile complete!</p>
            <p className="text-xs text-green-700">
              Your profile is fully set up. Share your booking link to start attracting customers.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const encouragement =
    score === 0
      ? "Good start! Here's what to add next."
      : score < 50
      ? "Keep going — finish setup to attract more customers."
      : "Almost there! A few more items will complete your profile.";

  return (
    <Card className="bg-surface-cream">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Profile Setup</CardTitle>
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <CardDescription>{encouragement}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-pink-foreground transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{score}% complete</p>

        {/* All items */}
        <ul className="space-y-1.5">
          {items.map((item) =>
            item.done ? (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                <span className="text-muted-foreground line-through">{item.label}</span>
              </li>
            ) : (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                <Link
                  href={item.href}
                  className="font-medium text-primary hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
