import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { signOutUser } from "../lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, firestoreError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-5xl animate-bounce">🎂</span>
      </div>
    );
  }

  // Firestore-tilgang blokkert → vis hjelpsom feilmelding
  if (firestoreError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fuchsia-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Tilgang blokkert av Firebase
          </h2>
          <p className="text-sm text-zinc-600 mb-6">
            Firestore-reglene blokkerer lesing. Du må sette databasereglene til
            å tillate tilgang.
          </p>
          <div className="rounded-lg bg-zinc-50 p-4 text-left text-xs font-mono text-zinc-700 mb-6">
            <p className="font-bold mb-2">Gå til Firebase Console:</p>
            <p>Databases & Storage → Firestore →</p>
            <p>Rules → endre til:</p>
            <pre className="mt-2 text-fuchsia-700">{`allow read, write: if true;`}</pre>
            <p className="mt-2 text-zinc-500">(midlertidig testmodus)</p>
          </div>
          <a
            href="https://console.firebase.google.com/project/gaveapp/firestore/rules"
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white hover:bg-fuchsia-700 mb-3"
          >
            Åpne Firestore Rules →
          </a>
          <button
            onClick={() => signOutUser()}
            className="text-sm text-zinc-400 hover:text-zinc-700"
          >
            Logg ut
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/logg-inn" replace />;
  }

  if (profile && !profile.birthday && location.pathname !== "/oppsett") {
    return <Navigate to="/oppsett" replace />;
  }

  return <>{children}</>;
}
