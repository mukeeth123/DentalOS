import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Doctor, LeaveRecord, DoctorStatus } from "@/types";
import doctorsData from "@/mock/doctors.json";

interface DoctorsStore {
  doctors: Doctor[];
  setStatus: (id: string, status: DoctorStatus) => void;
  addLeave: (id: string, leave: LeaveRecord) => void;
  updateLeaveStatus: (doctorId: string, leaveId: string, status: LeaveRecord["status"]) => void;
}

export const useDoctorsStore = create<DoctorsStore>()(
  persist(
    (set) => ({
      doctors: doctorsData as Doctor[],

      setStatus: (id, status) =>
        set((s) => ({ doctors: s.doctors.map((d) => (d.id === id ? { ...d, status } : d)) })),

      addLeave: (id, leave) =>
        set((s) => ({
          doctors: s.doctors.map((d) =>
            d.id === id
              ? {
                  ...d,
                  leaveRecords: [leave, ...d.leaveRecords],
                  status: leave.status === "Approved" ? "On Leave" : d.status,
                }
              : d
          ),
        })),

      updateLeaveStatus: (doctorId, leaveId, status) =>
        set((s) => ({
          doctors: s.doctors.map((d) =>
            d.id === doctorId
              ? {
                  ...d,
                  leaveRecords: d.leaveRecords.map((l) => (l.id === leaveId ? { ...l, status } : l)),
                  status: status === "Approved" ? "On Leave" : d.status,
                }
              : d
          ),
        })),
    }),
    { name: "dental-doctors" }
  )
);

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export interface AvailabilityCheck {
  available: boolean;
  reason?: string;
}

interface AppointmentLike {
  dentistId: string;
  startTime: string;
  endTime: string;
  status: string;
}

/**
 * Shared availability check used by the Appointments booking form and the
 * AI Receptionist call-booking flow so both enforce the same rules:
 * doctor status, weekly working hours, approved leave, and existing
 * appointment conflicts (assumes a 60-minute slot).
 */
export function isDoctorAvailableAt(
  doctor: Doctor,
  isoDateTime: string,
  existingAppointments: AppointmentLike[]
): AvailabilityCheck {
  if (doctor.status === "On Leave" || doctor.status === "Off Duty") {
    return { available: false, reason: `Dr. ${doctor.lastName} is currently ${doctor.status}` };
  }

  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return { available: false, reason: "Invalid date/time" };
  }

  const dayKey = DAY_KEYS[date.getDay()];
  const daySchedule = doctor.schedule[dayKey];
  if (!daySchedule.active) {
    return { available: false, reason: `Dr. ${doctor.lastName} does not see patients on ${dayKey}s` };
  }

  const timeStr = date.toTimeString().slice(0, 5);
  if (timeStr < daySchedule.start || timeStr >= daySchedule.end) {
    return {
      available: false,
      reason: `Outside Dr. ${doctor.lastName}'s working hours (${daySchedule.start}–${daySchedule.end})`,
    };
  }

  const dateOnly = isoDateTime.slice(0, 10);
  const onApprovedLeave = doctor.leaveRecords.some(
    (l) => l.status === "Approved" && dateOnly >= l.startDate.slice(0, 10) && dateOnly <= l.endDate.slice(0, 10)
  );
  if (onApprovedLeave) {
    return { available: false, reason: `Dr. ${doctor.lastName} is on approved leave that day` };
  }

  const slotStart = date.getTime();
  const slotEnd = slotStart + 60 * 60000;
  const conflict = existingAppointments.some((a) => {
    if (a.dentistId !== doctor.id || a.status === "Cancelled") return false;
    const aStart = new Date(a.startTime).getTime();
    const aEnd = new Date(a.endTime).getTime();
    return slotStart < aEnd && slotEnd > aStart;
  });
  if (conflict) {
    return { available: false, reason: `Dr. ${doctor.lastName} already has an appointment at that time` };
  }

  return { available: true };
}
