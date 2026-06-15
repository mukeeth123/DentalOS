"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Shield, CheckCircle, ChevronRight, AlertCircle,
  Users, Calendar, Stethoscope, FileText, CreditCard, BarChart2, Settings, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore, MOCK_USERS } from "@/stores/authStore";
import { toast } from "sonner";

/* ─── Compact access matrix per role ────────────────────────────────────────── */
type PermLevel = "Full" | "Read" | "None";

const ROLE_ACCESS: Record<string, { label: string; perms: PermLevel[] }> = {
  "Super Admin":            { label: "All 8 modules — Full access", perms: ["Full","Full","Full","Full","Full","Full","Full","Full"] },
  "DSO Admin":              { label: "All 8 modules — Full access", perms: ["Full","Full","Full","Full","Full","Full","Full","Full"] },
  "Clinic Owner":           { label: "Full access, Settings is view-only", perms: ["Full","Full","Full","Full","Full","Full","Read","Full"] },
  Dentist:                  { label: "Clinical+Patients full, Billing/Claims view-only", perms: ["Full","Full","Full","Read","Read","Read","None","None"] },
  "Front Desk":             { label: "Appointments full, Patients view, no Clinical/Billing", perms: ["Read","Full","None","Read","None","None","None","None"] },
  "Insurance Coordinator":  { label: "Claims full, Patients/Billing view-only", perms: ["Read","Read","None","Full","Read","Read","None","None"] },
  "Billing Manager":        { label: "Billing/Claims/Analytics full, no Appointments", perms: ["Read","None","None","Full","Full","Full","None","None"] },
};

const MODULES = ["Patients","Appts","Clinical","Claims","Billing","Analytics","Settings","AI"];
const MODULE_ICONS = [
  <Users key="p" className="size-3" />,
  <Calendar key="a" className="size-3" />,
  <Stethoscope key="c" className="size-3" />,
  <FileText key="cl" className="size-3" />,
  <CreditCard key="b" className="size-3" />,
  <BarChart2 key="r" className="size-3" />,
  <Settings key="s" className="size-3" />,
  <Bot key="ai" className="size-3" />,
];

const PERM_DOT: Record<PermLevel, string> = {
  Full: "bg-green-400",
  Read: "bg-yellow-400",
  None: "bg-white/15",
};

const ROLE_COLORS: Record<string, string> = {
  "Super Admin":           "bg-red-500/20 text-red-400 border-red-500/30",
  "DSO Admin":             "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Clinic Owner":          "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Dentist:                 "bg-green-500/20 text-green-400 border-green-500/30",
  "Front Desk":            "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Insurance Coordinator": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Billing Manager":       "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = login(email, password);
    setLoading(false);
    if (result.requiresMfa) {
      router.push("/login/mfa");
    } else if (result.success) {
      toast.success("Welcome back to DentalOS AI!");
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  const quickLogin = async (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = login(userEmail, userPassword);
    setLoading(false);
    if (result.requiresMfa) {
      router.push("/login/mfa");
    } else if (result.success) {
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-2xl">🦷</div>
            <div>
              <p className="text-white font-bold text-xl">DentalOS AI</p>
              <p className="text-white/50 text-xs">Enterprise Dental Platform</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            AI-Powered<br />Dental Practice<br />Management
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            The only dental OS with a built-in AI workforce — 8 specialized agents that handle scheduling, claims, billing, and patient care 24/7.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            "AI Receptionist handles 1,200+ calls/month",
            "94% claims approval rate with AI Claims agent",
            "67 recall patients reactivated this month",
            "HIPAA compliant · SOC 2 Type II certified",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-white/70 text-sm">
              <CheckCircle className="size-4 text-green-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-lg">🦷</div>
            <span className="text-white font-bold text-lg">DentalOS AI</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-white/50 text-sm mb-6">Sign in to your practice account</p>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400 mb-4">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-white/80 text-sm mb-1.5 block">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@practice.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <Label className="text-white/80 text-sm">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                </div>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary pr-10"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded accent-primary" />
                <label htmlFor="remember" className="text-sm text-white/60">Remember this device for 30 days</label>
              </div>
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2"><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Signing in...</span>
                ) : (
                  <span className="flex items-center gap-2">Sign In <ChevronRight className="size-4" /></span>
                )}
              </Button>
            </form>

            <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
              <Shield className="size-3" />
              <span>Protected by enterprise-grade encryption · HIPAA compliant</span>
            </div>
          </div>

          {/* Demo Credentials + Access Panel */}
          <div className="mt-4">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/60 hover:bg-white/10 transition-colors"
            >
              <span>🔑 Demo Credentials — All Roles &amp; Access Levels</span>
              <ChevronRight className={`size-4 transition-transform ${showCredentials ? "rotate-90" : ""}`} />
            </button>

            {showCredentials && (
              <div className="mt-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                {/* Legend */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-b border-white/10 bg-white/5">
                  <span className="text-[10px] text-white/40 font-medium">ACCESS LEGEND:</span>
                  <span className="flex items-center gap-1 text-[10px] text-green-400"><span className="size-2 rounded-full bg-green-400" /> Full</span>
                  <span className="flex items-center gap-1 text-[10px] text-yellow-400"><span className="size-2 rounded-full bg-yellow-400" /> View</span>
                  <span className="flex items-center gap-1 text-[10px] text-white/30"><span className="size-2 rounded-full bg-white/15" /> None</span>
                </div>

                {/* Module header row */}
                <div className="grid grid-cols-[1fr_auto] items-center px-4 py-2 border-b border-white/10">
                  <span className="text-[10px] text-white/30">Click any role to instantly sign in</span>
                  <div className="flex items-center gap-1">
                    {MODULE_ICONS.map((icon, i) => (
                      <div key={i} className="w-6 flex items-center justify-center text-white/25" title={MODULES[i]}>
                        {icon}
                      </div>
                    ))}
                  </div>
                </div>

                {MOCK_USERS.map((u) => {
                  const access = ROLE_ACCESS[u.role];
                  const isExpanded = expandedRole === u.id;
                  return (
                    <div key={u.id} className="border-b border-white/5 last:border-0">
                      {/* Role row */}
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
                        {/* Avatar + name — click to login */}
                        <button
                          onClick={() => quickLogin(u.email, u.password)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {u.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-white text-sm font-medium">{u.firstName} {u.lastName}</p>
                              <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium border ${ROLE_COLORS[u.role] ?? ""}`}>{u.role}</span>
                              {u.mfaEnabled && <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-1.5 py-0.5">🔐 MFA</span>}
                            </div>
                            <p className="text-white/35 text-xs truncate">{u.email} · pw: {u.password}</p>
                          </div>
                        </button>

                        {/* Dot permission grid */}
                        <div className="flex items-center gap-1 shrink-0">
                          {(access?.perms ?? []).map((perm, i) => (
                            <div
                              key={i}
                              title={`${MODULES[i]}: ${perm}`}
                              className={`size-3 rounded-full ${PERM_DOT[perm as PermLevel]} transition-transform hover:scale-150`}
                            />
                          ))}
                        </div>

                        {/* Expand toggle */}
                        <button
                          onClick={() => setExpandedRole(isExpanded ? null : u.id)}
                          className="text-white/20 hover:text-white/60 transition-colors ml-1"
                          title="See access details"
                        >
                          <ChevronRight className={`size-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                      </div>

                      {/* Expanded access detail */}
                      {isExpanded && access && (
                        <div className="px-4 pb-3 pt-1 bg-white/[0.02]">
                          <p className="text-[10px] text-white/40 mb-2">{access.label}</p>
                          <div className="grid grid-cols-4 gap-1">
                            {MODULES.map((mod, i) => {
                              const perm = access.perms[i] as PermLevel;
                              return (
                                <div
                                  key={mod}
                                  className={`rounded-md px-2 py-1 text-[10px] flex items-center gap-1 ${
                                    perm === "Full" ? "bg-green-500/15 text-green-400" :
                                    perm === "Read" ? "bg-yellow-500/15 text-yellow-400" :
                                    "bg-white/5 text-white/20"
                                  }`}
                                >
                                  {MODULE_ICONS[i]}
                                  <span>{mod}</span>
                                </div>
                              );
                            })}
                          </div>
                          {u.mfaEnabled && (
                            <p className="text-[10px] text-blue-400/70 mt-2">
                              🔐 MFA code: <strong className="font-mono">{u.mfaCode}</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
