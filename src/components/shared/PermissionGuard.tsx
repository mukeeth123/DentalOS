"use client";

import { usePathname } from "next/navigation";
import { Lock, Eye, ShieldAlert } from "lucide-react";
import { useRoutePermission } from "@/hooks/usePermission";
import { useAuthStore } from "@/stores/authStore";

export function PermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  // Derive top-level route segment
  const segment = "/" + pathname.split("/").filter(Boolean)[0];
  const perm = useRoutePermission(segment);

  if (!user) return null;

  if (perm === "None") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="relative">
          <div className="size-24 rounded-full bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 flex items-center justify-center border border-red-100 dark:border-red-900/30">
            <ShieldAlert className="size-10 text-red-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-red-500 flex items-center justify-center border-2 border-background">
            <Lock className="size-3.5 text-white" />
          </div>
        </div>
        <div className="max-w-sm">
          <h2 className="text-2xl font-bold">Access Restricted</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            You don&apos;t have permission to view this page.{" "}
            Contact your administrator to request access.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-muted-foreground bg-muted rounded-full px-4 py-1.5">
            Role: <strong>{user.role}</strong> &mdash; Permission: <strong className="text-red-600">None</strong>
          </div>
          <p className="text-xs text-muted-foreground">
            Need access? Contact your clinic administrator.
          </p>
        </div>
      </div>
    );
  }

  if (perm === "Read") {
    return (
      <>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 px-4 py-2.5 text-sm text-blue-700 dark:text-blue-400">
          <Eye className="size-4 shrink-0" />
          <span>
            You have <strong>read-only</strong> access to this section. Contact your administrator to request edit permissions.
          </span>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
