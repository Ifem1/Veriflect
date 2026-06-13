"use client";

import { create } from "zustand";

interface VeriflectState {
  address: string | null;
  isModeratorRole: boolean;
  knownCaseIds: string[];
  setAddress: (addr: string | null) => void;
  setModeratorRole: (b: boolean) => void;
  addKnownCase: (id: string) => void;
  setKnownCases: (ids: string[]) => void;
}

const KNOWN_KEY = "veriflect.knownCaseIds";

const loadKnown = (): string[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KNOWN_KEY) ?? "[]"); } catch { return []; }
};

const saveKnown = (ids: string[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KNOWN_KEY, JSON.stringify(ids));
};

export const useVeriflect = create<VeriflectState>((set, get) => ({
  address: null,
  isModeratorRole: false,
  knownCaseIds: typeof window !== "undefined" ? loadKnown() : [],
  setAddress: (addr) => set({ address: addr }),
  setModeratorRole: (b) => set({ isModeratorRole: b }),
  addKnownCase: (id) => {
    const ids = Array.from(new Set([id, ...get().knownCaseIds]));
    saveKnown(ids);
    set({ knownCaseIds: ids });
  },
  setKnownCases: (ids) => {
    const uniq = Array.from(new Set(ids));
    saveKnown(uniq);
    set({ knownCaseIds: uniq });
  },
}));
