"use client";

import { useState } from "react";
import { X, ZoomIn, ZoomOut, SplitSquareHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePatientsStore } from "@/stores/patientsStore";

const IMAGING_TYPES = ["All", "Bitewing", "Periapical", "Panoramic", "CBCT"];

const MOCK_IMAGES = Array.from({ length: 24 }, (_, i) => ({
  id: `img-${i + 1}`,
  patientId: `PAT-${String((i % 20) + 1).padStart(4, "0")}`,
  patientName: ["Kenji Rivera", "Maria Garcia", "Tom Wilson", "Sarah Johnson", "James Rodriguez"][i % 5],
  type: (["Bitewing", "Periapical", "Panoramic", "CBCT"] as const)[i % 4],
  date: new Date(Date.now() - i * 7 * 86400000).toLocaleDateString(),
  aiStatus: i % 5 === 0 ? "Finding" : i % 3 === 0 ? "Reviewed" : "Normal",
  findings: i % 5 === 0 ? [
    { type: "Caries", tooth: "#14", confidence: 87, color: "bg-red-500" },
    { type: "Bone Loss", tooth: "#13", confidence: 72, color: "bg-orange-500" },
  ] : i % 3 === 0 ? [
    { type: "Restoration", tooth: "#30", confidence: 95, color: "bg-blue-500" },
  ] : [],
}));

const AI_STATUS_COLORS: Record<string, string> = {
  Finding: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Reviewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Normal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function ImagingPage() {
  const { patients } = usePatientsStore();
  const [typeFilter, setTypeFilter] = useState("All");
  const [patientFilter, setPatientFilter] = useState("");
  const [selected, setSelected] = useState<typeof MOCK_IMAGES[0] | null>(null);
  const [zoom, setZoom] = useState(1);

  const filtered = MOCK_IMAGES.filter((img) => {
    const matchType = typeFilter === "All" || img.type === typeFilter;
    const matchPatient = !patientFilter || img.patientName.toLowerCase().includes(patientFilter.toLowerCase());
    return matchType && matchPatient;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Imaging Gallery</h2>
        <p className="text-sm text-muted-foreground">{filtered.length} images · AI analysis enabled</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          placeholder="Search patient..."
          value={patientFilter}
          onChange={(e) => setPatientFilter(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex rounded-lg border border-border overflow-hidden">
          {IMAGING_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-sm ${typeFilter === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {filtered.map((img) => (
          <div
            key={img.id}
            className="group relative rounded-xl overflow-hidden cursor-pointer ring-1 ring-foreground/10 hover:ring-primary/50 transition-all"
            onClick={() => { setSelected(img); setZoom(1); }}
          >
            <div className="aspect-square bg-gray-900 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 p-3">
              <span className="text-gray-400 text-2xl">🦷</span>
              <p className="text-gray-300 text-xs font-mono">X-Ray</p>
              <p className="text-gray-500 text-[10px]">{img.type}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
              <p className="text-white text-xs font-medium truncate">{img.patientName}</p>
              <p className="text-gray-300 text-[10px]">{img.date}</p>
            </div>
            <div className="absolute top-2 right-2">
              <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${AI_STATUS_COLORS[img.aiStatus]}`}>
                {img.aiStatus}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full-screen Viewer Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex"
          >
            {/* Viewer */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <p className="text-white font-medium">{selected.patientName} — {selected.type}</p>
                <p className="text-gray-400 text-sm">{selected.date}</p>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="text-white hover:text-gray-300">
                    <ZoomOut className="size-5" />
                  </button>
                  <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="text-white hover:text-gray-300">
                    <ZoomIn className="size-5" />
                  </button>
                  <button className="text-white hover:text-gray-300 ml-2">
                    <SplitSquareHorizontal className="size-5" />
                  </button>
                  <button onClick={() => setSelected(null)} className="text-white hover:text-gray-300 ml-2">
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
                <div
                  className="relative bg-gray-900 rounded-xl flex items-center justify-center transition-transform duration-200"
                  style={{ width: `${400 * zoom}px`, height: `${400 * zoom}px` }}
                >
                  <div className="text-center">
                    <span className="text-8xl">🦷</span>
                    <p className="text-gray-400 mt-2">{selected.type}</p>
                  </div>
                  {/* Annotation dots */}
                  {selected.findings.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.3 }}
                      className={`absolute size-6 rounded-full ${f.color} border-2 border-white flex items-center justify-center text-white text-xs font-bold cursor-pointer`}
                      style={{ top: `${20 + i * 30}%`, left: `${30 + i * 20}%` }}
                      title={`${f.type} — Tooth ${f.tooth} (${f.confidence}%)`}
                    >
                      {i + 1}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Findings Panel */}
            <div className="w-72 border-l border-white/10 p-4 overflow-y-auto">
              <p className="text-white font-semibold mb-3">🤖 AI Findings</p>
              {selected.findings.length === 0 ? (
                <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-green-400 text-sm">
                  No significant findings detected
                </div>
              ) : (
                <div className="space-y-3">
                  {selected.findings.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.3 }}
                      className="rounded-lg bg-white/5 border border-white/10 p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`size-2 rounded-full ${f.color}`} />
                        <p className="text-white font-medium">{f.type}</p>
                      </div>
                      <p className="text-gray-400 text-xs">Tooth {f.tooth}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${f.color}`} style={{ width: `${f.confidence}%` }} />
                        </div>
                        <span className="text-gray-300 text-xs">{f.confidence}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <Button size="sm" className="w-full mt-4" variant="outline" onClick={() => setSelected(null)}>
                Close Viewer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
