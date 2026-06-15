"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, Bell, Sun, Moon, Monitor, LogOut, User, ChevronDown,
  Settings, Shield, CheckCircle, AlertTriangle, Info, X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { usePatientsStore } from "@/stores/patientsStore";
import { useAppointmentsStore } from "@/stores/appointmentsStore";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore, type Notification } from "@/stores/authStore";
import orgsData from "@/mock/organizations.json";
import { getInitials, timeAgo } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/appointments": "Appointments",
  "/clinical": "Clinical",
  "/imaging": "Imaging",
  "/insurance": "Insurance",
  "/claims": "Claims",
  "/billing": "Billing",
  "/communications": "Communications",
  "/ai-workforce": "AI Workforce",
  "/workflows": "Workflows",
  "/analytics": "Analytics",
  "/ceo-copilot": "CEO Copilot",
  "/integrations": "Integrations",
  "/staff": "Staff",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + "/")) return title;
  }
  return "DentalOS AI";
}

function getBreadcrumbs(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p) => {
    if (p.match(/^(PAT|CLM|INV|APT|STF)-/)) return p;
    return PAGE_TITLES["/" + p] ?? p.charAt(0).toUpperCase() + p.slice(1);
  });
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  alert: <AlertTriangle className="size-4 text-red-500" />,
  warning: <AlertTriangle className="size-4 text-yellow-500" />,
  success: <CheckCircle className="size-4 text-green-500" />,
  info: <Info className="size-4 text-blue-500" />,
};


function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllRead, dismissNotification } = useAuthStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 rounded-xl bg-popover border border-border shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <span className="font-semibold text-sm">Notifications</span>
          {unread > 0 && (
            <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <CheckCircle className="size-8 mb-2 opacity-40" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          notifications.map((notif: Notification) => (
            <div
              key={notif.id}
              className={`relative flex gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
            >
              {!notif.read && <span className="absolute left-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary" />}
              <div className="shrink-0 mt-0.5">{NOTIF_ICONS[notif.type]}</div>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  markNotificationRead(notif.id);
                  if (notif.link) { router.push(notif.link); onClose(); }
                }}
              >
                <p className={`text-sm font-medium truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>{notif.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notif.body}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.time)}</p>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground mt-0.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/30">
        <button
          onClick={() => { router.push("/settings"); onClose(); }}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <Settings className="size-3" /> Notification settings
        </button>
      </div>
    </div>
  );
}

type ThemeMode = "light" | "dark" | "system";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { activeOrgId } = useUIStore();
  const { patients } = usePatientsStore();
  const { appointments } = useAppointmentsStore();
  const { user, logout, notifications } = useAuthStore();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const activeOrg = orgsData.find((o) => o.id === activeOrgId) ?? orgsData[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayUser = user ?? {
    firstName: "Sarah", lastName: "Martinez", role: "Clinic Owner", avatar: "SM",
    email: "sarah@smilecare.com",
  };

  const toggleTheme = useCallback(() => {
    const modes: ThemeMode[] = ["light", "dark", "system"];
    const cur = (theme as ThemeMode) || "light";
    const next = modes[(modes.indexOf(cur) + 1) % modes.length];
    setTheme(next);
  }, [theme, setTheme]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const breadcrumbs = getBreadcrumbs(pathname);
  const ThemeIcon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  const handleSignOut = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/login");
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center gap-3 px-6 shrink-0 z-30 relative">
      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground">{getPageTitle(pathname)}</h1>
        {breadcrumbs.length > 1 && (
          <p className="text-xs text-muted-foreground">{breadcrumbs.join(" / ")}</p>
        )}
      </div>

      {/* Search */}
      <button
        onClick={() => setCmdOpen(true)}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="size-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 text-xs bg-background border border-border rounded px-1">⌘K</kbd>
      </button>

      {/* Notifications */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
        {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
      </div>

      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" onClick={toggleTheme} title={`Theme: ${theme}`}>
        <ThemeIcon className="size-4" />
      </Button>

      {/* Org badge */}
      <div className="hidden md:flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
        <span className="size-2 rounded-full bg-green-500" />
        {activeOrg.name}
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors"
        >
          <div className="size-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {displayUser.avatar ?? getInitials(`${displayUser.firstName} ${displayUser.lastName}`)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-foreground">{displayUser.firstName} {displayUser.lastName}</p>
            <p className="text-[10px] text-muted-foreground">{displayUser.role}</p>
          </div>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-popover ring-1 ring-foreground/10 shadow-lg z-50 py-1 overflow-hidden">
            {/* User info */}
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-sm font-semibold">{displayUser.firstName} {displayUser.lastName}</p>
              <p className="text-xs text-muted-foreground">{displayUser.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium">{displayUser.role}</span>
                {user?.mfaEnabled && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-1.5 py-0.5">🔐 MFA On</span>}
              </div>
            </div>

            <button
              onClick={() => { router.push("/settings"); setUserMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <User className="size-4 text-muted-foreground" /> My Profile
            </button>
            <button
              onClick={() => { router.push("/settings"); setUserMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Settings className="size-4 text-muted-foreground" /> Settings
            </button>
            <button
              onClick={() => { router.push("/staff"); setUserMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Shield className="size-4 text-muted-foreground" /> Security & Access
            </button>

            <div className="h-px bg-border my-1" />

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="size-4" /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Command Dialog */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen} title="Search DentalOS" description="Search patients, appointments, and more">
        <CommandInput placeholder="Search patients, appointments, claims..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Patients">
            {patients.slice(0, 8).map((p) => (
              <CommandItem key={p.id} onSelect={() => { router.push(`/patients/${p.id}`); setCmdOpen(false); }}>
                <User className="size-4" />
                {p.firstName} {p.lastName} — {p.id} · {p.phone}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Appointments">
            {appointments.slice(0, 5).map((a) => (
              <CommandItem key={a.id} onSelect={() => { router.push("/appointments"); setCmdOpen(false); }}>
                {a.patientName} — {a.type}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Pages">
            {Object.entries(PAGE_TITLES).map(([href, title]) => (
              <CommandItem key={href} onSelect={() => { router.push(href); setCmdOpen(false); }}>
                {title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Overlay to close panels */}
      {(userMenuOpen || notifOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setUserMenuOpen(false); setNotifOpen(false); }} />
      )}
    </header>
  );
}
