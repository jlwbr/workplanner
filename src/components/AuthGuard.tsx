import { signIn, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'loading') {
      //auth is initialized and there is no user
      if (status !== 'authenticated') {
        // remember the page that user tried to access
        signIn();
      }
    }
  }, [status]);

  /* show loading indicator while the auth provider is still initializing */
  if (status === 'loading') {
    return <h1>Application Loading</h1>;
  }

  // if auth initialized with a valid user show protected page
  if (status === 'authenticated') {
    return <>{children}</>;
  }

  /* otherwise don't return anything, will do a redirect from useEffect */
  return null;
}
