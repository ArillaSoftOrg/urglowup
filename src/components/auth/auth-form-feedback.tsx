type AuthFeedbackTone = "success" | "error" | "info";

const toneClasses: Record<AuthFeedbackTone, string> = {
  success:
    "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
  error: "bg-destructive/10 text-destructive",
  info: "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
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
    <div className={`rounded-md px-4 py-3 text-sm ${toneClasses[tone]}`}>
      {message}
    </div>
  );
}
