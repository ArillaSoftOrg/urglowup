"use client";

import { useEffect } from "react";
import { rememberBusinessView } from "@/lib/recent-business-history";

export function RecentBusinessViewTracker({
  businessId,
}: {
  businessId: string;
}) {
  useEffect(() => {
    rememberBusinessView(businessId);
  }, [businessId]);

  return null;
}
