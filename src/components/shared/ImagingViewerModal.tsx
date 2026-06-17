"use client";

import { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, SplitSquareHorizontal, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ImagingRecord } from "@/types";

// Deterministic AI narrative based on findings
function generateAiNarrative(image: ImagingRecord): string {
  if (image.findings.length === 0) {
    return `${image.type} radiograph reviewed with no significant pathology detected. Bone levels appear within normal limits. No caries, periapical lesions, or restorative concerns identified. Recommend routine monitoring at next scheduled visit.`;
  }
  const parts = image.findings.map((f) => {
    if (f.type === "Caries") return `Carious lesion detected on tooth ${f.tooth} with ${f.confidence}% confidence. Early intervention recommended to prevent pulpal involvement.`;
    if (f.type === "Bone Loss") return `Alveolar bone loss noted around tooth ${f.tooth} (${f.confidence}% confidence). Periodontal evaluation advised.`;
    if (f.type === "Restoration") return `Existing restoration noted on tooth ${f.tooth} (${f.confidence}% confidence). Margins appear intact; no secondary caries detected.`;
    if (f.type === "Impaction") return `Impacted tooth ${f.tooth} identified (${f.confidence}% confidence). Surgical consultation recommended.`;
    return `${f.type} noted on tooth ${f.tooth} (${f.confidence}% confidence).`;
  });
  return `${image.type} radiograph analysis complete. AI detected ${image.findings.length} finding${image.findings.length > 1 ? "s" : ""}: ${parts.join(" ")} Clinical correlation recommended before treatment planning.`;
}

// Mock chatbot responses keyed to common questions
function getAiChatResponse(message: string, image: ImagingRecord): string {
  const lower = message.toLowerCase();
  const findingTypes = image.findings.map((f) => f.type.toLowerCase());

  if (lower.includes("what") && (lower.includes("find") || lower.includes("see") || lower.includes("detect"))) {
    if (image.findings.length === 0) return "No significant findings were detected in this image. All areas appear within normal radiographic limits.";
    return `I detected ${image.findings.length} finding(s): ${image.findings.map((f) => `${f.type} on tooth ${f.tooth}`).join(", ")}. Would you like details on any specific finding?`;
  }
  if (lower.includes("caries") || lower.includes("cavity") || lower.includes("decay")) {
    const c = image.findings.filter((f) => f.type === "Caries");
    if (c.length === 0) return "No caries were detected in this radiograph. The tooth structure appears intact.";
    return `${c.length} carious lesion(s) detected: ${c.map((f) => `tooth ${f.tooth} (${f.confidence}% confidence)`).join(", ")}. Recommend composite or amalgam restoration depending on depth.`;
  }
  if (lower.includes("bone loss") || lower.includes("periodont")) {
    const b = image.findings.filter((f) => f.type === "Bone Loss");
    if (b.length === 0) return "No bone loss detected. Crestal bone levels appear within normal limits on this image.";
    return `Bone loss noted around: ${b.map((f) => `tooth ${f.tooth} (${f.confidence}% confidence)`).join(", ")}. Comprehensive periodontal charting and probing recommended.`;
  }
  if (lower.includes("treatment") || lower.includes("next step") || lower.includes("recommend")) {
    if (image.findings.length === 0) return "No treatment is indicated based on this radiograph. Continue routine preventive care and recall schedule.";
    const steps = image.findings.map((f) => {
      if (f.type === "Caries") return `Restoration for tooth ${f.tooth}`;
      if (f.type === "Bone Loss") return `Periodontal therapy for tooth ${f.tooth}`;
      if (f.type === "Impaction") return `Surgical evaluation for tooth ${f.tooth}`;
      if (f.type === "Restoration") return `Monitor restoration on tooth ${f.tooth}`;
      return `Clinical evaluation for ${f.type} on tooth ${f.tooth}`;
    });
    return `Recommended next steps: ${steps.join("; ")}. Please correlate with clinical examination before finalizing treatment plan.`;
  }
  if (lower.includes("urgent") || lower.includes("emergency") || lower.includes("immediate")) {
    const urgent = image.findings.filter((f) => ["Caries", "Impaction"].includes(f.type) && f.confidence > 80);
    if (urgent.length === 0) return "No immediate emergency concerns detected. Schedule routine follow-up within 3-6 months.";
    return `Urgent attention may be needed for: ${urgent.map((f) => `${f.type} on tooth ${f.tooth}`).join(", ")}. Consider prioritizing this patient's appointment.`;
  }
  if (lower.includes("confidence") || lower.includes("accurate") || lower.includes("sure")) {
    if (image.findings.length === 0) return "The AI model analyzed this image with high confidence. No abnormalities were flagged.";
    const avg = Math.round(image.findings.reduce((s, f) => s + f.confidence, 0) / image.findings.length);
    return `Average AI confidence for findings in this image is ${avg}%. All findings with >70% confidence are flagged for clinical review. Always correlate with intraoral examination.`;
  }
  if (lower.includes("type") || lower.includes("xray") || lower.includes("x-ray") || lower.includes("image")) {
    return `This is a ${image.type} radiograph taken on ${new Date(image.date).toLocaleDateString()}. ${image.type === "Bitewing" ? "Bitewing radiographs are ideal for detecting interproximal caries and bone levels between posterior teeth." : image.type === "Panoramic" ? "Panoramic radiographs provide a broad overview of the entire dentition, jaws, and surrounding structures." : image.type === "Periapical" ? "Periapical radiographs show the full tooth including root and surrounding bone — ideal for diagnosing periapical pathology." : "CBCT provides three-dimensional imaging for complex implant planning, impactions, and TMJ analysis."}`;
  }
  if (lower.includes("periapical lesion") || lower.includes("periapical")) {
    const hasPA = image.findings.some((f) => f.type === "Caries" && f.confidence > 75);
    return hasPA
      ? `Periapical pathology is suspected based on the density patterns around the apex regions. Recommend periapical radiograph series for targeted evaluation of the affected tooth/teeth. ${image.findings.filter((f) => f.type === "Caries").map((f) => `Tooth ${f.tooth}`).join(", ")} should be prioritized.`
      : `No periapical radiolucency or rarefying osteitis detected in this ${image.type} view. Apical areas appear radiographically normal. Lamina dura continuity appears intact at visible apices.`;
  }
  if (lower.includes("interproximal") || lower.includes("proximal caries") || lower.includes("contact area")) {
    const caries = image.findings.filter((f) => f.type === "Caries");
    return caries.length > 0
      ? `Interproximal carious lesions detected: ${caries.map((f) => `${f.tooth} (${f.confidence}% confidence)`).join(", ")}. Lesion depth appears to extend into dentin based on radiolucency pattern. Bitewing series recommended for full interproximal survey.`
      : `No interproximal caries detected. Contact areas appear radiographically intact. Enamel density at proximal surfaces is within normal limits on this view.`;
  }
  if (lower.includes("bone density") || lower.includes("trabecular") || lower.includes("cancellous")) {
    const boneLoss = image.findings.filter((f) => f.type === "Bone Loss");
    return boneLoss.length > 0
      ? `Reduced bone density observed. Alveolar bone loss noted around: ${boneLoss.map((f) => `tooth ${f.tooth}`).join(", ")}. Trabecular pattern appears coarser than normal, suggesting chronic periodontal involvement. Crestal bone levels are below the CEJ by estimated 2–4mm in affected areas. CBCT may be warranted for 3D bone volume assessment.`
      : `Trabecular bone pattern appears within normal limits. Cancellous bone density is adequate. No horizontal or vertical bone loss identified. Crestal bone levels are at an appropriate distance from the CEJ.`;
  }
  if (lower.includes("root morphology") || lower.includes("root canal") || lower.includes("root length") || lower.includes("root shape")) {
    return `Root morphology on this ${image.type} view shows standard anatomical form. Root length and taper appear within normal range for visible teeth. ${image.findings.some((f) => f.type === "Impaction") ? `Note: Impacted root detected on tooth ${image.findings.find((f) => f.type === "Impaction")?.tooth} — 3D CBCT imaging recommended to fully assess root position and proximity to anatomical structures.` : "No root resorption, dilaceration, or hypercementosis detected. Root canal spaces appear of normal width."}`;
  }
  if (lower.includes("lamina dura") || lower.includes("lamina")) {
    const hasPA = image.findings.some((f) => ["Caries", "Bone Loss"].includes(f.type));
    return hasPA
      ? `Lamina dura continuity is disrupted or indistinct around affected teeth — ${image.findings.map((f) => `tooth ${f.tooth}`).join(", ")}. Loss of lamina dura may indicate periapical inflammation or periodontal disease. Correlate with clinical probing and pulp vitality testing.`
      : `Lamina dura appears continuous and intact around visible tooth apices. This is a positive indicator of normal periapical bone health. No evidence of widening or discontinuity detected.`;
  }
  if (lower.includes("pdl") || lower.includes("periodontal ligament") || lower.includes("pdl space") || lower.includes("widening")) {
    const boneLoss = image.findings.filter((f) => f.type === "Bone Loss");
    return boneLoss.length > 0
      ? `PDL space widening is noted in areas corresponding to bone loss findings (${boneLoss.map((f) => `tooth ${f.tooth}`).join(", ")}). Widened PDL space can indicate occlusal trauma, early periapical pathology, or systemic conditions. Recommend occlusal analysis and periodontal probing to correlate.`
      : `Periodontal ligament space appears uniform and within normal radiographic width (0.15–0.38 mm range). No evidence of PDL space widening or narrowing detected. Normal attachment apparatus indicated.`;
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hello! I'm the DentalOS AI Imaging Assistant. I've analyzed this ${image.type} radiograph from ${new Date(image.date).toLocaleDateString()}. Ask me about findings, treatment recommendations, or anything related to this image.`;
  }
  return `I'm analyzing the ${image.type} radiograph. ${image.findings.length > 0 ? `This image has ${image.findings.length} AI-detected finding(s). ` : "No significant findings were detected. "}Feel free to ask about specific findings, treatment options, urgency, or confidence levels.`;
}

interface ChatMessage { role: "user" | "ai"; text: string; }

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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "ai", text: `Hi! I've analyzed this ${image.type} radiograph. ${image.findings.length === 0 ? "No significant findings detected." : `I found ${image.findings.length} item(s) to review.`} Ask me anything about this image.` },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const narrative = generateAiNarrative(image);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      const reply = getAiChatResponse(text, image);
      setChatMessages((prev) => [...prev, { role: "ai", text: reply }]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex"
    >
      {/* Main Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
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
            <button
              onClick={() => setChatOpen((o) => !o)}
              className={`ml-2 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${chatOpen ? "bg-primary text-primary-foreground" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              <Bot className="size-4 inline-block mr-1 -mt-0.5" />AI Chat
            </button>
            <button onClick={onClose} className="text-white hover:text-gray-300 ml-2">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Image Area */}
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

      {/* Right Panel — AI Findings + Narrative */}
      <div className="w-72 border-l border-white/10 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-white font-semibold">🤖 AI Findings</p>

          {/* AI Narrative */}
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-3">
            <p className="text-primary text-xs font-medium mb-1">AI Analysis Summary</p>
            <p className="text-gray-300 text-xs leading-relaxed">{narrative}</p>
          </div>

          {/* Individual findings */}
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
        </div>
        <div className="p-4 border-t border-white/10">
          <Button size="sm" className="w-full" variant="outline" onClick={onClose}>
            Close Viewer
          </Button>
        </div>
      </div>

      {/* AI Chat Panel (slides in from right) */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-l border-white/10 flex flex-col bg-gray-950 overflow-hidden"
          >
            {/* Chat header */}
            <div className="flex items-center gap-2 p-3 border-b border-white/10">
              <Bot className="size-4 text-primary" />
              <p className="text-white text-sm font-medium">AI Imaging Assistant</p>
              <button onClick={() => setChatOpen(false)} className="ml-auto text-gray-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="size-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-gray-200"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.role === "user" && (
                    <div className="size-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="size-3 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="size-3 text-primary" />
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-xs text-gray-400">
                    <span className="animate-pulse">AI is analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested questions */}
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {[
                "Any periapical lesions?",
                "Check interproximal caries",
                "Bone density status?",
                "Root morphology normal?",
                "Lamina dura intact?",
                "PDL space widening?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setChatInput(q); }}
                  className="text-[10px] rounded-full bg-white/10 text-gray-300 hover:bg-primary/20 hover:text-primary px-2 py-0.5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about this X-ray..."
                className="flex-1 bg-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-500"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
