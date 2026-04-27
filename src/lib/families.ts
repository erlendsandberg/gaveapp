import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Family, UserProfile } from "../types";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function createFamily(name: string, creatorUid: string): Promise<Family> {
  if (!db) throw new Error("Firestore ikke tilgjengelig");

  const familyRef = doc(collection(db, "families"));
  const inviteCode = generateInviteCode();

  const family: Family = {
    id: familyRef.id,
    name: name.trim(),
    inviteCode,
    memberIds: [creatorUid],
    createdBy: creatorUid,
  };

  await setDoc(familyRef, { ...family, createdAt: serverTimestamp() });

  // Legg familieId til brukerprofilen
  await updateDoc(doc(db, "users", creatorUid), {
    familyIds: arrayUnion(familyRef.id),
  });

  return family;
}

export async function joinFamily(inviteCode: string, uid: string): Promise<Family> {
  if (!db) throw new Error("Firestore ikke tilgjengelig");

  const q = query(
    collection(db, "families"),
    where("inviteCode", "==", inviteCode.trim().toUpperCase())
  );
  const snap = await getDocs(q);

  if (snap.empty) throw new Error("Ugyldig kode — fant ingen familie");

  const familyDoc = snap.docs[0];
  const family = familyDoc.data() as Family;

  if (family.memberIds.includes(uid)) {
    throw new Error("Du er allerede medlem av denne familien");
  }

  await updateDoc(familyDoc.ref, { memberIds: arrayUnion(uid) });
  await updateDoc(doc(db, "users", uid), { familyIds: arrayUnion(familyDoc.id) });

  return { ...family, id: familyDoc.id };
}

export async function getFamily(familyId: string): Promise<Family | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "families", familyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Family;
}

export async function getFamilyMembers(memberIds: string[]): Promise<UserProfile[]> {
  if (!db || memberIds.length === 0) return [];

  const promises = memberIds.map((uid) =>
    getDoc(doc(db!, "users", uid)).then((s) =>
      s.exists() ? (s.data() as UserProfile) : null
    )
  );
  const results = await Promise.all(promises);
  return results.filter(Boolean) as UserProfile[];
}

export async function getUserFamilies(uid: string): Promise<Family[]> {
  if (!db) return [];
  const q = query(collection(db, "families"), where("memberIds", "array-contains", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Family);
}
