"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import type { SearchEntry } from "@/lib/help-content";

interface HelpSearchProps {
  index: SearchEntry[];
  placeholder?: string;
}

function normalize(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ç]/g, "c");
}

function matches(entry: SearchEntry, query: string): boolean {
  const q = normalize(query);
  return (
    normalize(entry.articleTitle).includes(q) ||
    normalize(entry.categoryTitle).includes(q) ||
    normalize(entry.intro).includes(q) ||
    entry.keywords.some((k) => normalize(k).includes(q))
  );
}

export function HelpSearch({
  index,
  placeholder = "Yardım konusu ara…",
}: HelpSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const results =
    trimmed.length >= 2
      ? index.filter((e) => matches(e, trimmed)).slice(0, 6)
      : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect() {
    setQuery("");
    setOpen(false);
  }

  const showDropdown = open && trimmed.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-4 size-4 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls="help-search-listbox"
          aria-label="Yardım konusu ara"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-border/70 bg-background pl-11 pr-10 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-3 focus:ring-ring/20"
        />
        {query && (
          <button
            type="button"
            aria-label="Temizle"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id="help-search-listbox"
          role="listbox"
          aria-label="Arama sonuçları"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border/70 bg-background shadow-md"
        >
          {results.length > 0 ? (
            <ul>
              {results.map((entry) => (
                <li key={`${entry.categorySlug}/${entry.articleSlug}`}>
                  <Link
                    href={`/help/${entry.categorySlug}/${entry.articleSlug}`}
                    role="option"
                    aria-selected={false}
                    onClick={handleSelect}
                    className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {entry.articleTitle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.categoryTitle}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-2 px-4 py-4">
              <p className="text-sm text-muted-foreground">
                &ldquo;{trimmed}&rdquo; için sonuç bulunamadı.
              </p>
              <a
                href="mailto:destek@urglowup.com"
                className="text-sm font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                Destek ekibine yaz →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
