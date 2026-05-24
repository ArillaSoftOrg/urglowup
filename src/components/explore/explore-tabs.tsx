"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "isletmeler", label: "Keşfet" },
  { id: "ilham", label: "İlham" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ExploreTabsProps {
  activeTab: string;
}

export function ExploreTabs({ activeTab }: ExploreTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    // Reset filters when switching tabs
    params.delete("q");
    params.delete("categorySlug");
    params.delete("city");
    router.push(`/explore?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex gap-1 rounded-full border border-border/60 bg-muted/40 p-1 w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => switchTab(tab.id)}
          className={cn(
            "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
