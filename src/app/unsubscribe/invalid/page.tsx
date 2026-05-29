import Link from "next/link";

export default function UnsubscribeInvalidPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 1.677A9.97 9.97 0 0112 15.25c4.875 0 9.194-1.993 12.303-5.197m-15.006-2.726A9.969 9.969 0 0112 3.75c4.875 0 9.194 1.993 12.303 5.197M3.982 8.552a10.266 10.266 0 012.832-2.715M15.75 9.75A2.25 2.25 0 1113.5 7.5a2.25 2.25 0 012.25 2.25z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-lg font-medium text-gray-900">
            Invalid or Expired Link
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This unsubscribe link is invalid or has already been used. If you would like to
            update your preferences, please sign in to your account.
          </p>
          <div className="mt-6">
            <Link
              href="/account/preferences"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Manage Preferences →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
