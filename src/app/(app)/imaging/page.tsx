"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, Activity, Brain } from "lucide-react";
import { usePatientsStore } from "@/stores/patientsStore";
import { useImagingStore } from "@/stores/imagingStore";
import { ImagingViewerModal } from "@/components/shared/ImagingViewerModal";
import type { ImagingRecord } from "@/types";

const IMAGING_TYPES = ["All", "Bitewing", "Periapical", "Panoramic", "CBCT"];

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  Finding:  { label: "Finding",  badge: "bg-red-500/20 text-red-400 border-red-500/30",    dot: "bg-red-500" },
  Reviewed: { label: "Reviewed", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",  dot: "bg-blue-500" },
  Normal:   { label: "Normal",   badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500" },
};

// Deterministic mini X-ray thumbnail SVG per image type
function XRayThumb({ type, seed, aiStatus }: { type: string; seed: number; aiStatus: string }) {
  const shapes: Record<string, React.ReactNode> = {
    Bitewing: (
      <g>
        {[14,34,54,74].map((x, i) => (
          <g key={i}>
            <rect x={x} y={12} width={14} height={22} rx={2} fill={`hsl(0,0%,${52+i*4}%)`}/>
            <rect x={x+2} y={34} width={4} height={14} rx={1} fill={`hsl(0,0%,${40+i*3}%)`} opacity={0.7}/>
            <rect x={x+8} y={34} width={4} height={14} rx={1} fill={`hsl(0,0%,${40+i*3}%)`} opacity={0.7}/>
            <rect x={x+1} y={52} width={12} height={18} rx={2} fill={`hsl(0,0%,${48+i*4}%)`}/>
          </g>
        ))}
        <rect x={10} y={35} width={82} height={3} rx={1} fill="hsl(0,0%,62%)" opacity={0.35}/>
      </g>
    ),
    Periapical: (
      <g>
        <rect x={38} y={8} width={26} height={36} rx={3} fill="hsl(0,0%,60%)"/>
        <path d="M46,44 Q42,62 44,80" stroke="hsl(0,0%,55%)" strokeWidth={4} fill="none" strokeLinecap="round"/>
        <path d="M56,44 Q60,62 58,80" stroke="hsl(0,0%,55%)" strokeWidth={4} fill="none" strokeLinecap="round"/>
        <rect x={18} y={42} width={66} height={45} rx={2} fill="hsl(0,0%,26%)" opacity={0.5}/>
        <rect x={14} y={8} width={18} height={32} rx={2} fill="hsl(0,0%,45%)" opacity={0.6}/>
        <rect x={70} y={8} width={18} height={32} rx={2} fill="hsl(0,0%,45%)" opacity={0.6}/>
      </g>
    ),
    Panoramic: (
      <g>
        {Array.from({length:11},(_,i)=>(
          <rect key={i} x={7+i*9} y={20} width={6} height={14+Math.sin(i*0.6)*4} rx={1} fill={`hsl(0,0%,${50+Math.abs(5-i)*2}%)`}/>
        ))}
        <ellipse cx={51} cy={36} rx={46} ry={5} fill="hsl(0,0%,36%)" opacity={0.4}/>
        {Array.from({length:11},(_,i)=>(
          <rect key={i} x={7+i*9} y={42} width={6} height={14+Math.sin(i*0.6)*4} rx={1} fill={`hsl(0,0%,46+Math.abs(5-i)*2}%)`}/>
        ))}
        <ellipse cx={8} cy={14} rx={6} ry={9} fill="hsl(0,0%,42%)" opacity={0.7}/>
        <ellipse cx={94} cy={14} rx={6} ry={9} fill="hsl(0,0%,42%)" opacity={0.7}/>
        <ellipse cx={30} cy={12} rx={18} ry={8} fill="hsl(0,0%,20%)" opacity={0.45}/>
        <ellipse cx={72} cy={12} rx={18} ry={8} fill="hsl(0,0%,20%)" opacity={0.45}/>
      </g>
    ),
    CBCT: (
      <g>
        <ellipse cx={51} cy={48} rx={38} ry={28} fill="none" stroke="hsl(0,0%,28%)" strokeWidth={1.5}/>
        <ellipse cx={51} cy={48} rx={28} ry={20} fill="hsl(0,0%,18%)" opacity={0.8}/>
        {Array.from({length:6},(_,i)=>{
          const a = -75+i*30; const cx2=51+26*Math.cos(a*Math.PI/180); const cy2=38+16*Math.sin(a*Math.PI/180);
          return <ellipse key={i} cx={cx2} cy={cy2} rx={5} ry={3.5} fill={`hsl(0,0%,${60+i}%)`} transform={`rotate(${a},${cx2},${cy2})`}/>;
        })}
        {Array.from({length:6},(_,i)=>{
          const a = 105+i*30; const cx2=51+24*Math.cos(a*Math.PI/180); const cy2=58+14*Math.sin(a*Math.PI/180);
          return <ellipse key={i} cx={cx2} cy={cy2} rx={4.5} ry={3} fill={`hsl(0,0%,${55+i}%)`} transform={`rotate(${a},${cx2},${cy2})`}/>;
        })}
        <path d="M22,62 Q35,66 51,65 Q67,66 80,62" stroke="hsl(0,0%,48%)" strokeWidth={1.5} fill="none" strokeDasharray="3,2" opacity={0.7}/>
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 102 90" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `brightness(${0.85 + (seed % 20) * 0.008}) contrast(${1.05 + (seed % 10) * 0.01}) grayscale(1)` }}>
      <rect width={102} height={90} fill="#06080e"/>
      <radialGradient id={`vig${seed}`} cx="50%" cy="50%" r="65%">
        <stop offset="0%" stopColor="transparent"/>
        <stop offset="100%" stopColor="#000" stopOpacity="0.5"/>
      </radialGradient>
      {shapes[type] ?? shapes.Bitewing}
      <rect width={102} height={90} fill={`url(#vig${seed})`}/>

      {/* Finding overlay dot */}
      {aiStatus === "Finding" && (
        <circle cx={30+seed%40} cy={22+seed%30} r={4} fill="#ef4444" opacity={0.85}>
          <animate attributeName="opacity" values="0.85;0.4;0.85" dur="2s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  );
}

export default function ImagingPage() {
  const router = useRouter();
  const { patients } = usePatientsStore();
  const { images } = useImagingStore();
  const [typeFilter, setTypeFilter] = useState("All");
  const [patientFilter, setPatientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<ImagingRecord | null>(null);

  const patientName = (patientId: string) => {
    const p = patients.find((pt) => pt.id === patientId);
    return p ? `${p.firstName} ${p.lastName}` : patientId;
  };

  const filtered = images.filter((img) => {
    const matchType   = typeFilter === "All" || img.type === typeFilter;
    const matchStatus = statusFilter === "All" || img.aiStatus === statusFilter;
    const matchPt     = !patientFilter || patientName(img.patientId).toLowerCase().includes(patientFilter.toLowerCase());
    return matchType && matchStatus && matchPt;
  });

  const findings  = images.filter((i) => i.aiStatus === "Finding").length;
  const reviewed  = images.filter((i) => i.aiStatus === "Reviewed").length;
  const normal    = images.filter((i) => i.aiStatus === "Normal").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Brain className="size-5 text-violet-500"/>
            <h2 className="text-xl font-bold">AI Imaging Gallery</h2>
          </div>
          <p className="text-sm text-muted-foreground">{images.length} radiographs · AI analysis enabled · Synced to patient charts</p>
        </div>

        {/* Stats chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/25 px-3 py-1 text-xs text-red-400">
            <span className="size-1.5 rounded-full bg-red-500 animate-pulse"/>
            {findings} Findings
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 px-3 py-1 text-xs text-blue-400">
            <span className="size-1.5 rounded-full bg-blue-500"/>
            {reviewed} Reviewed
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500"/>
            {normal} Normal
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"/>
          <input
            placeholder="Search patient..."
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48"
          />
        </div>
        {/* Type filter pills */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {IMAGING_TYPES.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {["All", "Finding", "Reviewed", "Normal"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <SlidersHorizontal className="size-3.5"/>
          {filtered.length} results
        </div>
      </div>

      {/* Image Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-2xl border-2 border-dashed border-border">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
            <Activity className="size-7 text-muted-foreground"/>
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">No Image Loaded</p>
            <p className="text-sm text-muted-foreground mt-1">Upload or select a dental scan · AI Analysis Ready</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map((img, idx) => {
            const seed = img.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
            const sc = STATUS_CONFIG[img.aiStatus] ?? STATUS_CONFIG.Normal;
            const avgConf = img.findings.length > 0
              ? Math.round(img.findings.reduce((s, f) => s + f.confidence, 0) / img.findings.length)
              : 97 - (seed % 8);
            const name = patientName(img.patientId);

            return (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="group relative rounded-xl overflow-hidden cursor-pointer bg-[#06080e] ring-1 ring-white/8 hover:ring-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-200"
                onClick={() => setSelected(img)}
              >
                {/* X-ray thumbnail */}
                <div className="aspect-square relative overflow-hidden">
                  <XRayThumb type={img.type} seed={seed} aiStatus={img.aiStatus}/>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"/>

                  {/* Patient name on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <button
                      className="text-white text-[10px] font-medium truncate w-full text-left hover:underline"
                      onClick={(e) => { e.stopPropagation(); router.push(`/patients/${img.patientId}`); }}
                    >
                      {name}
                    </button>
                    <p className="text-gray-400 text-[9px]">{new Date(img.date).toLocaleDateString()}</p>
                  </div>

                  {/* AI status badge top-right */}
                  <div className="absolute top-2 right-2">
                    <span className={`flex items-center gap-1 text-[9px] font-medium rounded-full px-1.5 py-0.5 border backdrop-blur-sm ${sc.badge}`}>
                      <span className={`size-1.5 rounded-full ${sc.dot}`}/>
                      {sc.label}
                    </span>
                  </div>

                  {/* Scan type top-left */}
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] font-mono text-gray-500 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                      {img.type}
                    </span>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-2.5 py-2 bg-[#090c14] border-t border-white/5 space-y-1">
                  <p className="text-[10px] text-gray-300 font-medium truncate">{name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500">{new Date(img.date).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"2-digit"})}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-1 rounded-full bg-violet-500" style={{ width: `${avgConf}%` }}/>
                      </div>
                      <span className="text-[9px] text-violet-400 font-medium">{avgConf}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Viewer Modal */}
      <AnimatePresence>
        {selected && (
          <ImagingViewerModal
            image={selected}
            patientName={patientName(selected.patientId)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
