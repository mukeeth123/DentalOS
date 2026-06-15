"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Already hydrated before this effect ran
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Subscribe to finish event
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  return hydrated;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const hydrated = useStoreHydrated();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  // Wait for localStorage to load
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ marginLeft: sidebarCollapsed ? "64px" : "256px", transition: "margin-left 0.3s ease" }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <PermissionGuard>{children}</PermissionGuard>
        </main>
      </div>
    </div>
  );
}
