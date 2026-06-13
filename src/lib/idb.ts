"use client";

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "veriflect";
const STORE = "case_drafts";

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (typeof window === "undefined") throw new Error("IDB only in browser");
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
};

export async function saveDraft(key: string, value: unknown) {
  const db = await getDB();
  await db.put(STORE, { key, value, savedAt: Date.now() });
}

export async function loadDraft<T = unknown>(key: string): Promise<T | null> {
  const db = await getDB();
  const row = await db.get(STORE, key);
  return (row?.value as T) ?? null;
}

export async function clearDraft(key: string) {
  const db = await getDB();
  await db.delete(STORE, key);
}
