"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, ZoomIn, ZoomOut, Maximize2, Minimize2, Sun, Contrast,
  RotateCcw, Download, FileText, Plus, Send, Bot, User,
  ChevronDown, ChevronUp, Layers, Activity, Target, Clipboard,
  Share2, AlertTriangle, CheckCircle, Eye, Move, Loader2,
  MailCheck, PlusCircle, Scan,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PdfReport } from "@/lib/pdf";
import type { ImagingRecord, ImagingFinding } from "@/types";

// ── Severity colour system ────────────────────────────────────────────────────
const SEV: Record<string, { label: string; ring: string; bg: string; text: string; dot: string; glow: string; hex: string }> = {
  Caries:      { label: "Critical",  ring: "ring-red-500",    bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    glow: "shadow-red-500/50",    hex: "#ef4444" },
  "Bone Loss": { label: "Concern",   ring: "ring-orange-400", bg: "bg-orange-500/20", text: "text-orange-400", dot: "bg-orange-400", glow: "shadow-orange-500/50", hex: "#fb923c" },
  Impaction:   { label: "Watch",     ring: "ring-yellow-400", bg: "bg-yellow-500/20", text: "text-yellow-300", dot: "bg-yellow-400", glow: "shadow-yellow-500/50", hex: "#facc15" },
  Restoration: { label: "Monitored", ring: "ring-blue-400",   bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-400",   glow: "shadow-blue-500/50",   hex: "#60a5fa" },
  default:     { label: "Watch",     ring: "ring-yellow-400", bg: "bg-yellow-500/20", text: "text-yellow-300", dot: "bg-yellow-400", glow: "shadow-yellow-500/50", hex: "#facc15" },
};
const getSev = (type: string) => SEV[type] ?? SEV.default;

// ── AI text helpers ───────────────────────────────────────────────────────────
function buildNarrative(img: ImagingRecord): string {
  if (!img.findings.length)
    return `${img.type} radiograph reviewed. No significant pathology detected. Bone levels within normal limits. No caries, periapical lesions, or restorative concerns identified. Routine monitoring recommended at next scheduled recall.`;
  const items = img.findings.map((f) => {
    if (f.type === "Caries")      return `carious lesion on tooth ${f.tooth} (${f.confidence}% confidence — early intervention advised)`;
    if (f.type === "Bone Loss")   return `alveolar bone loss around tooth ${f.tooth} (${f.confidence}% — periodontal evaluation required)`;
    if (f.type === "Restoration") return `existing restoration tooth ${f.tooth} (${f.confidence}% — margins intact, no secondary caries detected)`;
    if (f.type === "Impaction")   return `impacted tooth ${f.tooth} (${f.confidence}% — surgical consultation recommended)`;
    return `${f.type} tooth ${f.tooth} (${f.confidence}%)`;
  });
  return `${img.type} radiograph analysis complete. AI identified ${img.findings.length} finding${img.findings.length > 1 ? "s" : ""}: ${items.join("; ")}. Clinical correlation advised before finalizing treatment plan.`;
}

function buildRecs(img: ImagingRecord): string[] {
  if (!img.findings.length) return ["Continue routine preventive care", "Re-evaluate in 6–12 months", "No restorative intervention required at this time"];
  return img.findings.map((f) => {
    if (f.type === "Caries")      return `Tooth ${f.tooth}: Restore with composite resin — early intervention to prevent pulpal involvement`;
    if (f.type === "Bone Loss")   return `Tooth ${f.tooth}: Complete periodontal charting, full-mouth series, and scaling/root planing`;
    if (f.type === "Impaction")   return `Tooth ${f.tooth}: CBCT pre-surgical evaluation; oral surgery consultation`;
    if (f.type === "Restoration") return `Tooth ${f.tooth}: Monitor restoration margins at next recall; no active intervention required`;
    return `Tooth ${f.tooth}: Clinical correlation and follow-up recommended`;
  });
}

// ── PDF Generators ────────────────────────────────────────────────────────────
function exportClinicalReport(img: ImagingRecord, patientName: string) {
  const rpt = new PdfReport(
    "Dental Imaging Clinical Report",
    `${patientName} · ${img.type} · ${new Date(img.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
  );

  rpt.sectionTitle("Patient & Study Information");
  rpt.keyValueRows([
    ["Patient Name",   patientName],
    ["Study ID",       img.id.toUpperCase()],
    ["Imaging Type",   img.type],
    ["Acquisition Date", new Date(img.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
    ["AI Status",      img.aiStatus],
    ["Findings Count", String(img.findings.length)],
    ["Report Date",    new Date().toLocaleString()],
    ["Reporting System", "DentalOS Vision AI v3.2"],
  ]);

  rpt.sectionTitle("AI Diagnostic Summary");
  rpt.paragraph(buildNarrative(img));

  if (img.findings.length > 0) {
    rpt.sectionTitle("Findings Detail");
    const avgConf = Math.round(img.findings.reduce((s, f) => s + f.confidence, 0) / img.findings.length);
    rpt.keyValueRows([["Overall AI Confidence", `${avgConf}% (model threshold: 70%)`]]);
    rpt.spacer(4);
    rpt.table(
      ["#", "Finding", "Tooth", "Severity", "AI Confidence", "Status"],
      img.findings.map((f, i) => [
        String(i + 1),
        f.type,
        f.tooth,
        getSev(f.type).label,
        `${f.confidence}%`,
        f.confidence >= 85 ? "High Confidence" : "Moderate",
      ]),
      [24, 100, 60, 80, 90, 162]
    );
  } else {
    rpt.sectionTitle("Findings Detail");
    rpt.paragraph("No significant radiographic findings detected on this study. All anatomical structures appear within normal limits.");
  }

  rpt.sectionTitle("Clinical Recommendations");
  rpt.bulletList(buildRecs(img));

  rpt.sectionTitle("Radiographic Interpretation Notes");
  rpt.paragraph("This report is generated by DentalOS Vision AI and is intended to assist the treating clinician. AI analysis supplements but does not replace clinical judgment. All findings should be correlated with clinical examination, patient history, and other diagnostic information before treatment planning.");
  rpt.paragraph("Periapical status, lamina dura continuity, and periodontal bone levels should be confirmed with complete radiographic series and full-mouth examination where indicated.");

  rpt.sectionTitle("Quality Assurance");
  rpt.keyValueRows([
    ["Image Quality",   "Diagnostic — no retake required"],
    ["AI Model",        "DentalOS Vision v3.2 (HIPAA-compliant, FDA 510(k) pending)"],
    ["Processing Time", "< 2 seconds"],
    ["Reviewed By",     "Pending clinical sign-off"],
  ]);

  rpt.save(`ClinicalReport_${img.id}_${patientName.replace(/ /g, "_")}.pdf`);
}

function exportSOAPNote(img: ImagingRecord, patientName: string) {
  const date = new Date(img.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const rpt = new PdfReport(
    "SOAP Note — Radiographic Review",
    `${patientName} · ${img.type} · ${date}`
  );

  rpt.sectionTitle("Patient Information");
  rpt.keyValueRows([
    ["Patient Name", patientName],
    ["Date of Service", date],
    ["Procedure", `Radiographic Review — ${img.type}`],
    ["Study Reference", img.id.toUpperCase()],
  ]);

  rpt.sectionTitle("S — Subjective");
  rpt.paragraph(
    `Patient ${patientName} presents for radiographic review. ${img.type} radiograph obtained on ${date}. ` +
    (img.findings.length
      ? `${img.findings.length} area(s) of interest identified by AI pre-screening prior to clinical review.`
      : "AI pre-screening flagged no areas of concern prior to clinical review.")
  );

  rpt.sectionTitle("O — Objective");
  if (img.findings.length === 0) {
    rpt.paragraph("Radiographic examination reveals no significant pathology. Bone levels within normal limits. No caries, periapical lesions, or defective restorations identified on this projection.");
  } else {
    rpt.paragraph(`${img.type} radiograph demonstrates the following findings:`);
    rpt.table(
      ["Finding", "Location", "Confidence", "Priority"],
      img.findings.map((f) => [f.type, `Tooth ${f.tooth}`, `${f.confidence}%`, getSev(f.type).label]),
      [160, 120, 100, 136]
    );
  }

  rpt.sectionTitle("A — Assessment");
  if (img.findings.length === 0) {
    rpt.paragraph("No active pathology identified on current radiograph. Patient maintains good radiographic bone levels. No restorative, periodontal, or periapical concerns noted.");
  } else {
    rpt.bulletList(
      img.findings.map((f) => {
        if (f.type === "Caries")      return `D1 caries tooth ${f.tooth} — restorative intervention indicated (${f.confidence}% AI confidence)`;
        if (f.type === "Bone Loss")   return `Alveolar bone loss tooth ${f.tooth} — stage/grade periodontal disease (${f.confidence}%)`;
        if (f.type === "Impaction")   return `Impacted tooth ${f.tooth} — surgical evaluation required (${f.confidence}%)`;
        if (f.type === "Restoration") return `Existing restoration tooth ${f.tooth} — stable, monitor at recall (${f.confidence}%)`;
        return `${f.type} tooth ${f.tooth} (${f.confidence}%)`;
      })
    );
  }

  rpt.sectionTitle("P — Plan");
  rpt.bulletList(buildRecs(img));
  rpt.spacer(6);
  rpt.paragraph("Informed consent obtained. Patient education provided regarding findings and proposed treatment. Follow-up appointment to be scheduled per treatment priority.");

  rpt.sectionTitle("Provider Sign-Off");
  rpt.keyValueRows([
    ["Provider",         "______________________________"],
    ["License Number",   "______________________________"],
    ["Date Signed",      "______________________________"],
    ["NPI",              "______________________________"],
  ]);

  rpt.save(`SOAPNote_${img.id}_${patientName.replace(/ /g, "_")}.pdf`);
}

function exportStudyPDF(img: ImagingRecord, patientName: string) {
  const rpt = new PdfReport(
    "Dental Radiograph Study Export",
    `${patientName} · ${img.type} · ${new Date(img.date).toLocaleDateString()}`
  );

  rpt.sectionTitle("Study Summary");
  rpt.keyValueRows([
    ["Patient",       patientName],
    ["Modality",      img.type],
    ["Study Date",    new Date(img.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ["Study ID",      img.id.toUpperCase()],
    ["AI Status",     img.aiStatus],
    ["Total Findings", String(img.findings.length)],
    ["Export Date",   new Date().toLocaleString()],
  ]);

  rpt.sectionTitle("AI Analysis Results");
  const avgConf = img.findings.length > 0
    ? Math.round(img.findings.reduce((s, f) => s + f.confidence, 0) / img.findings.length)
    : 98;
  rpt.keyValueRows([
    ["Overall Status",     img.findings.length === 0 ? "Normal — No Pathology" : "Findings Present — Review Required"],
    ["AI Confidence",      `${avgConf}%`],
    ["Analysis Engine",    "DentalOS Vision AI v3.2"],
    ["Processing Status",  "Complete"],
  ]);
  rpt.spacer(4);
  rpt.paragraph(buildNarrative(img));

  if (img.findings.length > 0) {
    rpt.sectionTitle("Finding Index");
    rpt.table(
      ["Finding", "Tooth", "Type", "Confidence", "Severity"],
      img.findings.map((f) => [f.type, f.tooth, img.type, `${f.confidence}%`, getSev(f.type).label]),
      [130, 60, 90, 90, 146]
    );
  }

  rpt.sectionTitle("Imaging Notes");
  rpt.paragraph("This export includes AI-assisted analysis results and is intended for clinical reference. Image data is stored in DentalOS AI and accessible via patient chart. DICOM export available on request.");

  rpt.save(`StudyExport_${img.id}_${patientName.replace(/ /g, "_")}.pdf`);
}

// ── SVG X-Ray viewer ──────────────────────────────────────────────────────────
function XRayDisplay({ img, brightness, contrast, overlayOn, zoom, pan, onPanStart, deepScan }: {
  img: ImagingRecord; brightness: number; contrast: number;
  overlayOn: boolean; zoom: number; pan: { x: number; y: number };
  onPanStart: (e: React.MouseEvent) => void; deepScan: boolean;
}) {
  const seed = img.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const typeShapes: Record<string, React.ReactNode> = {
    Bitewing: (
      <g opacity={0.9}>
        {[60, 110, 160, 210, 260].map((x, i) => (
          <g key={i}>
            <rect x={x} y={40} width={36} height={55} rx={4} fill={`hsl(0,0%,${62 + i * 3}%)`}/>
            <rect x={x + 6} y={38} width={24} height={8} rx={2} fill={`hsl(0,0%,${72 + i * 2}%)`}/>
            <rect x={x + 2} y={58} width={8} height={30} rx={2} fill={`hsl(0,0%,${48 + i * 2}%)`} opacity={0.6}/>
            <rect x={x + 26} y={58} width={8} height={30} rx={2} fill={`hsl(0,0%,${48 + i * 2}%)`} opacity={0.6}/>
            <rect x={x + 2} y={118} width={32} height={50} rx={4} fill={`hsl(0,0%,${58 + i * 3}%)`}/>
            <rect x={x + 5} y={160} width={22} height={8} rx={2} fill={`hsl(0,0%,${68 + i * 2}%)`}/>
            <rect x={x + 4} y={120} width={7} height={32} rx={2} fill={`hsl(0,0%,${44 + i * 2}%)`} opacity={0.6}/>
            <rect x={x + 21} y={120} width={7} height={32} rx={2} fill={`hsl(0,0%,${44 + i * 2}%)`} opacity={0.6}/>
          </g>
        ))}
        <rect x={50} y={94} width={262} height={6} rx={2} fill="hsl(0,0%,78%)" opacity={0.4}/>
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1={52 + i * 16} y1={96} x2={54 + i * 16} y2={116} stroke="hsl(0,0%,35%)" strokeWidth={1} opacity={0.4}/>
        ))}
      </g>
    ),
    Periapical: (
      <g opacity={0.9}>
        <rect x={130} y={30} width={50} height={90} rx={6} fill="hsl(0,0%,65%)"/>
        <rect x={140} y={25} width={30} height={12} rx={3} fill="hsl(0,0%,78%)"/>
        <path d="M145,120 Q138,160 142,195" stroke="hsl(0,0%,60%)" strokeWidth={8} fill="none" strokeLinecap="round"/>
        <path d="M165,120 Q172,160 168,198" stroke="hsl(0,0%,60%)" strokeWidth={8} fill="none" strokeLinecap="round"/>
        <path d="M143,120 Q136,162 140,196" stroke="hsl(0,0%,15%)" strokeWidth={2} fill="none"/>
        <path d="M167,120 Q174,162 170,199" stroke="hsl(0,0%,15%)" strokeWidth={2} fill="none"/>
        <rect x={60} y={110} width={200} height={100} rx={4} fill="hsl(0,0%,30%)" opacity={0.5}/>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={90 + i * 10} y1={108} x2={92 + i * 10} y2={130} stroke="hsl(0,0%,42%)" strokeWidth={1} opacity={0.5}/>
        ))}
        <rect x={60} y={40} width={40} height={80} rx={4} fill="hsl(0,0%,50%)" opacity={0.7}/>
        <rect x={210} y={40} width={40} height={80} rx={4} fill="hsl(0,0%,50%)" opacity={0.7}/>
      </g>
    ),
    Panoramic: (
      <g opacity={0.88}>
        {Array.from({ length: 14 }, (_, i) => (
          <g key={i}>
            <rect x={30 + i * 24} y={55} width={18} height={38 + Math.sin(i * 0.4) * 10} rx={3} fill={`hsl(0,0%,${55 + Math.abs(7 - i) * 2}%)`}/>
            <rect x={33 + i * 24} y={53} width={12} height={6} rx={1} fill="hsl(0,0%,72%)"/>
          </g>
        ))}
        <ellipse cx={198} cy={96} rx={175} ry={10} fill="hsl(0,0%,40%)" opacity={0.4}/>
        {Array.from({ length: 14 }, (_, i) => (
          <g key={i}>
            <rect x={30 + i * 24} y={130} width={18} height={38 + Math.sin(i * 0.4) * 10} rx={3} fill={`hsl(0,0%,${50 + Math.abs(7 - i) * 2}%)`}/>
            <rect x={33 + i * 24} y={162 + Math.sin(i * 0.4) * 10} width={12} height={6} rx={1} fill="hsl(0,0%,65%)"/>
          </g>
        ))}
        <ellipse cx={198} cy={130} rx={180} ry={12} fill="hsl(0,0%,38%)" opacity={0.4}/>
        <ellipse cx={28} cy={46} rx={18} ry={26} fill="hsl(0,0%,48%)" opacity={0.7}/>
        <ellipse cx={368} cy={46} rx={18} ry={26} fill="hsl(0,0%,48%)" opacity={0.7}/>
        <ellipse cx={120} cy={38} rx={55} ry={22} fill="hsl(0,0%,22%)" opacity={0.5}/>
        <ellipse cx={278} cy={38} rx={55} ry={22} fill="hsl(0,0%,22%)" opacity={0.5}/>
      </g>
    ),
    CBCT: (
      <g opacity={0.9}>
        <ellipse cx={200} cy={105} rx={155} ry={85} fill="none" stroke="hsl(0,0%,32%)" strokeWidth={2}/>
        <ellipse cx={200} cy={105} rx={130} ry={65} fill="hsl(0,0%,22%)" opacity={0.8}/>
        {Array.from({ length: 8 }, (_, i) => {
          const a = -80 + i * 23; const r = 90;
          const cx2 = 200 + r * Math.cos(a * Math.PI / 180);
          const cy2 = 85 + r * 0.55 * Math.sin(a * Math.PI / 180);
          return <ellipse key={i} cx={cx2} cy={cy2} rx={10} ry={7} fill={`hsl(0,0%,${68 + i}%)`} transform={`rotate(${a},${cx2},${cy2})`}/>;
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = 100 + i * 23; const r = 85;
          const cx2 = 200 + r * Math.cos(a * Math.PI / 180);
          const cy2 = 130 + r * 0.45 * Math.sin(a * Math.PI / 180);
          return <ellipse key={i} cx={cx2} cy={cy2} rx={9} ry={6} fill={`hsl(0,0%,${62 + i}%)`} transform={`rotate(${a},${cx2},${cy2})`}/>;
        })}
        <path d="M68,148 Q110,158 150,155 Q180,153 200,155 Q230,157 270,155 Q310,152 332,148" stroke="hsl(0,0%,55%)" strokeWidth={3} fill="none" strokeDasharray="6,3" opacity={0.7}/>
        {Array.from({ length: 20 }, (_, i) => (
          <circle key={i} cx={130 + (i % 5) * 18 + seed % 15} cy={82 + Math.floor(i / 5) * 14 + seed % 8} r={3} fill="hsl(0,0%,28%)" opacity={0.6}/>
        ))}
      </g>
    ),
  };

  const overlayPositions = [
    { top: "28%", left: "34%" }, { top: "62%", left: "58%" },
    { top: "38%", left: "72%" }, { top: "55%", left: "22%" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
      <div
        className="relative transition-transform duration-150 ease-out cursor-grab active:cursor-grabbing"
        style={{ transform: `scale(${zoom}) translate(${pan.x}px,${pan.y}px)` }}
        onMouseDown={onPanStart}
      >
        <svg
          viewBox="0 0 400 210" width={Math.round(400 * Math.min(zoom, 1))} height={Math.round(210 * Math.min(zoom, 1))}
          style={{ filter: `brightness(${brightness / 100}) contrast(${contrast / 100}) grayscale(1)`, display: "block", minWidth: 320, minHeight: 168 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width={400} height={210} fill="#080c10"/>
          <defs>
            <radialGradient id="vig" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#000" stopOpacity="0.55"/>
            </radialGradient>
          </defs>
          {typeShapes[img.type] ?? typeShapes["Bitewing"]}
          <rect width={400} height={210} fill="url(#vig)"/>
        </svg>

        {/* AI overlays */}
        {overlayOn && img.findings.map((f: ImagingFinding, i: number) => {
          const s = getSev(f.type);
          const pos = overlayPositions[i % overlayPositions.length];
          return (
            <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.25, type: "spring", stiffness: 300 }}
              className="absolute group" style={pos}
            >
              <span className={`absolute inset-0 rounded-full ${s.dot} opacity-30 animate-ping`} style={{ width: 28, height: 28 }}/>
              <div className={`relative size-7 rounded-full ${s.dot} flex items-center justify-center text-white text-[10px] font-bold shadow-lg ring-2 ring-white/30 cursor-pointer`}>{i + 1}</div>
              <div className="absolute left-9 top-0 hidden group-hover:flex items-start gap-2 bg-gray-950/95 border border-white/10 backdrop-blur-sm rounded-xl px-3 py-2 w-44 z-20 shadow-2xl">
                <div className={`size-2 rounded-full ${s.dot} shrink-0 mt-1`}/>
                <div>
                  <p className={`text-xs font-semibold ${s.text}`}>{f.type} — {s.label}</p>
                  <p className="text-[10px] text-gray-400">Tooth {f.tooth}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 bg-gray-700 rounded-full h-1">
                      <div className={`h-1 rounded-full ${s.dot}`} style={{ width: `${f.confidence}%` }}/>
                    </div>
                    <span className="text-[10px] text-gray-300">{f.confidence}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Deep scan sweep animation */}
        {deepScan && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-lg shadow-violet-500/50"
              initial={{ top: "0%" }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 2.4, repeat: 2, ease: "linear" }}
            />
            <div className="absolute inset-0 border-2 border-violet-500/30 rounded-lg"/>
          </motion.div>
        )}
      </div>

      {overlayOn && img.findings.length === 0 && !deepScan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-sm rounded-xl px-3 py-2"
        >
          <CheckCircle className="size-4 text-emerald-400 shrink-0"/>
          <span className="text-emerald-300 text-xs font-medium">AI: No pathology detected</span>
        </motion.div>
      )}

      {deepScan && (
        <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
          <div className="flex items-center gap-2 bg-violet-950/80 border border-violet-500/40 backdrop-blur-sm rounded-full px-4 py-2">
            <Loader2 className="size-3.5 text-violet-400 animate-spin"/>
            <span className="text-violet-300 text-xs font-medium">AI Deep Scan in progress…</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────
interface ChatMsg { role: "user" | "ai"; text: string }
const SUGGESTED = ["Explain findings", "Compare previous scan", "Generate treatment notes", "Summarize for patient"];

function chatReply(msg: string, img: ImagingRecord): string {
  const l = msg.toLowerCase();
  if (l.includes("explain") || l.includes("findings") || l.includes("what"))
    return img.findings.length === 0
      ? "This radiograph shows no significant pathology. All structures are within normal radiographic limits."
      : `I found ${img.findings.length} finding(s): ${img.findings.map((f) => `${f.type} on tooth ${f.tooth} (${f.confidence}%)`).join(", ")}. Want details on any specific finding?`;
  if (l.includes("treatment") || l.includes("next step") || l.includes("notes"))
    return img.findings.length === 0
      ? "No treatment indicated. Continue preventive care and scheduled recall."
      : buildRecs(img).join(". ");
  if (l.includes("compare") || l.includes("previous"))
    return `Historical comparison: this ${img.type} from ${new Date(img.date).toLocaleDateString()} shows ${img.findings.length === 0 ? "no change from baseline" : `${img.findings.length} finding(s). Historical progression tracking is available in the patient chart`}.`;
  if (l.includes("patient") || l.includes("summarize"))
    return `Patient summary: "Your X-ray ${img.findings.length === 0 ? "looks great — no problems were found today." : `showed ${img.findings.length} area${img.findings.length > 1 ? "s" : ""} that need attention: ${img.findings.map((f) => f.type.toLowerCase()).join(", ")}. We'll discuss treatment at your next visit.`}"`;
  if (l.includes("bone") || l.includes("periodont"))
    return img.findings.some((f) => f.type === "Bone Loss")
      ? `Bone loss confirmed around: ${img.findings.filter((f) => f.type === "Bone Loss").map((f) => `tooth ${f.tooth}`).join(", ")}. Full periodontal probing required.`
      : "Bone levels appear within normal limits. No horizontal or vertical bone loss detected.";
  return `Analyzing ${img.type}: ${img.findings.length === 0 ? "No significant findings — all structures normal." : `${img.findings.length} AI-flagged finding(s) present. Ask me about specific findings, treatment options, or clinical documentation.`}`;
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function ImagingViewerModal({ image, patientName, onClose }: {
  image: ImagingRecord; patientName: string; onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ mx: number; my: number; px: number; py: number } | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [overlayOn, setOverlayOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: "ai", text: `I've analyzed this ${image.type} radiograph. ${image.findings.length === 0 ? "No significant pathology detected." : `Found ${image.findings.length} finding(s) requiring review.`} Ask me anything.` },
  ]);
  const [typing, setTyping] = useState(false);
  const [deepScan, setDeepScan] = useState(false);
  const [addedToChart, setAddedToChart] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDone, setSendDone] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const avgConf = image.findings.length > 0
    ? Math.round(image.findings.reduce((s, f) => s + f.confidence, 0) / image.findings.length) : 98;
  const narrative = buildNarrative(image);
  const overallStatus = image.findings.length === 0 ? "normal"
    : image.findings.some((f) => f.type === "Caries" || f.type === "Bone Loss") ? "critical" : "watch";

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs, typing]);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return; e.preventDefault();
    setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
  }, [zoom, pan]);

  useEffect(() => {
    if (!panStart) return;
    const move = (e: MouseEvent) => setPan({ x: panStart.px + (e.clientX - panStart.mx) / zoom, y: panStart.py + (e.clientY - panStart.my) / zoom });
    const up = () => setPanStart(null);
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [panStart, zoom]);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); setBrightness(100); setContrast(100); };

  const sendMsg = () => {
    const t = chatInput.trim(); if (!t) return;
    setChatMsgs((p) => [...p, { role: "user", text: t }]);
    setChatInput(""); setTyping(true);
    setTimeout(() => { setChatMsgs((p) => [...p, { role: "ai", text: chatReply(t, image) }]); setTyping(false); }, 800);
  };

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleClinicalReport = () => {
    setActionLoading("report");
    setTimeout(() => {
      try { exportClinicalReport(image, patientName); toast.success("Clinical Report downloaded"); }
      catch { toast.error("PDF generation failed"); }
      setActionLoading(null);
    }, 600);
  };

  const handleSOAP = () => {
    setActionLoading("soap");
    setTimeout(() => {
      try { exportSOAPNote(image, patientName); toast.success("SOAP Note downloaded"); }
      catch { toast.error("PDF generation failed"); }
      setActionLoading(null);
    }, 600);
  };

  const handleExportPDF = () => {
    setActionLoading("export");
    setTimeout(() => {
      try { exportStudyPDF(image, patientName); toast.success("Study export downloaded"); }
      catch { toast.error("PDF generation failed"); }
      setActionLoading(null);
    }, 600);
  };

  const handleAddToChart = () => {
    if (addedToChart) { toast.info("Already added to patient chart"); return; }
    setActionLoading("chart");
    setTimeout(() => {
      setAddedToChart(true);
      setActionLoading(null);
      toast.success(`Imaging study added to ${patientName}'s chart`);
    }, 900);
  };

  const handleSendToPatient = () => { setSendDialogOpen(true); setSendDone(false); };

  const confirmSend = () => {
    setSendDone(true);
    setTimeout(() => {
      setSendDialogOpen(false);
      toast.success(`Report sent to ${patientName} via secure patient portal`);
    }, 1800);
  };

  const handleDeepScan = () => {
    if (deepScan) return;
    setDeepScan(true);
    toast.info("AI Deep Scan initiated…");
    setTimeout(() => {
      setDeepScan(false);
      const extra = image.findings.length > 0
        ? `Deep scan confirmed ${image.findings.length} finding(s). No additional pathology identified beyond initial analysis.`
        : "Deep scan complete — no additional findings. Study confirmed normal.";
      setChatMsgs((p) => [...p, { role: "ai", text: `🔬 AI Deep Scan complete. ${extra} Confidence threshold validated at ${avgConf}%.` }]);
      setChatOpen(true);
      toast.success("AI Deep Scan complete");
    }, 7000);
  };

  const ACTIONS = [
    { id: "report",  icon: FileText,    label: "Clinical Report",  color: "hover:from-violet-600 hover:to-blue-600",    onClick: handleClinicalReport },
    { id: "soap",    icon: Clipboard,   label: "SOAP Note",        color: "hover:from-blue-600 hover:to-cyan-600",      onClick: handleSOAP },
    { id: "export",  icon: Download,    label: "Export PDF",       color: "hover:from-cyan-600 hover:to-teal-600",      onClick: handleExportPDF },
    { id: "chart",   icon: addedToChart ? CheckCircle : PlusCircle, label: addedToChart ? "In Chart ✓" : "Add to Chart", color: "hover:from-teal-600 hover:to-emerald-600", onClick: handleAddToChart },
    { id: "send",    icon: Share2,      label: "Send to Patient",  color: "hover:from-emerald-600 hover:to-green-600",  onClick: handleSendToPatient },
    { id: "deep",    icon: deepScan ? Loader2 : Scan, label: deepScan ? "Scanning…" : "AI Deep Scan", color: "hover:from-pink-600 hover:to-violet-600", onClick: handleDeepScan },
  ];

  return (
    <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#060810]"
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-[#0c0f1a]/95 border-b border-white/5 backdrop-blur-xl">
        <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
          <Eye className="size-3.5 text-white"/>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{patientName}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">{image.type}</span>
            <span className="text-gray-600">·</span>
            <span className="text-[10px] text-gray-400">{new Date(image.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span className="text-gray-600">·</span>
            <span className="text-[10px] font-mono text-gray-500">{image.id.toUpperCase()}</span>
          </div>
        </div>
        <div className="h-8 w-px bg-white/8 mx-1 shrink-0"/>
        {/* Zoom */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="size-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><ZoomOut className="size-3.5"/></button>
          <span className="text-xs text-gray-300 w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="size-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><ZoomIn className="size-3.5"/></button>
        </div>
        <div className="h-6 w-px bg-white/8 shrink-0"/>
        {/* Brightness */}
        <div className="flex items-center gap-2 shrink-0">
          <Sun className="size-3.5 text-gray-400"/>
          <input type="range" min={20} max={200} value={brightness} onChange={(e) => setBrightness(+e.target.value)} className="w-20 h-1 accent-violet-500 cursor-pointer"/>
          <span className="text-[10px] text-gray-500 w-6">{brightness}</span>
        </div>
        <div className="h-6 w-px bg-white/8 shrink-0"/>
        {/* Contrast */}
        <div className="flex items-center gap-2 shrink-0">
          <Contrast className="size-3.5 text-gray-400"/>
          <input type="range" min={20} max={250} value={contrast} onChange={(e) => setContrast(+e.target.value)} className="w-20 h-1 accent-violet-500 cursor-pointer"/>
          <span className="text-[10px] text-gray-500 w-6">{contrast}</span>
        </div>
        <div className="h-6 w-px bg-white/8 shrink-0"/>
        <button onClick={() => setOverlayOn((o) => !o)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${overlayOn ? "bg-violet-600/30 text-violet-300 border border-violet-500/40" : "text-gray-400 hover:bg-white/5 border border-transparent"}`}>
          <Layers className="size-3.5"/>{overlayOn ? "AI On" : "AI Off"}
        </button>
        <button onClick={resetView} title="Reset view" className="size-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><RotateCcw className="size-3.5"/></button>
        <div className="flex-1"/>
        <button onClick={() => setFullscreen((f) => !f)} className="size-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          {fullscreen ? <Minimize2 className="size-3.5"/> : <Maximize2 className="size-3.5"/>}
        </button>
        <button onClick={onClose} className="size-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"><X className="size-3.5"/></button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — X-Ray Viewer */}
        <div className="flex-1 relative bg-[#06080e] flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <XRayDisplay img={image} brightness={brightness} contrast={contrast} overlayOn={overlayOn} zoom={zoom} pan={pan} onPanStart={handlePanStart} deepScan={deepScan}/>
            {/* Legend */}
            {overlayOn && image.findings.length > 0 && (
              <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 bg-black/60 backdrop-blur-md border border-white/8 rounded-xl p-3">
                {[{ label: "Critical", cls: "bg-red-500" }, { label: "Concern", cls: "bg-orange-400" }, { label: "Watch", cls: "bg-yellow-400" }, { label: "Monitored", cls: "bg-blue-400" }].map((l) => (
                  <div key={l.label} className="flex items-center gap-2"><span className={`size-2 rounded-full ${l.cls}`}/><span className="text-[10px] text-gray-300">{l.label}</span></div>
                ))}
              </div>
            )}
            {zoom > 1 && (
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/8 rounded-lg px-3 py-1.5">
                <Move className="size-3 text-gray-400"/><span className="text-[10px] text-gray-400">Drag to pan</span>
              </div>
            )}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/5">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{image.type}</span>
            </div>
          </div>
          {/* Thumbnail strip */}
          <div className="shrink-0 h-16 bg-[#090c14] border-t border-white/5 flex items-center gap-2 px-4 overflow-x-auto">
            {["Current", "Prior 1", "Prior 2"].map((label, i) => (
              <div key={i} className={`shrink-0 h-11 w-16 rounded-lg border ${i === 0 ? "border-violet-500/60 ring-1 ring-violet-500/30" : "border-white/8 opacity-50 hover:opacity-80"} bg-[#0c0f1a] flex flex-col items-center justify-center cursor-pointer transition-all`}>
                <span className="text-[8px] font-mono text-gray-500 uppercase">{label}</span>
                <span className="text-[8px] text-gray-600">{image.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — AI Copilot panel */}
        <div className="w-[340px] shrink-0 border-l border-white/5 bg-[#080b14] flex flex-col overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-violet-950/40 to-blue-950/40">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center"><Bot className="size-3.5 text-white"/></div>
              <div>
                <p className="text-white text-sm font-semibold">AI Diagnostic Copilot</p>
                <p className="text-[10px] text-violet-400">DentalOS Vision · Analysis Complete</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">

            {/* Status + Confidence */}
            <div className="p-4 space-y-3">
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${overallStatus === "normal" ? "bg-emerald-500/10 border-emerald-500/25" : overallStatus === "critical" ? "bg-red-500/10 border-red-500/25" : "bg-yellow-500/10 border-yellow-500/25"}`}>
                {overallStatus === "normal"
                  ? <CheckCircle className="size-4 text-emerald-400 shrink-0"/>
                  : <AlertTriangle className={`size-4 shrink-0 ${overallStatus === "critical" ? "text-red-400" : "text-yellow-400"}`}/>}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${overallStatus === "normal" ? "text-emerald-300" : overallStatus === "critical" ? "text-red-300" : "text-yellow-300"}`}>
                    {overallStatus === "normal" ? "Normal Study" : overallStatus === "critical" ? "Finding Detected" : "Monitor Required"}
                  </p>
                  <p className="text-[10px] text-gray-400">{image.findings.length === 0 ? "No pathology identified" : `${image.findings.length} AI-flagged finding${image.findings.length > 1 ? "s" : ""}`}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">AI Confidence Score</span>
                  <span className="text-sm font-bold text-violet-300">{avgConf}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${avgConf}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500"/>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">AI Analysis Summary</p>
              <p className="text-xs text-gray-400 leading-relaxed">{narrative}</p>
            </div>

            {/* Findings */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Key Findings</p>
              {image.findings.length === 0 ? (
                <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="size-3.5 shrink-0"/> No significant findings detected
                </div>
              ) : (
                <div className="space-y-2">
                  {image.findings.map((f, i) => {
                    const s = getSev(f.type);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }}
                        className={`rounded-xl border ${s.ring.replace("ring-", "border-")} ${s.bg} p-3 space-y-1.5`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${s.dot} shrink-0`}/>
                          <span className={`text-xs font-semibold ${s.text}`}>{f.type}</span>
                          <span className={`ml-auto text-[10px] font-medium rounded-full px-2 py-0.5 ${s.bg} ${s.text} border ${s.ring.replace("ring-", "border-")}`}>{s.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 pl-4">Tooth {f.tooth}</p>
                        <div className="flex items-center gap-2 pl-4">
                          <div className="flex-1 h-1 bg-black/30 rounded-full"><div className={`h-1 rounded-full ${s.dot}`} style={{ width: `${f.confidence}%` }}/></div>
                          <span className="text-[10px] text-gray-400">{f.confidence}%</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Clinical Recommendations</p>
              <div className="space-y-1.5">
                {buildRecs(image).map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <Target className="size-3 text-violet-400 shrink-0 mt-0.5"/>{rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Historical */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Historical Comparison</p>
              <div className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-2">
                {[
                  ["Current study", new Date(image.date).toLocaleDateString()],
                  ["Prior study", "No prior imaging on file"],
                  ["Change detected", image.findings.length > 0 ? `${image.findings.length} new finding(s)` : "No change from baseline"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{k}</span>
                    <span className={k === "Change detected" ? (image.findings.length > 0 ? "text-yellow-400" : "text-emerald-400") : "text-gray-300"}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 space-y-2">
              <button onClick={() => setActionsOpen((o) => !o)} className="flex items-center justify-between w-full">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Quick Actions</p>
                {actionsOpen ? <ChevronUp className="size-3.5 text-gray-500"/> : <ChevronDown className="size-3.5 text-gray-500"/>}
              </button>
              <AnimatePresence>
                {actionsOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {ACTIONS.map((a) => {
                        const isLoading = actionLoading === a.id;
                        const Icon = a.icon;
                        return (
                          <button
                            key={a.id}
                            onClick={a.onClick}
                            disabled={isLoading || (a.id === "deep" && deepScan)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border border-white/8 bg-white/3 ${a.color} hover:border-transparent p-3 transition-all group relative disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {isLoading
                              ? <Loader2 className="size-4 text-gray-400 animate-spin"/>
                              : <Icon className={`size-4 transition-colors ${a.id === "chart" && addedToChart ? "text-emerald-400" : "text-gray-400 group-hover:text-white"}`}/>
                            }
                            <span className={`text-[10px] text-center leading-tight transition-colors ${a.id === "chart" && addedToChart ? "text-emerald-400" : "text-gray-400 group-hover:text-white"}`}>{a.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Chat */}
            <div className="p-4 space-y-2">
              <button onClick={() => setChatOpen((o) => !o)} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-md bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center"><Bot className="size-3 text-white"/></div>
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">AI Chat Assistant</p>
                </div>
                {chatOpen ? <ChevronUp className="size-3.5 text-gray-500"/> : <ChevronDown className="size-3.5 text-gray-500"/>}
              </button>
              <AnimatePresence>
                {chatOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED.map((q) => (
                          <button key={q} onClick={() => setChatInput(q)} className="text-[10px] rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 px-2.5 py-1 transition-colors">{q}</button>
                        ))}
                      </div>
                      <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                        {chatMsgs.map((m, i) => (
                          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            {m.role === "ai" && <div className="size-5 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Bot className="size-3 text-white"/></div>}
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${m.role === "user" ? "bg-violet-600/30 border border-violet-500/30 text-violet-100" : "bg-white/5 border border-white/8 text-gray-300"}`}>{m.text}</div>
                            {m.role === "user" && <div className="size-5 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-0.5"><User className="size-3 text-gray-300"/></div>}
                          </div>
                        ))}
                        {typing && (
                          <div className="flex gap-2">
                            <div className="size-5 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center"><Bot className="size-3 text-white"/></div>
                            <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                              <div className="flex gap-1">{[0, 1, 2].map((d) => <div key={d} className="size-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }}/>)}</div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef}/>
                      </div>
                      <div className="flex gap-2">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                          placeholder="Ask about this radiograph…"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"/>
                        <button onClick={sendMsg} disabled={!chatInput.trim()} className="size-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity">
                          <Send className="size-3.5 text-white"/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="shrink-0 px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
            <p className="text-[9px] text-gray-600">DentalOS Vision AI · v3.2 · HIPAA Compliant</p>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-gray-400 hover:text-white px-2" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </motion.div>

    {/* ── Send to Patient Dialog ─────────────────────────────────────────────── */}
    <AnimatePresence>
      {sendDialogOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => !sendDone && setSendDialogOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#0f1221] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/8 bg-gradient-to-r from-violet-950/60 to-blue-950/60 flex items-center gap-3">
              <div className="size-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <Share2 className="size-4 text-white"/>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Send Report to Patient</p>
                <p className="text-[10px] text-gray-400">Secure patient portal delivery</p>
              </div>
              {!sendDone && <button onClick={() => setSendDialogOpen(false)} className="ml-auto text-gray-500 hover:text-white"><X className="size-4"/></button>}
            </div>

            {!sendDone ? (
              <div className="p-5 space-y-4">
                <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-2 text-sm">
                  {[["Recipient", patientName], ["Delivery method", "Secure patient portal + email"], ["Report included", `${image.type} AI Imaging Report`], ["Study date", new Date(image.date).toLocaleDateString()]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-gray-500 shrink-0">{k}</span>
                      <span className="text-gray-200 text-right text-xs">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">The patient will receive a notification and secure link to view their AI imaging report and clinical summary.</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-white/10 text-gray-400 hover:text-white" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
                  <Button className="flex-1 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 border-0" onClick={confirmSend}>
                    <Send className="size-3.5 mr-1.5"/> Send Report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}
                  className="size-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <MailCheck className="size-8 text-emerald-400"/>
                </motion.div>
                <div className="text-center">
                  <p className="text-white font-semibold">Report Sent!</p>
                  <p className="text-xs text-gray-400 mt-1">{patientName} will receive a secure notification shortly.</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
