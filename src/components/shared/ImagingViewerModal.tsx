"use client";

import { useState } from "react";
import { X, ZoomIn, ZoomOut, SplitSquareHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ImagingRecord } from "@/types";

export function ImagingViewerModal({
  image,
  patientName,
  onClose,
}: {
  image: ImagingRecord;
  patientName: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex"
    >
      {/* Viewer */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <p className="text-white font-medium">{patientName} — {image.type}</p>
          <p className="text-gray-400 text-sm">{new Date(image.date).toLocaleDateString()}</p>
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
            <button onClick={onClose} className="text-white hover:text-gray-300 ml-2">
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
              <p className="text-gray-400 mt-2">{image.type}</p>
            </div>
            {image.findings.map((f, i) => (
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
        {image.findings.length === 0 ? (
          <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-green-400 text-sm">
            No significant findings detected
          </div>
        ) : (
          <div className="space-y-3">
            {image.findings.map((f, i) => (
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
        <Button size="sm" className="w-full mt-4" variant="outline" onClick={onClose}>
          Close Viewer
        </Button>
      </div>
    </motion.div>
  );
}
