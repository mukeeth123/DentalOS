import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "@/types";

interface UIStore {
  sidebarCollapsed: boolean;
  theme: Theme;
  activeDemo: boolean;
  demoStep: number;
  activeOrgId: string;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setActiveDemo: (active: boolean) => void;
  setDemoStep: (step: number) => void;
  setActiveOrgId: (id: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "light",
      activeDemo: false,
      demoStep: 0,
      activeOrgId: "org-1",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setActiveDemo: (activeDemo) => set({ activeDemo }),
      setDemoStep: (demoStep) => set({ demoStep }),
      setActiveOrgId: (activeOrgId) => set({ activeOrgId }),
    }),
    { name: "dental-ui" }
  )
);
