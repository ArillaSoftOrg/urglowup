"use client";

import { Badge } from "@/components/ui/badge";

interface ViolationSummaryChipProps {
  total: number;
  reviews?: number;
  media?: number;
  posts?: number;
  size?: "sm" | "md";
}

export function ViolationSummaryChip({
  total,
  reviews = 0,
  media = 0,
  posts = 0,
  size = "sm",
}: ViolationSummaryChipProps) {
  if (total === 0) {
    return null;
  }

  const sizeClass = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
  const violationColor =
    total >= 5 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";

  const parts = [];
  if (reviews > 0) parts.push(`${reviews}R`);
  if (media > 0) parts.push(`${media}M`);
  if (posts > 0) parts.push(`${posts}P`);

  const detail = parts.length > 0 ? ` (${parts.join(", ")})` : "";

  return (
    <Badge className={`inline-flex gap-1 rounded-full font-medium ${violationColor} ${sizeClass}`}>
      <span>⚠</span>
      <span>
        {total} violation{total !== 1 ? "s" : ""}
        {detail}
      </span>
    </Badge>
  );
}
