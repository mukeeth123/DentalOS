import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  orgId: string;
  orgName: string;
  clinic: string;
  avatar: string;
  mfaEnabled: boolean;
  mfaCode: string; // fixed 6-digit code for demo
  permissions: Record<string, "Full" | "Read" | "None">;
  lastLogin: string;
}

export const MOCK_USERS: AuthUser[] = [
  {
    id: "u-001",
    firstName: "Sarah",
    lastName: "Martinez",
    email: "sarah@smilecare.com",
    password: "SmileCare@2025",
    role: "Clinic Owner",
    orgId: "org-1",
    orgName: "SmileCare Dental",
    clinic: "Main Campus",
    avatar: "SM",
    mfaEnabled: true,
    mfaCode: "482910",
    permissions: { Patients: "Full", Appointments: "Full", Clinical: "Full", Claims: "Full", Billing: "Full", Reports: "Full", Settings: "Full", "AI Agents": "Full", "Doctor Availability": "Full", "Integrations": "Full" },
    lastLogin: "2025-06-15T08:00:00Z",
  },
  {
    id: "u-002",
    firstName: "James",
    lastName: "Chen",
    email: "james@smilecare.com",
    password: "Dentist@2025",
    role: "Dentist",
    orgId: "org-1",
    orgName: "SmileCare Dental",
    clinic: "Main Campus",
    avatar: "JC",
    mfaEnabled: true,
    mfaCode: "731204",
    permissions: { Patients: "Full", Appointments: "Full", Clinical: "Full", Claims: "Read", Billing: "Read", Reports: "Read", Settings: "None", "AI Agents": "None", "Doctor Availability": "Read", "Integrations": "Read" },
    lastLogin: "2025-06-15T07:30:00Z",
  },
  {
    id: "u-003",
    firstName: "Lisa",
    lastName: "Chen",
    email: "lisa@smilecare.com",
    password: "FrontDesk@2025",
    role: "Front Desk",
    orgId: "org-1",
    orgName: "SmileCare Dental",
    clinic: "Main Campus",
    avatar: "LC",
    mfaEnabled: false,
    mfaCode: "000000",
    permissions: { Patients: "Read", Appointments: "Full", Clinical: "None", Claims: "Read", Billing: "None", Reports: "None", Settings: "None", "AI Agents": "None", "Doctor Availability": "Full", "Integrations": "Read" },
    lastLogin: "2025-06-15T08:15:00Z",
  },
  {
    id: "u-004",
    firstName: "Michael",
    lastName: "Rodriguez",
    email: "michael@smilecare.com",
    password: "Insurance@2025",
    role: "Insurance Coordinator",
    orgId: "org-1",
    orgName: "SmileCare Dental",
    clinic: "Main Campus",
    avatar: "MR",
    mfaEnabled: false,
    mfaCode: "000000",
    permissions: { Patients: "Read", Appointments: "Read", Clinical: "None", Claims: "Full", Billing: "Read", Reports: "Read", Settings: "None", "AI Agents": "None", "Doctor Availability": "Read", "Integrations": "Read" },
    lastLogin: "2025-06-14T17:00:00Z",
  },
  {
    id: "u-005",
    firstName: "Amanda",
    lastName: "Wilson",
    email: "amanda@smilecare.com",
    password: "Billing@2025",
    role: "Billing Manager",
    orgId: "org-1",
    orgName: "SmileCare Dental",
    clinic: "Main Campus",
    avatar: "AW",
    mfaEnabled: false,
    mfaCode: "000000",
    permissions: { Patients: "Read", Appointments: "None", Clinical: "None", Claims: "Full", Billing: "Full", Reports: "Full", Settings: "None", "AI Agents": "None", "Doctor Availability": "None", "Integrations": "Read" },
    lastLogin: "2025-06-15T09:00:00Z",
  },
  {
    id: "u-006",
    firstName: "Robert",
    lastName: "King",
    email: "robert@dentalgroup.com",
    password: "DSOAdmin@2025",
    role: "DSO Admin",
    orgId: "org-2",
    orgName: "Bright Dental Group",
    clinic: "HQ",
    avatar: "RK",
    mfaEnabled: true,
    mfaCode: "905123",
    permissions: { Patients: "Full", Appointments: "Full", Clinical: "Full", Claims: "Full", Billing: "Full", Reports: "Full", Settings: "Full", "AI Agents": "Full", "Doctor Availability": "Full", "Integrations": "Full" },
    lastLogin: "2025-06-15T06:45:00Z",
  },
  {
    id: "u-007",
    firstName: "Super",
    lastName: "Admin",
    email: "admin@dentalos.ai",
    password: "SuperAdmin@2025",
    role: "Super Admin",
    orgId: "org-1",
    orgName: "SmileCare Dental",
    clinic: "All Clinics",
    avatar: "SA",
    mfaEnabled: true,
    mfaCode: "112233",
    permissions: { Patients: "Full", Appointments: "Full", Clinical: "Full", Claims: "Full", Billing: "Full", Reports: "Full", Settings: "Full", "AI Agents": "Full", "Doctor Availability": "Full", "Integrations": "Full" },
    lastLogin: "2025-06-15T10:00:00Z",
  },
];

export interface Notification {
  id: string;
  type: "alert" | "info" | "success" | "warning";
  title: string;
  body: string;
  time: string;
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "alert", title: "Claims at Risk", body: "12 claims with missing info need attention before EOD", time: new Date(Date.now() - 5 * 60000).toISOString(), read: false, link: "/claims" },
  { id: "n2", type: "warning", title: "Insurance Unverified", body: "8 patients with tomorrow's appointments need verification", time: new Date(Date.now() - 18 * 60000).toISOString(), read: false, link: "/insurance" },
  { id: "n3", type: "success", title: "Payment Received", body: "Invoice INV-0042 — $340 payment recorded from Maria Garcia", time: new Date(Date.now() - 34 * 60000).toISOString(), read: false, link: "/billing" },
  { id: "n4", type: "info", title: "AI Recall Campaign", body: "67 recall SMS messages sent successfully by AI Recall agent", time: new Date(Date.now() - 52 * 60000).toISOString(), read: false, link: "/communications" },
  { id: "n5", type: "success", title: "Claim Approved", body: "CLM-0089 approved by Delta Dental — $1,240 incoming", time: new Date(Date.now() - 80 * 60000).toISOString(), read: true, link: "/claims" },
  { id: "n6", type: "alert", title: "AR 90+ Day Alert", body: "$34,200 in accounts receivable over 90 days outstanding", time: new Date(Date.now() - 2 * 3600000).toISOString(), read: true, link: "/billing" },
  { id: "n7", type: "info", title: "New Patient Added", body: "AI Receptionist added Emily Thompson as a new patient", time: new Date(Date.now() - 3 * 3600000).toISOString(), read: true, link: "/patients" },
];

interface AuthStore {
  user: AuthUser | null;
  pendingMfaUser: AuthUser | null;
  notifications: Notification[];
  login: (email: string, password: string) => { success: boolean; requiresMfa: boolean; error?: string };
  verifyMfa: (code: string) => { success: boolean; error?: string };
  logout: () => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      pendingMfaUser: null,
      notifications: INITIAL_NOTIFICATIONS,


      login: (email, password) => {
        const found = MOCK_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!found) return { success: false, requiresMfa: false, error: "Invalid email or password" };
        if (found.mfaEnabled) {
          set({ pendingMfaUser: found });
          return { success: false, requiresMfa: true };
        }
        set({ user: { ...found, lastLogin: new Date().toISOString() }, pendingMfaUser: null });
        return { success: true, requiresMfa: false };
      },

      verifyMfa: (code) => {
        const pending = get().pendingMfaUser;
        if (!pending) return { success: false, error: "No pending MFA session" };
        if (code !== pending.mfaCode) return { success: false, error: "Invalid verification code" };
        set({ user: { ...pending, lastLogin: new Date().toISOString() }, pendingMfaUser: null });
        return { success: true };
      },

      logout: () => set({ user: null, pendingMfaUser: null }),

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),

      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      dismissNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
    }),
    {
      name: "dental-auth",
      partialize: (s) => ({ user: s.user, notifications: s.notifications }),
    }
  )
);
