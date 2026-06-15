import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Appointment } from "@/types";
import appointmentsData from "@/mock/appointments.json";

interface AppointmentsStore {
  appointments: Appointment[];
  create: (appt: Appointment) => void;
  update: (id: string, data: Partial<Appointment>) => void;
  cancel: (id: string) => void;
}

export const useAppointmentsStore = create<AppointmentsStore>()(
  persist(
    (set) => ({
      appointments: appointmentsData as Appointment[],
      create: (appt) => set((s) => ({ appointments: [appt, ...s.appointments] })),
      update: (id, data) =>
        set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
      cancel: (id) =>
        set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: "Cancelled" as const } : a)) })),
    }),
    { name: "dental-appointments" }
  )
);
