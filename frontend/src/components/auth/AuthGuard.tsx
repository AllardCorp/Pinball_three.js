import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAppMode } from "../../hooks/useAppMode";
import { useSession } from "../../lib/auth-client";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = useSession();
  const location = useLocation();
  const { withMode } = useAppMode();

  // On attend la resolution de la session avant de rediriger,
  // sinon React ferait un clignotement inutile.
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Verification de la session...
      </div>
    );
  }

  if (!session) {
    const redirectTo = withMode(`${location.pathname}${location.search}${location.hash}`);
    return (
      <Navigate replace to={withMode(`/login?redirect=${encodeURIComponent(redirectTo)}`)} />
    );
  }

  return <>{children}</>;
}
