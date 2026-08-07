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
          headline="Bir şeyler ters gitti"
          description="Randevu sayfası yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
          surface="cream"
          action={{
            label: "Tekrar dene",
            onClick: reset,
            variant: "brand",
          }}
        />
      </div>
    </div>
  );
}
