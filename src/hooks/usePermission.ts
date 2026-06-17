"use client";
import { useAuthStore } from "@/stores/authStore";

export type PermLevel = "Full" | "Read" | "None";

// Map route → permission key from authStore
const ROUTE_PERM: Record<string, string> = {
  "/patients":       "Patients",
  "/appointments":   "Appointments",
  "/doctor-availability": "Doctor Availability",
  "/clinical":       "Clinical",
  "/imaging":        "Clinical",
  "/insurance":      "Claims",
  "/claims":         "Claims",
  "/billing":        "Billing",
  "/communications": "Patients",
  "/ai-workforce":   "AI Agents",
  "/workflows":      "AI Agents",
  "/analytics":      "Reports",
  "/ceo-copilot":    "Reports",
  "/integrations":   "Integrations",
  "/staff":          "Settings",
  "/settings":       "Settings",
  "/dashboard":      "Patients",
};

export function usePermission(module: string): PermLevel {
  const user = useAuthStore((s) => s.user);
  if (!user) return "None";
  // Super Admin / DSO Admin / Clinic Owner with Full = Full everywhere
  if (["Super Admin", "DSO Admin", "Clinic Owner"].includes(user.role)) return "Full";
  return (user.permissions[module] as PermLevel) ?? "None";
}

export function useRoutePermission(route: string): PermLevel {
  const module = ROUTE_PERM[route] ?? "Settings";
  return usePermission(module);
}

export function useCanEdit(module: string): boolean {
  return usePermission(module) === "Full";
}
