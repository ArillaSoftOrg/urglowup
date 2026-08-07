"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface BusinessErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export function BusinessErrorBoundary({
  error,
  reset,
  context,
}: BusinessErrorBoundaryProps) {
  useEffect(() => {
    console.error(`[business] ${context ?? "page"} error:`, error);
  }, [error, context]);

  return (
    <div className="mx-auto w-full max-w-2xl py-12">
      <EmptyState
        icon={AlertTriangle}
        headline="Bir şeyler ters gitti"
        description="Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
        surface="cream"
        action={{
          label: "Tekrar dene",
          onClick: reset,
          variant: "brand",
        }}
      />
    </div>
  );
}
