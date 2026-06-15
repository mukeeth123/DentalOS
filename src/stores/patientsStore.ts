import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Patient } from "@/types";
import patientsData from "@/mock/patients.json";

interface PatientsStore {
  patients: Patient[];
  selected: Patient | null;
  setSelected: (id: string | null) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;
}

export const usePatientsStore = create<PatientsStore>()(
  persist(
    (set, get) => ({
      patients: patientsData as Patient[],
      selected: null,
      setSelected: (id) =>
        set({ selected: id ? (get().patients.find((p) => p.id === id) ?? null) : null }),
      updatePatient: (id, data) =>
        set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, ...data } : p)),
          selected: s.selected?.id === id ? { ...s.selected, ...data } : s.selected,
        })),
    }),
    { name: "dental-patients" }
  )
);
