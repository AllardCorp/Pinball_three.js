import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useSession } from "../lib/auth-client";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = useSession();

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
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}
