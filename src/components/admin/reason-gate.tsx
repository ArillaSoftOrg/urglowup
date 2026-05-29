"use client";

import { useState } from "react";

interface ReasonGateProps {
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
  actionLabel?: string;
  maxLength?: number;
  rows?: number;
  isPending?: boolean;
}

export function ReasonGate({
  onConfirm,
  onCancel,
  actionLabel = "Confirm",
  maxLength = 500,
  rows = 3,
  isPending = false,
}: ReasonGateProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for this action (required)"
        maxLength={maxLength}
        disabled={isPending || isSubmitting}
        className="w-full rounded border border-slate-300 p-2 text-sm placeholder-slate-500 disabled:bg-slate-100"
        rows={rows}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending || isSubmitting}
          className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-400"
        >
          {isSubmitting ? "Processing..." : actionLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending || isSubmitting}
          className="flex-1 rounded bg-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-400 disabled:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
