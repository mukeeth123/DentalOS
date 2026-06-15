"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, ClipboardList, Scan,
  Shield, FileText, CreditCard, MessageSquare, Bot,
  GitBranch, BarChart3, Brain, Plug, UserCog, Settings,
  ChevronLeft, ChevronRight, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import orgsData from "@/mock/organizations.json";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useRoutePermission } from "@/hooks/usePermission";

const NAV_ITEMS = [
  { label: "Dashboard",      icon: LayoutDashboard, href: "/dashboard",      perm: "Patients" },
  { label: "Patients",       icon: Users,           href: "/patients",       perm: "Patients" },
  { label: "Appointments",   icon: Calendar,        href: "/appointments",   perm: "Appointments" },
  { label: "Clinical",       icon: ClipboardList,   href: "/clinical",       perm: "Clinical" },
  { label: "Imaging",        icon: Scan,            href: "/imaging",        perm: "Clinical" },
  { label: "Insurance",      icon: Shield,          href: "/insurance",      perm: "Claims" },
  { label: "Claims",         icon: FileText,        href: "/claims",         perm: "Claims" },
  { label: "Billing",        icon: CreditCard,      href: "/billing",        perm: "Billing" },
  { label: "Communications", icon: MessageSquare,   href: "/communications", perm: "Patients" },
  { label: "AI Workforce",   icon: Bot,             href: "/ai-workforce",   perm: "AI Agents", badge: "8 Active", badgeColor: "bg-green-500" },
  { label: "Workflows",      icon: GitBranch,       href: "/workflows",      perm: "AI Agents" },
  { label: "Analytics",      icon: BarChart3,       href: "/analytics",      perm: "Reports" },
  { label: "CEO Copilot",    icon: Brain,           href: "/ceo-copilot",    perm: "Reports" },
  { label: "Integrations",   icon: Plug,            href: "/integrations",   perm: "Settings" },
  { label: "Staff",          icon: UserCog,         href: "/staff",          perm: "Settings" },
  { label: "Settings",       icon: Settings,        href: "/settings",       perm: "Settings" },
];

function NavItem({ item, collapsed, perm }: { item: typeof NAV_ITEMS[0]; collapsed: boolean; perm: "Full" | "Read" | "None" }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  const isLocked = perm === "None";

  if (isLocked) {
    return (
      <div
        title={collapsed ? `${item.label} — No Access` : undefined}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm mb-0.5 opacity-30 cursor-not-allowed select-none"
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            <Lock className="size-3 shrink-0" />
          </>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors mb-0.5",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        perm === "Read" && !isActive && "opacity-80"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && perm === "Read" && !isActive && (
        <span className="text-[9px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 shrink-0">View</span>
      )}
      {!collapsed && item.badge && perm !== "Read" && (
        <span className={cn("text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 shrink-0", item.badgeColor ?? "bg-primary")}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NavItemWrapper({ item, collapsed }: { item: typeof NAV_ITEMS[0]; collapsed: boolean }) {
  const perm = useRoutePermission(item.href);
  return <NavItem item={item} collapsed={collapsed} perm={perm} />;
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, activeOrgId, setActiveOrgId } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const orgs = orgsData;
  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0];
  const displayName = user ? `${user.firstName} ${user.lastName}` : "User";
  const displayRole = user?.role ?? "";

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col bg-sidebar border-r border-sidebar-border z-40 overflow-hidden",
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 h-14 px-3 border-b border-sidebar-border shrink-0">
        <div className="shrink-0 flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          🦷
        </div>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-bold text-sm text-sidebar-foreground whitespace-nowrap">DentalOS AI</span>
            <span className="shrink-0 inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              AI
            </span>
          </div>
        )}
      </div>

      {/* Org switcher */}
      {!sidebarCollapsed && (
        <div className="px-3 py-2 border-b border-sidebar-border shrink-0">
          <select
            value={activeOrgId}
            onChange={(e) => setActiveOrgId(e.target.value)}
            className="w-full text-xs rounded-md border border-sidebar-border bg-sidebar text-sidebar-foreground px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 px-0.5">{activeOrg.tagline}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
        {NAV_ITEMS.map((item) => (
          <NavItemWrapper key={item.href} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border shrink-0 p-2">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1 rounded-lg bg-sidebar-accent/50">
            <div className="size-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{displayRole}</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
