"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Smartphone, CheckCircle, AlertCircle, RefreshCw,
  Users, Calendar, FileText, CreditCard, BarChart2, Settings, Bot, Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

/* ─── Permission matrix per role ──────────────────────────────────────────── */
const ROLE_PERMISSIONS: Record<string, { module: string; icon: React.ReactNode; level: "Full" | "Read" | "None" }[]> = {
  "Super Admin": [
    { module: "Patients", icon: <Users className="size-3" />, level: "Full" },
    { module: "Appointments", icon: <Calendar className="size-3" />, level: "Full" },
    { module: "Clinical", icon: <Stethoscope className="size-3" />, level: "Full" },
    { module: "Claims", icon: <FileText className="size-3" />, level: "Full" },
    { module: "Billing", icon: <CreditCard className="size-3" />, level: "Full" },
    { module: "Analytics", icon: <BarChart2 className="size-3" />, level: "Full" },
    { module: "Settings", icon: <Settings className="size-3" />, level: "Full" },
    { module: "AI Workforce", icon: <Bot className="size-3" />, level: "Full" },
  ],
  "DSO Admin": [
    { module: "Patients", icon: <Users className="size-3" />, level: "Full" },
    { module: "Appointments", icon: <Calendar className="size-3" />, level: "Full" },
    { module: "Clinical", icon: <Stethoscope className="size-3" />, level: "Full" },
    { module: "Claims", icon: <FileText className="size-3" />, level: "Full" },
    { module: "Billing", icon: <CreditCard className="size-3" />, level: "Full" },
    { module: "Analytics", icon: <BarChart2 className="size-3" />, level: "Full" },
    { module: "Settings", icon: <Settings className="size-3" />, level: "Full" },
    { module: "AI Workforce", icon: <Bot className="size-3" />, level: "Full" },
  ],
  "Clinic Owner": [
    { module: "Patients", icon: <Users className="size-3" />, level: "Full" },
    { module: "Appointments", icon: <Calendar className="size-3" />, level: "Full" },
    { module: "Clinical", icon: <Stethoscope className="size-3" />, level: "Full" },
    { module: "Claims", icon: <FileText className="size-3" />, level: "Full" },
    { module: "Billing", icon: <CreditCard className="size-3" />, level: "Full" },
    { module: "Analytics", icon: <BarChart2 className="size-3" />, level: "Full" },
    { module: "Settings", icon: <Settings className="size-3" />, level: "Read" },
    { module: "AI Workforce", icon: <Bot className="size-3" />, level: "Full" },
  ],
  Dentist: [
    { module: "Patients", icon: <Users className="size-3" />, level: "Full" },
    { module: "Appointments", icon: <Calendar className="size-3" />, level: "Full" },
    { module: "Clinical", icon: <Stethoscope className="size-3" />, level: "Full" },
    { module: "Claims", icon: <FileText className="size-3" />, level: "Read" },
    { module: "Billing", icon: <CreditCard className="size-3" />, level: "Read" },
    { module: "Analytics", icon: <BarChart2 className="size-3" />, level: "Read" },
    { module: "Settings", icon: <Settings className="size-3" />, level: "None" },
    { module: "AI Workforce", icon: <Bot className="size-3" />, level: "None" },
  ],
  "Front Desk": [
    { module: "Patients", icon: <Users className="size-3" />, level: "Read" },
    { module: "Appointments", icon: <Calendar className="size-3" />, level: "Full" },
    { module: "Clinical", icon: <Stethoscope className="size-3" />, level: "None" },
    { module: "Claims", icon: <FileText className="size-3" />, level: "Read" },
    { module: "Billing", icon: <CreditCard className="size-3" />, level: "None" },
    { module: "Analytics", icon: <BarChart2 className="size-3" />, level: "None" },
    { module: "Settings", icon: <Settings className="size-3" />, level: "None" },
    { module: "AI Workforce", icon: <Bot className="size-3" />, level: "None" },
  ],
  "Insurance Coordinator": [
    { module: "Patients", icon: <Users className="size-3" />, level: "Read" },
    { module: "Appointments", icon: <Calendar className="size-3" />, level: "Read" },
    { module: "Clinical", icon: <Stethoscope className="size-3" />, level: "None" },
    { module: "Claims", icon: <FileText className="size-3" />, level: "Full" },
    { module: "Billing", icon: <CreditCard className="size-3" />, level: "Read" },
    { module: "Analytics", icon: <BarChart2 className="size-3" />, level: "Read" },
    { module: "Settings", icon: <Settings className="size-3" />, level: "None" },
    { module: "AI Workforce", icon: <Bot className="size-3" />, level: "None" },
  ],
  "Billing Manager": [
    { module: "Patients", icon: <Users className="size-3" />, level: "Read" },
    { module: "Appointments", icon: <Calendar className="size-3" />, level: "None" },
    { module: "Clinical", icon: <Stethoscope className="size-3" />, level: "None" },
    { module: "Claims", icon: <FileText className="size-3" />, level: "Full" },
    { module: "Billing", icon: <CreditCard className="size-3" />, level: "Full" },
    { module: "Analytics", icon: <BarChart2 className="size-3" />, level: "Full" },
    { module: "Settings", icon: <Settings className="size-3" />, level: "None" },
    { module: "AI Workforce", icon: <Bot className="size-3" />, level: "None" },
  ],
};

const LEVEL_STYLE = {
  Full: "bg-green-500/20 text-green-400 border border-green-500/30",
  Read: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  None: "bg-white/5 text-white/20 border border-white/10",
};

const LEVEL_LABEL = {
  Full: "✅ Full",
  Read: "🟡 View",
  None: "⬜ None",
};

export default function MFAPage() {
  const router = useRouter();
  const { pendingMfaUser, verifyMfa, logout, user } = useAuthStore();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!pendingMfaUser && !user) {
      router.replace("/login");
    } else if (pendingMfaUser) {
      inputRefs.current[0]?.focus();
    }
  }, [pendingMfaUser, user, router]);

  if (!pendingMfaUser && !user) return null;
  if (!pendingMfaUser) return null;

  const rolePerms = ROLE_PERMISSIONS[pendingMfaUser.role] ?? ROLE_PERMISSIONS["Front Desk"];

  const handleDigit = (idx: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    setError("");
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === 6) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code ?? digits.join("");
    if (finalCode.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 800));
    const result = verifyMfa(finalCode);
    setLoading(false);
    if (result.success) {
      toast.success(`Welcome back, ${pendingMfaUser.firstName}!`);
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Invalid code");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setResending(false);
    setResent(true);
    toast.success(`Verification code resent to ${pendingMfaUser.email}`);
    setTimeout(() => setResent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to login
        </button>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl text-center">
          {/* Icon */}
          <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="size-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Two-Factor Authentication</h2>
          <p className="text-white/50 text-sm mb-1">Enter the 6-digit code sent to</p>
          <p className="text-white/80 text-sm font-medium mb-5">{pendingMfaUser.email}</p>

          {/* Demo code hint */}
          <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2.5 text-sm text-blue-300 mb-5 text-left">
            <Shield className="size-4 shrink-0 text-blue-400" />
            <span>
              Demo code for <strong>{pendingMfaUser.firstName}</strong>:{" "}
              <strong className="font-mono tracking-widest text-base">{pendingMfaUser.mfaCode}</strong>
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400 mb-4">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* 6-digit input */}
          <div className="flex gap-2.5 justify-center mb-5">
            {digits.map((d, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`size-12 rounded-xl border-2 bg-white/10 text-white text-center text-xl font-bold outline-none transition-all
                  ${d ? "border-primary bg-primary/10" : "border-white/20"}
                  ${error ? "border-red-500/60" : ""}
                  focus:border-primary focus:bg-primary/5`}
              />
            ))}
          </div>

          <Button
            onClick={() => handleVerify()}
            className="w-full h-11"
            disabled={loading || digits.some((d) => !d)}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="size-4" /> Verify &amp; Sign In
              </span>
            )}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-white/40">Didn&apos;t receive a code?</span>
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {resending ? <><RefreshCw className="size-3 animate-spin" /> Sending...</> : resent ? <><CheckCircle className="size-3" /> Sent!</> : "Resend code"}
            </button>
          </div>
        </div>

        {/* Who is signing in + Access Summary */}
        <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          {/* User header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <div className="size-9 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {pendingMfaUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{pendingMfaUser.firstName} {pendingMfaUser.lastName}</p>
              <p className="text-white/40 text-xs">{pendingMfaUser.role} · {pendingMfaUser.orgName}</p>
            </div>
            <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 font-medium shrink-0">
              {pendingMfaUser.role}
            </span>
          </div>

          {/* Access grid */}
          <div className="px-4 pt-3 pb-4">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Your access after signing in</p>
            <div className="grid grid-cols-2 gap-2">
              {rolePerms.map((p) => (
                <div
                  key={p.module}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${LEVEL_STYLE[p.level]}`}
                >
                  <span className="flex items-center gap-1.5">
                    {p.icon}
                    <span className={p.level === "None" ? "opacity-30" : ""}>{p.module}</span>
                  </span>
                  <span className="font-medium">{LEVEL_LABEL[p.level]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-[10px] text-green-400"><span className="size-2 rounded-full bg-green-500/60" /> Full access</div>
              <div className="flex items-center gap-1.5 text-[10px] text-yellow-400"><span className="size-2 rounded-full bg-yellow-500/60" /> View only</div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/30"><span className="size-2 rounded-full bg-white/10" /> No access</div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/30">
          <Shield className="size-3" />
          <span>Secured with enterprise MFA · HIPAA compliant</span>
        </div>
      </div>
    </div>
  );
}
