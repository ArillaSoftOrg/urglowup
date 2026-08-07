"use client";

import { useEffect } from "react";

export function NavbarScrollEffect() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-navbar]");
    if (!header) return;
    const toggle = () => { header.dataset.scrolled = String(window.scrollY > 8); };
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
    return () => window.removeEventListener("scroll", toggle);
  }, []);
  return null;
}
