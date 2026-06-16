"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { usePatientsStore } from "@/stores/patientsStore";
import { useImagingStore } from "@/stores/imagingStore";
import { ImagingViewerModal } from "@/components/shared/ImagingViewerModal";
import type { ImagingRecord } from "@/types";

const IMAGING_TYPES = ["All", "Bitewing", "Periapical", "Panoramic", "CBCT"];

const AI_STATUS_COLORS: Record<string, string> = {
  Finding: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Reviewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Normal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function ImagingPage() {
  const router = useRouter();
  const { patients } = usePatientsStore();
  const { images } = useImagingStore();
  const [typeFilter, setTypeFilter] = useState("All");
  const [patientFilter, setPatientFilter] = useState("");
  const [selected, setSelected] = useState<ImagingRecord | null>(null);

  const patientName = (patientId: string) => {
    const p = patients.find((pt) => pt.id === patientId);
    return p ? `${p.firstName} ${p.lastName}` : patientId;
  };

  const filtered = images.filter((img) => {
    const matchType = typeFilter === "All" || img.type === typeFilter;
    const matchPatient = !patientFilter || patientName(img.patientId).toLowerCase().includes(patientFilter.toLowerCase());
    return matchType && matchPatient;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Imaging Gallery</h2>
        <p className="text-sm text-muted-foreground">{filtered.length} images · AI analysis enabled · Synced to each patient&apos;s chart</p>
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
            onClick={() => setSelected(img)}
          >
            <div className="aspect-square bg-gray-900 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 p-3">
              <span className="text-gray-400 text-2xl">🦷</span>
              <p className="text-gray-300 text-xs font-mono">X-Ray</p>
              <p className="text-gray-500 text-[10px]">{img.type}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform text-left"
              onClick={(e) => { e.stopPropagation(); router.push(`/patients/${img.patientId}`); }}
              title="Open patient chart"
            >
              <p className="text-white text-xs font-medium truncate hover:underline">{patientName(img.patientId)}</p>
              <p className="text-gray-300 text-[10px]">{new Date(img.date).toLocaleDateString()}</p>
            </button>
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
          <ImagingViewerModal image={selected} patientName={patientName(selected.patientId)} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
