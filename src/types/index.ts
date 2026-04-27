import type { Timestamp } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  email: string | null;
  username: string | null;
  displayName: string;
  photoURL: string;
  birthday: string | null;
  familyIds: string[];
  /** UID of the parent/guardian who manages this profile (child profiles only) */
  managedBy?: string;
  createdAt?: Timestamp;
};

export type Family = {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  createdBy: string;
  createdAt?: Timestamp;
};

export type Wish = {
  id: string;
  ownerId: string;
  familyId?: string;
  title: string;
  url?: string;
  price?: number;
  priority: 1 | 2 | 3;
  imageUrl?: string;
  note?: string;
  reservedBy?: string | null;
  createdAt?: Timestamp;
};

export type GiftHistoryEntry = {
  id: string;
  recipientId: string;
  giverId: string;
  familyId: string;
  title: string;
  year: number;
  createdAt?: Timestamp;
};
