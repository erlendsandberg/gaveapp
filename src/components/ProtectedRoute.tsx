import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-400">
        <span className="text-4xl animate-bounce">🎂</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/logg-inn" replace />;
  }

  // Profil er lastet og bursdag mangler → send til oppsett
  // Unngå redirect-loop ved å sjekke at vi ikke allerede er der
  if (profile && !profile.birthday && location.pathname !== "/oppsett") {
    return <Navigate to="/oppsett" replace />;
  }

  return <>{children}</>;
}
