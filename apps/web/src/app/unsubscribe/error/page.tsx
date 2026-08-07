import Link from "next/link";

export default function UnsubscribeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8.25v4.5m0 4.5v.75m0 0a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-lg font-medium text-foreground">
            Something Went Wrong
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We encountered an error while processing your unsubscribe request. Please try again
            or contact support.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Return Home →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
