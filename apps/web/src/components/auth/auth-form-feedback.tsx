type AuthFeedbackTone = "success" | "error" | "info";

const toneClasses: Record<AuthFeedbackTone, string> = {
  success: "bg-success/10 text-success-foreground",
  error: "bg-destructive/10 text-destructive",
  info: "bg-warning/10 text-warning-foreground",
};

export function AuthFormFeedback({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: AuthFeedbackTone;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-md px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      {message}
    </div>
  );
}
