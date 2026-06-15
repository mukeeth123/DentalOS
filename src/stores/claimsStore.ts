import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Claim, ClaimStatus } from "@/types";
import claimsData from "@/mock/claims.json";

interface ClaimsStore {
  claims: Claim[];
  updateStatus: (id: string, status: ClaimStatus) => void;
  addNote: (id: string, note: string) => void;
}

export const useClaimsStore = create<ClaimsStore>()(
  persist(
    (set) => ({
      claims: claimsData as Claim[],
      updateStatus: (id, status) =>
        set((s) => ({ claims: s.claims.map((c) => (c.id === id ? { ...c, status } : c)) })),
      addNote: (id, note) =>
        set((s) => ({ claims: s.claims.map((c) => (c.id === id ? { ...c, notes: note } : c)) })),
    }),
    { name: "dental-claims" }
  )
);
