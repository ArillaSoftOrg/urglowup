"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function BookPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[book] page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <EmptyState
          icon={AlertTriangle}
          headline="Something went wrong"
          description="The booking page failed to load. Please try again."
          surface="cream"
          action={{
            label: "Try again",
            onClick: reset,
            variant: "brand",
          }}
        />
      </div>
    </div>
  );
}
