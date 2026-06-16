"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Plus, Phone, PhoneOff, PhoneCall, Mic, Volume2, VolumeX,
  CheckCircle, User, Calendar, Sparkles, X, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAppointmentsStore } from "@/stores/appointmentsStore";
import { usePatientsStore } from "@/stores/patientsStore";
import { useDoctorsStore, isDoctorAvailableAt } from "@/stores/doctorsStore";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { Appointment } from "@/types";
import { useCanEdit } from "@/hooks/usePermission";

const TYPE_COLORS: Record<string, string> = {
  Cleaning: "#4F46E5", Exam: "#06B6D4", Filling: "#10B981",
  "Root Canal": "#EF4444", Crown: "#F59E0B", Extraction: "#8B5CF6",
  Implant: "#EC4899", Orthodontic: "#14B8A6", Emergency: "#F97316",
};

/* ─── CALL SCRIPT ───────────────────────────────────────────────────────────
   Pre-written full dialogue. AI = receptionist, Patient = caller.
   delay = ms pause before this line starts speaking.
────────────────────────────────────────────────────────────────────────────── */
const CALL_SCRIPT = [
  { speaker: "ai" as const,      text: "Thank you for calling SmileCare Dental! This is Nova, your AI receptionist. How can I help you today?", delay: 500 },
  { speaker: "patient" as const, text: "Hi, I'd like to schedule an appointment. I'm a new patient.", delay: 800 },
  { speaker: "ai" as const,      text: "Wonderful! We'd love to welcome you. May I have your full name please?", delay: 600 },
  { speaker: "patient" as const, text: "Sure, my name is Emily Thompson.", delay: 700 },
  { speaker: "ai" as const,      text: "Thank you Emily! And your date of birth so I can create your record?", delay: 500 },
  { speaker: "patient" as const, text: "March 14th, 1992.", delay: 600 },
  { speaker: "ai" as const,      text: "Perfect. Do you have dental insurance? If so, which plan?", delay: 500 },
  { speaker: "patient" as const, text: "Yes, I have Aetna PPO through my employer. My member ID is AET-928374.", delay: 700 },
  { speaker: "ai" as const,      text: "Great! Let me verify your Aetna coverage. One moment please.", delay: 400 },
  { speaker: "ai" as const,      text: "Your coverage is active with full benefits for preventive care. What type of appointment are you looking for?", delay: 600 },
  { speaker: "patient" as const, text: "I'd like a cleaning and check-up exam.", delay: 700 },
  { speaker: "ai" as const,      text: "Excellent choice! What date and time works best for you?", delay: 500 },
  { speaker: "patient" as const, text: "How about this Friday morning if you have something available?", delay: 700 },
  { speaker: "ai" as const,      text: "Let me check our doctors' availability for Friday morning... I see Dr. James Chen is open and not on leave that day. I have Friday June 20th at 10 AM available with him. Does that work for you?", delay: 600 },
  { speaker: "patient" as const, text: "Yes, that's perfect!", delay: 600 },
  { speaker: "ai" as const,      text: "Wonderful! I'm booking that right now. You're all set for a new patient exam and cleaning on Friday June 20th at 10 AM with Dr. Chen.", delay: 500 },
  { speaker: "ai" as const,      text: "You'll receive a confirmation text shortly, and a reminder the morning of your appointment. Is there anything else I can help you with?", delay: 400 },
  { speaker: "patient" as const, text: "No, that's everything. Thank you so much!", delay: 700 },
  { speaker: "ai" as const,      text: "You're very welcome, Emily! We look forward to meeting you on Friday. Have a wonderful day!", delay: 500 },
];

const BOOKING_RESULT = {
  patientName: "Emily Thompson",
  dob: "March 14, 1992",
  insurance: "Aetna PPO · AET-928374",
  type: "Cleaning" as const,
  date: "Friday, June 20 · 10:00 AM",
  provider: "Dr. James Chen",
  chair: "Chair 2",
};

/* ─── Speak with Web Speech API ─────────────────────────────────────────────── */
function speak(text: string, opts: { pitch?: number; rate?: number; voice?: SpeechSynthesisVoice | null; onEnd?: () => void }) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    opts.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.pitch = opts.pitch ?? 1;
  utt.rate = opts.rate ?? 0.95;
  utt.volume = 1;
  if (opts.voice) utt.voice = opts.voice;
  utt.onend = () => opts.onEnd?.();
  utt.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(utt);
}

/* ─── AI Call Widget ─────────────────────────────────────────────────────────── */
type CallPhase = "ringing" | "active" | "done" | "ended";

export function AICallWidget({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: () => void;
}) {
  const [phase, setPhase] = useState<CallPhase>("ringing");
  const [messages, setMessages] = useState<{ speaker: "ai" | "patient"; text: string; done: boolean }[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<"ai" | "patient" | null>(null);
  const [activeText, setActiveText] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [scriptIdx, setScriptIdx] = useState(0);
  const [aiVoice, setAiVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [patientVoice, setPatientVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [waveAnim, setWaveAnim] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);
  const mutedRef = useRef(false);

  // Keep mutedRef in sync
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Load voices
  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      // AI: prefer female English voice (higher pitch)
      const ai = voices.find((v) => v.lang.startsWith("en") && /female|zira|samantha|victoria|karen|moira|google us english|microsoft zira/i.test(v.name))
        ?? voices.find((v) => v.lang.startsWith("en"))
        ?? null;
      // Patient: different voice if possible
      const patient = voices.find((v) => v.lang.startsWith("en") && v !== ai)
        ?? ai;
      setAiVoice(ai);
      setPatientVoice(patient);
    };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  // Ring sound using Web Audio
  const playRing = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const ring = (start: number) => {
        [0, 0.05].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = offset === 0 ? 480 : 620;
          gain.gain.setValueAtTime(0, ctx.currentTime + start);
          gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + start + 0.05);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + start + 0.35);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + 0.4);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start + offset);
          osc.stop(ctx.currentTime + start + offset + 0.4);
        });
      };
      [0, 0.8, 1.6, 2.8, 3.6].forEach(ring);
      setTimeout(() => { ctx.close(); }, 5000);
    } catch (_) {}
  }, []);

  // Start ringing, then connect
  useEffect(() => {
    playRing();
    const t = setTimeout(() => {
      setPhase("active");
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }, 3500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play the script sequentially once active
  useEffect(() => {
    if (phase !== "active" || runningRef.current) return;
    runningRef.current = true;
    playLine(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const playLine = useCallback((idx: number) => {
    if (idx >= CALL_SCRIPT.length) {
      // All done
      setActiveSpeaker(null);
      setWaveAnim(false);
      setPhase("done");
      if (timerRef.current) clearInterval(timerRef.current);
      onCreate();
      return;
    }

    const line = CALL_SCRIPT[idx];

    const doSpeak = () => {
      setActiveSpeaker(line.speaker);
      setActiveText(line.text);
      setWaveAnim(true);

      // Show message bubble immediately
      setMessages((prev) => [...prev, { speaker: line.speaker, text: line.text, done: false }]);

      if (mutedRef.current) {
        // Skip TTS if muted — estimate duration from text length
        const estimatedMs = Math.max(1000, line.text.length * 45);
        setTimeout(() => {
          setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, done: true } : m));
          setWaveAnim(false);
          setTimeout(() => playLine(idx + 1), CALL_SCRIPT[idx + 1]?.delay ?? 500);
        }, estimatedMs);
        return;
      }

      const voice = line.speaker === "ai" ? aiVoice : patientVoice;
      speak(line.text, {
        voice,
        pitch: line.speaker === "ai" ? 1.15 : 0.9,
        rate: line.speaker === "ai" ? 0.92 : 0.88,
        onEnd: () => {
          setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, done: true } : m));
          setWaveAnim(false);
          const nextDelay = CALL_SCRIPT[idx + 1]?.delay ?? 500;
          setTimeout(() => playLine(idx + 1), nextDelay);
        },
      });
    };

    setTimeout(doSpeak, idx === 0 ? 300 : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiVoice, patientVoice]);

  // Toggle mute — cancel current speech, it will resume via text length estimate fallback
  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (next) window.speechSynthesis?.cancel();
      return next;
    });
  };

  const handleEnd = () => {
    window.speechSynthesis?.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  useEffect(() => () => { window.speechSynthesis?.cancel(); if (timerRef.current) clearInterval(timerRef.current); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const progress = Math.min(100, (messages.length / CALL_SCRIPT.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "92vh" }}>

        {/* ── Call Header ── */}
        <div className={`px-5 py-4 text-white transition-colors ${
          phase === "ringing" ? "bg-gradient-to-r from-yellow-500 to-amber-500"
          : phase === "done" ? "bg-gradient-to-r from-green-600 to-emerald-600"
          : "bg-gradient-to-r from-green-700 to-green-600"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Avatar with wave rings */}
              <div className="relative">
                <div className="size-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">🤖</div>
                {waveAnim && activeSpeaker === "ai" && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
                    <div className="absolute -inset-1.5 rounded-full border border-white/20 animate-ping" style={{ animationDelay: "0.3s" }} />
                  </>
                )}
                {phase === "active" && <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-green-400 border-2 border-green-700" />}
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Nova — AI Receptionist</p>
                <p className="text-xs text-white/70">SmileCare Dental · (555) 100-2200</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {phase === "ringing" && <><span className="size-1.5 rounded-full bg-yellow-300 animate-pulse" /><span className="text-xs text-white/80">Ringing…</span></>}
                  {phase === "active" && <><span className="size-1.5 rounded-full bg-green-300 animate-pulse" /><span className="text-xs text-white/80">Live · {fmt(callDuration)}</span></>}
                  {phase === "done" && <><CheckCircle className="size-3.5 text-green-200" /><span className="text-xs text-white/90">Call complete · {fmt(callDuration)}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleMute}
                className={`size-9 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-red-500/80" : "bg-white/20 hover:bg-white/30"}`}
                title={muted ? "Unmute" : "Mute"}>
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <button onClick={handleEnd}
                className="size-9 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center"
                title="End call">
                <PhoneOff className="size-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-white/50 mt-1">
            <span>Gathering info</span>
            <span>Booking</span>
            <span>Complete</span>
          </div>
        </div>

        {/* ── Active Speaker Indicator ── */}
        {phase === "active" && activeSpeaker && (
          <div className={`px-4 py-2 flex items-center gap-3 border-b border-border ${
            activeSpeaker === "ai" ? "bg-green-50 dark:bg-green-950/20" : "bg-blue-50 dark:bg-blue-950/20"
          }`}>
            <div className={`text-sm font-medium ${activeSpeaker === "ai" ? "text-green-700 dark:text-green-400" : "text-blue-700 dark:text-blue-400"}`}>
              {activeSpeaker === "ai" ? "🤖 Nova speaking" : "👤 Patient speaking"}
            </div>
            {/* Animated bars */}
            <div className="flex items-center gap-0.5 h-4">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={`w-0.5 rounded-full ${activeSpeaker === "ai" ? "bg-green-500" : "bg-blue-500"}`}
                  style={{
                    height: waveAnim ? `${30 + Math.sin(i * 0.8) * 50 + Math.random() * 20}%` : "20%",
                    animation: waveAnim ? `wave-bar ${0.4 + (i % 4) * 0.1}s ease-in-out infinite alternate` : "none",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground truncate flex-1">&ldquo;{activeText.slice(0, 60)}{activeText.length > 60 ? "…" : ""}&rdquo;</p>
          </div>
        )}

        {/* ── Transcript ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-muted/10" style={{ maxHeight: "380px" }}>
          {phase === "ringing" && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="relative mb-6">
                <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <PhoneCall className="size-9 text-green-600" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-800 animate-ping" />
                <div className="absolute -inset-3 rounded-full border-2 border-green-100 dark:border-green-900 animate-ping" style={{ animationDelay: "0.4s" }} />
              </div>
              <p className="font-semibold text-base">Calling Nova…</p>
              <p className="text-sm text-muted-foreground mt-1">AI Receptionist is answering</p>
              <div className="flex gap-1.5 mt-4">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.speaker === "patient" ? "flex-row-reverse" : ""}`}>
              <div className={`size-8 rounded-full shrink-0 flex items-center justify-center text-base mt-0.5 ${
                msg.speaker === "ai" ? "bg-green-100 dark:bg-green-900/40" : "bg-blue-100 dark:bg-blue-900/40"
              }`}>
                {msg.speaker === "ai" ? "🤖" : "👤"}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.speaker === "ai"
                  ? "bg-card border border-border rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              }`}>
                <p className={`text-[10px] font-semibold mb-0.5 ${msg.speaker === "ai" ? "text-green-600 dark:text-green-400" : "text-primary-foreground/70"}`}>
                  {msg.speaker === "ai" ? "Nova (AI)" : "Patient"}
                </p>
                {msg.text}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* ── Done: Booking Summary ── */}
        {phase === "done" && (
          <div className="mx-4 mb-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="size-5 text-green-600" />
              <p className="font-bold text-green-700 dark:text-green-400">Appointment Booked by AI</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground"><User className="size-3" /> Patient</div>
              <div className="font-semibold">{BOOKING_RESULT.patientName}</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="size-3" /> Date & Time</div>
              <div className="font-semibold">{BOOKING_RESULT.date}</div>
              <div className="text-muted-foreground">Service</div>
              <div className="font-semibold">New Patient Exam + Cleaning</div>
              <div className="text-muted-foreground">Provider</div>
              <div className="font-semibold">{BOOKING_RESULT.provider}</div>
              <div className="text-muted-foreground">Insurance</div>
              <div className="font-semibold">{BOOKING_RESULT.insurance}</div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          {phase !== "done" ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="size-3.5" />
                Fully automated · Nova handles the entire call
              </div>
              <Button size="sm" variant="destructive" onClick={handleEnd} className="shrink-0">
                <PhoneOff className="size-3.5" /> End Call
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Appointment added to calendar</p>
              <Button size="sm" onClick={onClose} className="shrink-0">
                <CheckCircle className="size-3.5" /> View Calendar
              </Button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wave-bar {
          from { height: 15%; }
          to   { height: 90%; }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Appointments Page ────────────────────────────────────────────────── */
export default function AppointmentsPage() {
  const { appointments, create } = useAppointmentsStore();
  const { patients } = usePatientsStore();
  const { doctors } = useDoctorsStore();
  const canEdit = useCanEdit("Appointments");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [form, setForm] = useState({
    patientId: "", dentistId: doctors[0]?.id ?? "", datetime: "", type: "Cleaning", chair: "Chair 1", notes: "",
  });

  const selectedDoctor = doctors.find((d) => d.id === form.dentistId) ?? null;
  const availability = useMemo(() => {
    if (!selectedDoctor || !form.datetime) return null;
    return isDoctorAvailableAt(selectedDoctor, new Date(form.datetime).toISOString(), appointments);
  }, [selectedDoctor, form.datetime, appointments]);

  const events = appointments.map((a) => ({
    id: a.id,
    title: `${a.patientName} — ${a.type}`,
    start: a.startTime,
    end: a.endTime,
    backgroundColor: TYPE_COLORS[a.type] ?? "#4F46E5",
    borderColor: "transparent",
    extendedProps: a,
  }));

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 5);

  const handleCreate = useCallback(() => {
    if (!form.patientId || !form.datetime || !form.dentistId) return;
    const patient = patients.find((p) => p.id === form.patientId);
    const doctor = doctors.find((d) => d.id === form.dentistId);
    if (!patient || !doctor) return;
    const start = new Date(form.datetime);
    const check = isDoctorAvailableAt(doctor, start.toISOString(), appointments);
    if (!check.available) {
      toast.error(check.reason ?? "Doctor is not available at this time");
      return;
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    create({
      id: `APT-${Date.now()}`,
      patientId: form.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      dentistId: doctor.id,
      dentistName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      clinicId: doctor.clinicIds[0] ?? "clinic-1a",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      type: form.type as Appointment["type"],
      status: "Scheduled",
      chair: form.chair,
      notes: form.notes,
      insuranceVerified: false,
      preAuthRequired: false,
      estimatedRevenue: 200,
      createdBy: doctor.id,
      createdAt: new Date().toISOString(),
    });
    setCreateOpen(false);
    setForm({ patientId: "", dentistId: doctors[0]?.id ?? "", datetime: "", type: "Cleaning", chair: "Chair 1", notes: "" });
    setPatientSearch("");
  }, [form, patients, doctors, appointments, create]);

  const handleCallCreate = useCallback(() => {
    const start = new Date("2025-06-20T10:00:00");
    const end = new Date("2025-06-20T11:00:00");
    const doctor = doctors.find((d) => d.id === "STF-0002");
    if (doctor) {
      const check = isDoctorAvailableAt(doctor, start.toISOString(), appointments);
      if (!check.available) {
        toast.error(`Nova couldn't book: ${check.reason}`);
        return;
      }
    }
    create({
      id: `APT-${Date.now()}`,
      patientId: "PAT-NEW-001",
      patientName: "Emily Thompson",
      dentistId: "STF-0002",
      dentistName: "Dr. James Chen",
      clinicId: "clinic-1a",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      type: "Cleaning",
      status: "Scheduled",
      chair: "Chair 2",
      notes: "New patient. Booked via AI Receptionist call. Nova checked Dr. Chen's availability before booking. Insurance: Aetna PPO (AET-928374). DOB: March 14, 1992.",
      insuranceVerified: true,
      preAuthRequired: false,
      estimatedRevenue: 280,
      createdBy: "Nova-AI",
      createdAt: new Date().toISOString(),
    });
    toast.success("Nova verified Dr. Chen was available, then booked Emily Thompson — Jun 20 at 10 AM");
  }, [create, doctors, appointments]);

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Appointments</h2>
          <p className="text-sm text-muted-foreground">{appointments.length} total appointments</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setCallOpen(true)}
              className="border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 gap-2"
            >
              <div className="relative">
                <Phone className="size-4" />
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              Book via AI Call
              <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-1.5 py-0.5 font-medium">AI</span>
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Nova banner */}
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-900/40 px-4 py-3">
        <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-lg shrink-0">🤖</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Nova — AI Receptionist is Active</p>
          <p className="text-xs text-green-700/70 dark:text-green-400/70">
            Handling inbound calls 24/7 · 47 appointments booked this month · Press &ldquo;Book via AI Call&rdquo; to hear a real call
          </p>
        </div>
        <Button size="sm" variant="ghost" className="text-green-700 dark:text-green-400 shrink-0" onClick={() => setCallOpen(true)}>
          <Sparkles className="size-3.5" /> Play call
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[calc(100vh-280px)] p-4">
            <FullCalendarWrapper
              events={events}
              onEventClick={(info: { event: { extendedProps: Appointment } }) => setSelectedAppt(info.event.extendedProps)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointment Detail Sheet */}
      <Sheet open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
        <SheetContent side="right" className="w-96">
          <SheetHeader><SheetTitle>Appointment Details</SheetTitle></SheetHeader>
          {selectedAppt && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="font-semibold text-lg">{selectedAppt.patientName}</p>
                <p className="text-sm text-muted-foreground">{selectedAppt.type}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span>{formatDateTime(selectedAppt.startTime)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">End</span><span>{formatDateTime(selectedAppt.endTime)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dentist</span><span>{selectedAppt.dentistName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Chair</span><span>{selectedAppt.chair}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={selectedAppt.status} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Est. Revenue</span><span>{formatCurrency(selectedAppt.estimatedRevenue)}</span></div>
                {selectedAppt.notes && <div><span className="text-muted-foreground">Notes</span><p className="mt-1 text-xs bg-muted rounded p-2">{selectedAppt.notes}</p></div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">Confirm</Button>
                <Button size="sm" variant="outline" className="flex-1">Reschedule</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Appointment Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-96">
          <SheetHeader><SheetTitle>New Appointment</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Patient</label>
              <Input placeholder="Search patient name..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
              {patientSearch && filteredPatients.length > 0 && (
                <div className="mt-1 border border-border rounded-lg overflow-hidden shadow-sm">
                  {filteredPatients.map((p) => (
                    <button key={p.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => { setForm((f) => ({ ...f, patientId: p.id })); setPatientSearch(`${p.firstName} ${p.lastName}`); }}>
                      {p.firstName} {p.lastName} — {p.phone}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Doctor</label>
              <select value={form.dentistId} onChange={(e) => setForm((f) => ({ ...f, dentistId: e.target.value }))}
                className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm">
                {doctors.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.status === "On Leave" || d.status === "Off Duty"}>
                    Dr. {d.firstName} {d.lastName} — {d.specialties[0]}{d.status === "On Leave" || d.status === "Off Duty" ? ` (${d.status})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date &amp; Time</label>
              <Input type="datetime-local" value={form.datetime} onChange={(e) => setForm((f) => ({ ...f, datetime: e.target.value }))} />
              {availability && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${availability.available ? "text-green-600" : "text-red-600"}`}>
                  {availability.available ? "✓ Dr. " + selectedDoctor?.lastName + " is available at this time" : availability.reason}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm">
                {["Cleaning", "Exam", "Filling", "Root Canal", "Crown", "Extraction", "Implant", "Orthodontic", "Emergency"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Chair</label>
              <select value={form.chair} onChange={(e) => setForm((f) => ({ ...f, chair: e.target.value }))}
                className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm">
                {["Chair 1", "Chair 2", "Chair 3", "Chair 4", "Chair 5"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" placeholder="Optional notes..." />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!!availability && !availability.available}>Schedule Appointment</Button>
          </div>
        </SheetContent>
      </Sheet>

      {callOpen && <AICallWidget onClose={() => setCallOpen(false)} onCreate={handleCallCreate} />}
    </div>
  );
}

function FullCalendarWrapper({ events, onEventClick }: { events: object[]; onEventClick: (info: { event: { extendedProps: Appointment } }) => void }) {
  const [CalComponent, setCalComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [plugins, setPlugins] = useState<unknown[]>([]);

  useEffect(() => {
    Promise.all([
      import("@fullcalendar/react"),
      import("@fullcalendar/daygrid"),
      import("@fullcalendar/timegrid"),
      import("@fullcalendar/interaction"),
    ]).then(([fc, dg, tg, int]) => {
      setCalComponent(() => fc.default as any);
      setPlugins([dg.default, tg.default, int.default]);
    });
  }, []);

  if (!CalComponent || plugins.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading calendar…</div>;
  }

  return (
    <CalComponent
      plugins={plugins}
      initialView="timeGridWeek"
      headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
      events={events}
      eventClick={onEventClick}
      height="100%"
      eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: "short" }}
    />
  );
}
