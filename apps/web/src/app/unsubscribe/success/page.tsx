export default function UnsubscribeSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success/10">
            <svg
              className="h-6 w-6 text-success-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-lg font-medium text-foreground">
            Successfully Unsubscribed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You have been removed from our marketing communications. You will no longer
            receive promotional emails or messages.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            You will continue to receive transactional emails related to your account and bookings.
          </p>
        </div>
      </div>
    </div>
  );
}
