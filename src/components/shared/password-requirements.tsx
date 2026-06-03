"use client";

import { PASSWORD_REQUIREMENTS, PASSWORD_ALL_DONE_MESSAGE } from "@/lib/password-policy";

export function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;
  const allMet = PASSWORD_REQUIREMENTS.every((req) => req.test(password));
  if (allMet) {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
        <span aria-hidden="true">✓</span>
        {PASSWORD_ALL_DONE_MESSAGE}
      </p>
    );
  }
  return (
    <ul className="mt-1.5 space-y-0.5">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const ok = req.test(password);
        return (
          <li
            key={req.label}
            className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
          >
            <span aria-hidden="true">{ok ? "✓" : "○"}</span>
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
