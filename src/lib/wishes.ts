import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Wish } from "../types";

export type WishInput = {
  title: string;
  url?: string;
  price?: number;
  priority: 1 | 2 | 3;
  imageUrl?: string;
  note?: string;
};

export async function addWish(ownerId: string, input: WishInput): Promise<string> {
  if (!db) throw new Error("Firestore ikke tilgjengelig");
  const ref = await addDoc(collection(db, "wishes"), {
    ownerId,
    ...input,
    reservedBy: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWish(wishId: string, input: Partial<WishInput>): Promise<void> {
  if (!db) throw new Error("Firestore ikke tilgjengelig");
  await updateDoc(doc(db, "wishes", wishId), input);
}

export async function deleteWish(wishId: string): Promise<void> {
  if (!db) throw new Error("Firestore ikke tilgjengelig");
  await deleteDoc(doc(db, "wishes", wishId));
}

export async function reserveWish(wishId: string, uid: string): Promise<void> {
  if (!db) throw new Error("Firestore ikke tilgjengelig");
  await updateDoc(doc(db, "wishes", wishId), { reservedBy: uid });
}

export async function unreserveWish(wishId: string): Promise<void> {
  if (!db) throw new Error("Firestore ikke tilgjengelig");
  await updateDoc(doc(db, "wishes", wishId), { reservedBy: null });
}

export async function getWishesByOwner(ownerId: string): Promise<Wish[]> {
  if (!db) return [];
  // Enkel equality-filter – ingen sammensatt indeks nødvendig
  const q = query(collection(db, "wishes"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  const wishes = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Wish);
  // Sorter klientsiden på createdAt
  return wishes.sort((a, b) => {
    const at = (a.createdAt as { seconds?: number })?.seconds ?? 0;
    const bt = (b.createdAt as { seconds?: number })?.seconds ?? 0;
    return at - bt;
  });
}

export const PRIORITY_LABEL: Record<number, string> = {
  1: "Høy",
  2: "Middels",
  3: "Lav",
};

export const PRIORITY_COLOR: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-blue-100 text-blue-700",
};
