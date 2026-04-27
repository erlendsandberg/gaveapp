import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

const USERNAME_DOMAIN = "@gaveapp.local";

function normalizeUsername(input: string) {
  return input.trim().toLowerCase();
}

function usernameToEmail(username: string) {
  return `${normalizeUsername(username)}${USERNAME_DOMAIN}`;
}

export function isValidUsername(username: string) {
  return /^[a-z0-9_-]{3,20}$/i.test(username.trim());
}

async function ensureUserProfile(
  uid: string,
  data: {
    email: string | null;
    displayName: string;
    photoURL?: string;
    username?: string | null;
  }
) {
  if (!db) throw new Error("Firestore er ikke initialisert");
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      email: data.email,
      username: data.username ?? null,
      displayName: data.displayName,
      photoURL: data.photoURL ?? "",
      birthday: null,
      familyIds: [],
      createdAt: serverTimestamp(),
    });
  }
}

export async function signInWithGoogle() {
  if (!auth || !db) throw new Error("Firebase er ikke konfigurert");
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await ensureUserProfile(user.uid, {
    email: user.email,
    displayName: user.displayName ?? "",
    photoURL: user.photoURL ?? "",
  });
  return user;
}

export async function createAccountWithUsername(
  rawUsername: string,
  password: string,
  displayName: string
) {
  if (!auth || !db) throw new Error("Firebase er ikke konfigurert");
  const username = normalizeUsername(rawUsername);

  if (!isValidUsername(username)) {
    throw new Error("Brukernavn må være 3–20 tegn (bokstaver, tall, _ eller -)");
  }
  if (password.length < 6) {
    throw new Error("Passordet må være minst 6 tegn");
  }
  if (!displayName.trim()) {
    throw new Error("Navn må fylles ut");
  }

  const usernameRef = doc(db, "usernames", username);
  const taken = await getDoc(usernameRef);
  if (taken.exists()) {
    throw new Error("Brukernavnet er opptatt");
  }

  const result = await createUserWithEmailAndPassword(
    auth,
    usernameToEmail(username),
    password
  );
  const user = result.user;

  await updateProfile(user, { displayName: displayName.trim() });
  await ensureUserProfile(user.uid, {
    email: null,
    displayName: displayName.trim(),
    username,
  });
  await setDoc(usernameRef, { uid: user.uid });

  return user;
}

export async function signInWithUsername(rawUsername: string, password: string) {
  if (!auth) throw new Error("Firebase er ikke konfigurert");
  const username = normalizeUsername(rawUsername);
  if (!isValidUsername(username)) {
    throw new Error("Ugyldig brukernavn");
  }
  return signInWithEmailAndPassword(auth, usernameToEmail(username), password);
}

export function signOutUser() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

export function isUsernameAccount(email: string | null) {
  return email?.endsWith("@gaveapp.local") ?? false;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (!auth?.currentUser) throw new Error("Ikke innlogget");
  if (newPassword.length < 6) throw new Error("Nytt passord må være minst 6 tegn");

  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
