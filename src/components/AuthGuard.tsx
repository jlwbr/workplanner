import { signIn, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'loading') {
      //auth is initialized and there is no user
      if (status !== 'authenticated') {
        // remember the page that user tried to access
        signIn('slack');
      }
    }
  }, [status]);

  /* show loading indicator while the auth provider is still initializing */
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-200">
        <svg
          className="animate-spin -ml-1 mr-3 h-20 w-20 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  // if auth initialized with a valid user show protected page
  if (status === 'authenticated') {
    return <>{children}</>;
  }

  /* otherwise don't return anything, will do a redirect from useEffect */
  return null;
}
