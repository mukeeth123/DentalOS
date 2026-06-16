"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Play, Pause, Phone, PhoneIncoming, PhoneOutgoing,
  PhoneMissed, User, Calendar, FileText, ChevronDown,
  ChevronUp, Download, Volume2, VolumeX, Square,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAgentStore } from "@/stores/agentStore";
import { formatDate } from "@/lib/utils";
import { PdfReport } from "@/lib/pdf";

/* ─── Mock Call Recordings ─────────────────────────────────────────────────── */
const CALL_RECORDINGS = [
  {
    id: "call-001",
    direction: "inbound" as const,
    callerName: "Emily Thompson",
    callerPhone: "(555) 234-8901",
    date: "2025-06-15",
    time: "10:47 AM",
    duration: "3:24",
    durationSec: 204,
    outcome: "Appointment Booked",
    outcomeType: "success" as const,
    summary: "New patient inquiry. Booked cleaning + exam for June 20 at 10 AM. Insurance verified (Aetna PPO). Patient added to system as PAT-0089.",
    patientCreated: { id: "PAT-0089", name: "Emily Thompson", dob: "1992-03-14", insurance: "Aetna PPO", memberId: "AET-928374" },
    appointmentBooked: { date: "June 20, 2025", time: "10:00 AM", type: "New Patient Exam + Cleaning", provider: "Dr. James Chen" },
    transcript: [
      { speaker: "AI", text: "Thank you for calling SmileCare Dental, this is Nova your AI receptionist. How can I help you today?" },
      { speaker: "Patient", text: "Hi, I'm looking to schedule an appointment. I'm a new patient." },
      { speaker: "AI", text: "Wonderful! We'd love to welcome you. Can I get your full name and date of birth?" },
      { speaker: "Patient", text: "Emily Thompson, March 14th, 1992." },
      { speaker: "AI", text: "Perfect, Emily. Do you have dental insurance?" },
      { speaker: "Patient", text: "Yes, Aetna PPO through my employer. Member ID is AET-928374." },
      { speaker: "AI", text: "I'm checking your coverage now... Great news! You have full coverage for preventive care. We have an opening on June 20th at 10 AM with Dr. Chen for a new patient exam and cleaning. Does that work?" },
      { speaker: "Patient", text: "That's perfect, yes!" },
      { speaker: "AI", text: "Excellent! I've booked that for you. You'll receive a confirmation text shortly. Is there anything else I can help you with?" },
      { speaker: "Patient", text: "No, that's great. Thank you!" },
      { speaker: "AI", text: "You're welcome, Emily! We look forward to seeing you on June 20th. Have a great day!" },
    ],
  },
  {
    id: "call-002",
    direction: "inbound" as const,
    callerName: "Marcus Williams",
    callerPhone: "(555) 387-2019",
    date: "2025-06-15",
    time: "10:31 AM",
    duration: "2:11",
    durationSec: 131,
    outcome: "Insurance Verified",
    outcomeType: "success" as const,
    summary: "Existing patient Marcus Williams (PAT-0043) called to verify insurance before tomorrow's crown appointment. Delta Dental active, $1,400 remaining benefit confirmed.",
    patientCreated: null,
    appointmentBooked: null,
    transcript: [
      { speaker: "AI", text: "SmileCare Dental, this is Nova. How can I help?" },
      { speaker: "Patient", text: "Hi, I have an appointment tomorrow and wanted to check if my insurance is good." },
      { speaker: "AI", text: "Of course! Can I get your name and date of birth to pull up your account?" },
      { speaker: "Patient", text: "Marcus Williams, August 3rd, 1985." },
      { speaker: "AI", text: "I found your account, Marcus. You're in for a crown prep tomorrow at 2 PM with Dr. Chen. Let me check your Delta Dental benefits... Your plan is active. You have $1,400 remaining in annual benefits. The crown will be covered at 50% after deductible. Your estimated out-of-pocket is approximately $340." },
      { speaker: "Patient", text: "That sounds about right. Great, thanks." },
      { speaker: "AI", text: "You're all set! We'll see you tomorrow at 2 PM. I'll send you a reminder an hour before." },
    ],
  },
  {
    id: "call-003",
    direction: "outbound" as const,
    callerName: "Patricia Nguyen",
    callerPhone: "(555) 491-3302",
    date: "2025-06-15",
    time: "10:18 AM",
    duration: "1:47",
    durationSec: 107,
    outcome: "Recall Reminder Sent",
    outcomeType: "success" as const,
    summary: "Outbound recall call. Patricia is 14 months overdue for cleaning. Rescheduled for July 8 at 9 AM. Patient was grateful for the reminder.",
    patientCreated: null,
    appointmentBooked: { date: "July 8, 2025", time: "9:00 AM", type: "Preventive Cleaning + Exam", provider: "Dr. James Chen" },
    transcript: [
      { speaker: "AI", text: "Hi, may I speak with Patricia Nguyen?" },
      { speaker: "Patient", text: "This is she." },
      { speaker: "AI", text: "Hi Patricia, this is Nova calling from SmileCare Dental. Our records show it's been about 14 months since your last cleaning. We wanted to reach out and get you scheduled. Do you have a few minutes?" },
      { speaker: "Patient", text: "Oh wow, has it been that long? Yes, I should come in." },
      { speaker: "AI", text: "Absolutely! We have an opening July 8th at 9 AM for a cleaning and exam with Dr. Chen. Would that work for you?" },
      { speaker: "Patient", text: "July 8th works. Sign me up!" },
      { speaker: "AI", text: "Done! I've booked you for July 8th at 9 AM. You'll get a confirmation text. Thanks for keeping up with your dental health, Patricia!" },
    ],
  },
  {
    id: "call-004",
    direction: "inbound" as const,
    callerName: "Unknown Caller",
    callerPhone: "(555) 029-4481",
    date: "2025-06-15",
    time: "09:55 AM",
    duration: "0:43",
    durationSec: 43,
    outcome: "Escalated to Staff",
    outcomeType: "warning" as const,
    summary: "Patient called with dental emergency — severe toothache and visible swelling. AI correctly escalated to front desk immediately for same-day emergency slot.",
    patientCreated: null,
    appointmentBooked: null,
    transcript: [
      { speaker: "AI", text: "SmileCare Dental, this is Nova. How can I help you today?" },
      { speaker: "Patient", text: "I have a terrible toothache, it started last night and my cheek is swollen. I'm in a lot of pain." },
      { speaker: "AI", text: "I'm so sorry to hear that. Swelling with pain can be urgent — I'm transferring you immediately to our clinical team who can get you in today. Please hold for just a moment." },
      { speaker: "Patient", text: "Thank you, please hurry." },
      { speaker: "AI", text: "Connecting you now. You're our priority." },
    ],
  },
  {
    id: "call-005",
    direction: "inbound" as const,
    callerName: "James Okafor",
    callerPhone: "(555) 114-7723",
    date: "2025-06-15",
    time: "09:22 AM",
    duration: "4:08",
    durationSec: 248,
    outcome: "Appointment Rescheduled",
    outcomeType: "success" as const,
    summary: "James needed to cancel his 11 AM appointment due to work conflict. AI rescheduled to next Tuesday at 3 PM and filled the cancelled slot with a waitlisted patient.",
    patientCreated: null,
    appointmentBooked: { date: "June 17, 2025", time: "3:00 PM", type: "Composite Filling", provider: "Dr. Sarah Martinez" },
    transcript: [
      { speaker: "AI", text: "SmileCare Dental, this is Nova. How can I help?" },
      { speaker: "Patient", text: "I need to cancel my appointment today at 11. Something came up at work." },
      { speaker: "AI", text: "No problem, James. I see your filling appointment with Dr. Martinez. Before I cancel — would you like to reschedule so we don't lose your spot in treatment?" },
      { speaker: "Patient", text: "Yeah, I should. What do you have next week?" },
      { speaker: "AI", text: "Dr. Martinez has Tuesday June 17th at 3 PM available. Same procedure — composite filling on tooth 14." },
      { speaker: "Patient", text: "Tuesday at 3 works great." },
      { speaker: "AI", text: "Done! You're rescheduled for June 17th at 3 PM. I've also sent you an updated confirmation. Is there anything else?" },
      { speaker: "Patient", text: "No, that's perfect. Thanks for making that easy." },
      { speaker: "AI", text: "Of course! We'll see you Tuesday, James. Have a great day!" },
    ],
  },
  {
    id: "call-006",
    direction: "outbound" as const,
    callerName: "Rosa Martinez",
    callerPhone: "(555) 678-3344",
    date: "2025-06-15",
    time: "08:44 AM",
    duration: "0:00",
    durationSec: 0,
    outcome: "Voicemail Left",
    outcomeType: "info" as const,
    summary: "Outbound recall call for Rosa Martinez (overdue 8 months). No answer — AI left a personalized voicemail with callback number and online booking link.",
    patientCreated: null,
    appointmentBooked: null,
    transcript: [
      { speaker: "AI", text: "[Voicemail] Hi Rosa, this is Nova calling from SmileCare Dental. We noticed it's been about 8 months since your last visit and wanted to reach out! Please call us back at (555) 100-2200 or book online at smilecare.com/book. We look forward to seeing you soon. Have a great day!" },
    ],
  },
];

const TASK_LOG = [
  { time: "10:47 AM", action: "Booked appointment for Emily Thompson - June 20 10AM", outcome: "New patient added" },
  { time: "10:31 AM", action: "Verified Delta Dental insurance for Marcus Williams", outcome: "$1,400 benefit confirmed" },
  { time: "10:18 AM", action: "Outbound recall — rescheduled Patricia Nguyen", outcome: "July 8 booked" },
  { time: "09:55 AM", action: "Emergency escalation — dental pain + swelling", outcome: "Transferred to staff" },
  { time: "09:22 AM", action: "Rescheduled James Okafor, filled cancelled slot", outcome: "Waitlist filled" },
  { time: "08:44 AM", action: "Outbound recall to Rosa Martinez — no answer", outcome: "Voicemail left" },
  { time: "08:30 AM", action: "Confirmed 8 appointments via SMS for today", outcome: "All confirmed" },
  { time: "08:15 AM", action: "Processed online booking form — website lead", outcome: "Appointment created" },
];

const HIST_DATA = Array.from({ length: 90 }, (_, i) => ({
  day: i + 1,
  tasks: Math.floor(30 + Math.random() * 30),
  successRate: Math.floor(80 + Math.random() * 15),
}));

const OUTCOME_COLORS: Record<string, string> = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const DIRECTION_ICONS: Record<string, React.ReactNode> = {
  inbound: <PhoneIncoming className="size-3.5 text-green-500" />,
  outbound: <PhoneOutgoing className="size-3.5 text-blue-500" />,
};

/* ─── Web Speech API helpers ─────────────────────────────────────────────────── */
function useVoices() {
  const [aiVoice, setAiVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [patientVoice, setPatientVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const ai = voices.find((v) => v.lang.startsWith("en") && /samantha|zira|victoria|karen|google us english|microsoft zira/i.test(v.name))
        ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
      const patient = voices.find((v) => v.lang.startsWith("en") && v !== ai) ?? ai;
      setAiVoice(ai);
      setPatientVoice(patient);
    };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);
  return { aiVoice, patientVoice };
}

/* ─── Call Player — real TTS voices, auto-plays transcript ──────────────────── */
function CallPlayer({ call, onClose }: { call: typeof CALL_RECORDINGS[0]; onClose: () => void }) {
  const { aiVoice, patientVoice } = useVoices();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const [expandTranscript, setExpandTranscript] = useState(true);
  const [progress, setProgress] = useState(0);
  const mutedRef = useRef(false);
  const stoppedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Scroll active line into view
  useEffect(() => {
    if (activeLine >= 0) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeLine]);

  // Cleanup on unmount
  useEffect(() => () => { window.speechSynthesis?.cancel(); stoppedRef.current = true; }, []);

  const playTranscript = useCallback((startIdx = 0) => {
    if (!call.transcript.length) return;
    stoppedRef.current = false;
    setPlaying(true);

    const speakLine = (idx: number) => {
      if (stoppedRef.current || idx >= call.transcript.length) {
        setPlaying(false);
        setActiveLine(-1);
        setProgress(100);
        return;
      }

      const line = call.transcript[idx];
      setActiveLine(idx);
      setProgress(Math.round((idx / call.transcript.length) * 100));

      const utt = new SpeechSynthesisUtterance(line.text);
      const isAI = line.speaker === "AI";
      utt.voice = isAI ? aiVoice : patientVoice;
      utt.pitch = isAI ? 1.18 : 0.88;
      utt.rate = isAI ? 0.93 : 0.88;
      utt.volume = mutedRef.current ? 0 : 1;

      utt.onend = () => {
        if (stoppedRef.current) return;
        // Pause between turns
        const gap = isAI ? 600 : 400;
        setTimeout(() => speakLine(idx + 1), gap);
      };
      utt.onerror = () => {
        if (!stoppedRef.current) setTimeout(() => speakLine(idx + 1), 800);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    };

    speakLine(startIdx);
  }, [call.transcript, aiVoice, patientVoice]);

  const handlePlayPause = () => {
    if (playing) {
      stoppedRef.current = true;
      window.speechSynthesis?.cancel();
      setPlaying(false);
      setActiveLine(-1);
    } else {
      playTranscript(0);
    }
  };

  const handleMute = () => {
    setMuted((m) => {
      mutedRef.current = !m;
      // Re-apply volume to current utterance by cancelling and resuming
      if (!m) window.speechSynthesis?.cancel();
      return !m;
    });
  };

  const isVoicemail = call.durationSec === 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={`px-5 py-4 text-white ${playing ? "bg-gradient-to-r from-green-700 to-green-600" : "bg-gradient-to-r from-slate-700 to-slate-600"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-11 rounded-full bg-white/20 flex items-center justify-center">
                  <Phone className="size-5" />
                </div>
                {playing && <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-green-400 border-2 border-green-700 animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {DIRECTION_ICONS[call.direction]}
                  <p className="font-bold">{call.callerName}</p>
                  <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${OUTCOME_COLORS[call.outcomeType]}`}>{call.outcome}</span>
                </div>
                <p className="text-xs text-white/60">{call.callerPhone} · {call.date} {call.time} · {call.duration}</p>
              </div>
            </div>
            <button onClick={onClose} className="size-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>

          {/* Progress bar */}
          {playing && (
            <div className="mt-3">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-white/50 mt-1">Playing call recording…</p>
            </div>
          )}
        </div>

        {/* Active Speaker Bar */}
        {playing && activeLine >= 0 && (
          <div className={`px-5 py-2.5 flex items-center gap-3 border-b border-border ${
            call.transcript[activeLine]?.speaker === "AI"
              ? "bg-green-50 dark:bg-green-950/20"
              : "bg-blue-50 dark:bg-blue-950/20"
          }`}>
            <p className={`text-sm font-semibold ${call.transcript[activeLine]?.speaker === "AI" ? "text-green-700 dark:text-green-400" : "text-blue-700 dark:text-blue-400"}`}>
              {call.transcript[activeLine]?.speaker === "AI" ? "🤖 Nova speaking" : "👤 Patient speaking"}
            </p>
            {/* Animated voice bars */}
            <div className="flex items-center gap-0.5 h-5">
              {Array.from({ length: 14 }, (_, i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full ${call.transcript[activeLine]?.speaker === "AI" ? "bg-green-500" : "bg-blue-500"}`}
                  style={{
                    height: "40%",
                    animation: `wave-bar-r ${0.35 + (i % 5) * 0.08}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex-1 truncate italic">
              &ldquo;{call.transcript[activeLine]?.text.slice(0, 70)}{(call.transcript[activeLine]?.text.length ?? 0) > 70 ? "…" : ""}&rdquo;
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            disabled={isVoicemail && call.transcript.length === 0}
            className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 shrink-0"
          >
            {playing ? <Square className="size-4" /> : <Play className="size-4 ml-0.5" />}
          </button>

          {/* Static waveform — bars fill as progress advances */}
          <div className="flex-1 flex gap-0.5 items-center h-8">
            {Array.from({ length: 80 }, (_, i) => {
              const h = 20 + Math.sin(i * 0.45) * 12 + Math.sin(i * 1.2) * 7 + (i % 9 === 0 ? 15 : 0);
              const filled = (i / 80) * 100 <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-300 ${filled ? "bg-primary" : "bg-muted"}`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>

          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{call.duration}</span>
          <button onClick={handleMute} className="text-muted-foreground hover:text-foreground shrink-0">
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>

        {/* AI Summary */}
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">AI Summary</p>
          <p className="text-sm">{call.summary}</p>
        </div>

        {/* Extracted Data */}
        {(call.patientCreated || call.appointmentBooked) && (
          <div className="px-5 py-3 border-b border-border grid grid-cols-2 gap-3">
            {call.patientCreated && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <User className="size-3.5 text-green-600" />
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400">Patient Created</p>
                </div>
                <p className="text-sm font-medium">{call.patientCreated.name}</p>
                <p className="text-xs text-muted-foreground">ID: {call.patientCreated.id}</p>
                <p className="text-xs text-muted-foreground">DOB: {call.patientCreated.dob}</p>
                <p className="text-xs text-muted-foreground">{call.patientCreated.insurance} · {call.patientCreated.memberId}</p>
              </div>
            )}
            {call.appointmentBooked && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="size-3.5 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Appointment Booked</p>
                </div>
                <p className="text-sm font-medium">{call.appointmentBooked.date} {call.appointmentBooked.time}</p>
                <p className="text-xs text-muted-foreground">{call.appointmentBooked.type}</p>
                <p className="text-xs text-muted-foreground">{call.appointmentBooked.provider}</p>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
          <button
            onClick={() => setExpandTranscript(!expandTranscript)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 hover:text-foreground"
          >
            <FileText className="size-3.5" /> Call Transcript
            {expandTranscript ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          {expandTranscript && (
            <div className="space-y-2.5">
              {call.transcript.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 text-sm rounded-xl px-3 py-2 transition-all duration-300 ${
                    activeLine === i ? "bg-primary/10 border border-primary/30 scale-[1.01]" : ""
                  }`}
                >
                  <span className={`text-xs font-bold shrink-0 mt-0.5 w-16 ${line.speaker === "AI" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                    {line.speaker === "AI" ? "🤖 Nova" : "👤 Patient"}
                  </span>
                  <p className="text-foreground/80 leading-relaxed">{line.text}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-between items-center bg-muted/20">
          <Button variant="outline" size="sm" onClick={() => {
            const report = new PdfReport(
              `Call Recording — ${call.callerName}`,
              `${formatDate(call.date)} · ${call.time} · Duration ${call.duration}`
            );

            report.sectionTitle("Call Summary");
            report.keyValueRows([
              ["Caller", call.callerName],
              ["Phone", call.callerPhone],
              ["Direction", call.direction],
              ["Date", formatDate(call.date)],
              ["Time", call.time],
              ["Duration", call.duration],
              ["Outcome", call.outcome],
            ]);
            report.paragraph(call.summary);

            if (call.patientCreated) {
              report.sectionTitle("Patient Created");
              report.keyValueRows([
                ["Name", call.patientCreated.name],
                ["Patient ID", call.patientCreated.id],
                ["Date of Birth", call.patientCreated.dob],
                ["Insurance", call.patientCreated.insurance],
                ["Member ID", call.patientCreated.memberId],
              ]);
            }

            if (call.appointmentBooked) {
              report.sectionTitle("Appointment Booked");
              report.keyValueRows([
                ["Date", call.appointmentBooked.date],
                ["Time", call.appointmentBooked.time],
                ["Type", call.appointmentBooked.type],
                ["Provider", call.appointmentBooked.provider],
              ]);
            }

            report.sectionTitle("Call Transcript");
            report.bulletList(call.transcript.map((l) => `${l.speaker === "AI" ? "Nova (AI)" : "Patient"}: ${l.text}`));

            report.save(`call-${call.id}.pdf`);
          }}>
            <Download className="size-3.5" /> Download Transcript
          </Button>
          <div className="flex items-center gap-3">
            {!playing && (
              <Button size="sm" onClick={() => playTranscript(0)}>
                <Play className="size-3.5" /> Play Recording
              </Button>
            )}
            {playing && (
              <Button size="sm" variant="destructive" onClick={handlePlayPause}>
                <Square className="size-3.5" /> Stop
              </Button>
            )}
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave-bar-r {
          from { height: 15%; }
          to   { height: 95%; }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function AgentDetailPage({ params }: { params: Promise<{ agent: string }> }) {
  const { agent: agentId } = use(params);
  const router = useRouter();
  const { agents, toggleAgent } = useAgentStore();
  const agent = agents.find((a) => a.id === agentId);
  const [activeCall, setActiveCall] = useState<typeof CALL_RECORDINGS[0] | null>(null);
  const [callFilter, setCallFilter] = useState("All");

  const isReceptionist = agent?.id === "agent-receptionist" || agent?.name?.toLowerCase().includes("receptionist");

  if (!agent) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">Agent not found</p>
      <Button onClick={() => router.push("/ai-workforce")} variant="outline"><ArrowLeft className="size-4" /> Back</Button>
    </div>
  );

  const isActive = agent.status === "active";

  const filteredCalls = callFilter === "All"
    ? CALL_RECORDINGS
    : CALL_RECORDINGS.filter((c) =>
        callFilter === "Inbound" ? c.direction === "inbound"
        : callFilter === "Outbound" ? c.direction === "outbound"
        : c.outcomeType === "warning"
      );

  const callStats = {
    total: CALL_RECORDINGS.length,
    booked: CALL_RECORDINGS.filter((c) => c.outcomeType === "success").length,
    avgDur: Math.floor(CALL_RECORDINGS.filter((c) => c.durationSec > 0).reduce((s, c) => s + c.durationSec, 0) / CALL_RECORDINGS.filter((c) => c.durationSec > 0).length),
    escalated: CALL_RECORDINGS.filter((c) => c.outcomeType === "warning").length,
  };

  return (
    <>
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/ai-workforce")}>
        <ArrowLeft className="size-4" /> Back to AI Workforce
      </Button>

      {/* Agent Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="text-6xl"
            >
              {agent.avatar}
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold
                  ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                  <span className={`size-1.5 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
              {agent.currentActivity && (
                <p className="text-sm text-primary mt-2 italic">&ldquo;{agent.currentActivity}&rdquo;</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{isActive ? "Active" : "Paused"}</span>
              <Switch checked={isActive} onCheckedChange={() => toggleAgent(agent.id)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-3xl font-bold">{agent.tasksToday}</p>
          <p className="text-xs text-muted-foreground mt-1">Tasks Today</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-3xl font-bold text-green-600">{agent.successRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-3xl font-bold text-primary">{agent.revenueToday > 0 ? `$${(agent.revenueToday / 1000).toFixed(1)}k` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Revenue Today</p>
        </CardContent></Card>
      </div>

      {/* ── CALL RECORDINGS (Receptionist only) ── */}
      {isReceptionist && (
        <div className="space-y-4">
          {/* Call Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-3 pb-3">
                <p className="text-2xl font-bold">{callStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Calls Today</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-3 pb-3">
                <p className="text-2xl font-bold text-green-600">{callStats.booked}</p>
                <p className="text-xs text-muted-foreground">Successful Outcomes</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-3 pb-3">
                <p className="text-2xl font-bold text-blue-600">{Math.floor(callStats.avgDur / 60)}:{String(callStats.avgDur % 60).padStart(2, "0")}</p>
                <p className="text-xs text-muted-foreground">Avg Call Duration</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-3 pb-3">
                <p className="text-2xl font-bold text-yellow-600">{callStats.escalated}</p>
                <p className="text-xs text-muted-foreground">Escalated to Staff</p>
              </CardContent>
            </Card>
          </div>

          {/* Call Recordings List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="size-4 text-primary" /> Call Recordings
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Click any call to play audio & view transcript</p>
                </div>
                <div className="flex gap-1">
                  {["All", "Inbound", "Outbound", "Escalated"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setCallFilter(f)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${callFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => setActiveCall(call)}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40 cursor-pointer transition-colors group"
                >
                  {/* Direction icon */}
                  <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                    call.direction === "inbound" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"
                  }`}>
                    {call.direction === "inbound"
                      ? <PhoneIncoming className="size-4 text-green-600" />
                      : call.durationSec === 0
                        ? <PhoneMissed className="size-4 text-yellow-600" />
                        : <PhoneOutgoing className="size-4 text-blue-600" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{call.callerName}</p>
                      <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${OUTCOME_COLORS[call.outcomeType]}`}>{call.outcome}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{call.callerPhone} · {call.time} · {call.duration || "Voicemail"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{call.summary.slice(0, 90)}...</p>
                  </div>

                  {/* Indicators */}
                  <div className="flex items-center gap-2 shrink-0">
                    {call.patientCreated && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-0.5">
                        <User className="size-2.5" /> Patient added
                      </span>
                    )}
                    {call.appointmentBooked && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-2 py-0.5">
                        <Calendar className="size-2.5" /> Booked
                      </span>
                    )}
                    <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="size-3 ml-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Log */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Today&apos;s Task Log</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TASK_LOG.map((task, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap w-16 pt-0.5">{task.time}</span>
                    <div className="flex-1">
                      <p>{task.action}</p>
                      <p className="text-xs text-green-600 mt-0.5">✓ {task.outcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Agent Status</p>
                  <p className="text-xs text-muted-foreground">Enable or pause this agent</p>
                </div>
                <Switch checked={isActive} onCheckedChange={() => toggleAgent(agent.id)} />
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-sm font-medium mb-1">Working Hours</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Mon–Fri</span><span>8:00 AM – 6:00 PM</span></div>
                  <div className="flex justify-between"><span>Saturday</span><span>9:00 AM – 2:00 PM</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span>Off</span></div>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Confidence Threshold</p>
                  <span className="text-sm font-bold text-primary">75%</span>
                </div>
                <Slider defaultValue={[75]} min={50} max={99} step={1} />
                <p className="text-xs text-muted-foreground mt-1">Agent will escalate to human if below threshold</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Auto-approve Threshold</p>
                  <span className="text-sm font-bold text-primary">90%</span>
                </div>
                <Slider defaultValue={[90]} min={70} max={99} step={1} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Chart */}
      <Card>
        <CardHeader><CardTitle>90-Day Performance History</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={HIST_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: "Day", position: "insideBottom", offset: -2 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="tasks" stroke="#4F46E5" strokeWidth={1.5} dot={false} name="Tasks" />
              <Line type="monotone" dataKey="successRate" stroke="#10B981" strokeWidth={1.5} dot={false} name="Success %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>

    {/* Call Player Modal */}
    {activeCall && <CallPlayer call={activeCall} onClose={() => setActiveCall(null)} />}
    </>
  );
}
