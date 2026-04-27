import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { UserProfile } from "../types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  firestoreError: string | null;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  firestoreError: null,
});

async function createMissingProfile(user: User) {
  if (!db) return;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    username: null,
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "Bruker",
    photoURL: user.photoURL ?? "",
    birthday: null,
    familyIds: [],
    createdAt: serverTimestamp(),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || !db) {
      if (user && !db) setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setLoading(false);
      setFirestoreError("permission-denied");
    }, 8000);

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        clearTimeout(timeout);
        if (!snap.exists()) {
          // Profil mangler — opprett den automatisk
          await createMissingProfile(user);
          // onSnapshot vil fyre på nytt etter setDoc
        } else {
          setProfile(snap.data() as UserProfile);
          setFirestoreError(null);
          setLoading(false);
        }
      },
      (err) => {
        clearTimeout(timeout);
        setFirestoreError(err.code);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, firestoreError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
