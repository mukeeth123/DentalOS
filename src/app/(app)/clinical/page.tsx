"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, FileText, Plus, X, Sparkles, Save, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePatientsStore } from "@/stores/patientsStore";
import { formatDate } from "@/lib/utils";
import { useCanEdit } from "@/hooks/usePermission";
import { toast } from "sonner";

/* ─── Mock data ─────────────────────────────────────────────────────────────── */
const MOCK_TRANSCRIPT = `Dr. Martinez: Patient presents with sensitivity on upper left molar, tooth number fourteen. Patient rates pain seven out of ten. Sensitivity to cold and sweet foods started approximately three weeks ago. No visible swelling. Percussion test positive. Thermal test confirms pulpal involvement. X-ray shows periapical radiolucency. Recommending root canal treatment followed by crown placement. Patient agrees to proceed. Prescribed ibuprofen 400mg for pain management.`;

const MOCK_SOAP = `**S (Subjective):**
Patient reports 3-week history of sensitivity on UL molar (#14). Pain rated 7/10. Sensitivity to cold and sweet stimuli. No spontaneous pain.

**O (Objective):**
- Tooth #14: Percussion positive, Thermal test positive
- Periapical radiolucency visible on PA X-ray
- No visible swelling or sinus tract

**A (Assessment):**
Irreversible pulpitis with periapical periodontitis — Tooth #14

**P (Plan):**
1. Root canal therapy — Tooth #14 (D3310)
2. Crown placement post-RCT (D2740)
3. Ibuprofen 400mg PRN for pain management
4. Follow-up in 2 weeks
5. Refer to endodontist if needed`;

const NOTE_TYPES = [
  "Examination", "Cleaning / Prophylaxis", "Filling", "Root Canal",
  "Crown Prep", "Extraction", "Implant Consult", "Orthodontic Visit",
  "Emergency Visit", "Follow-up", "Treatment Planning", "Other",
];

const AI_SOAP_TEMPLATES: Record<string, { subjective: string; objective: string; assessment: string; plan: string }> = {
  "Examination": {
    subjective: "Patient presents for routine examination. No chief complaint today. Reports brushing twice daily and flossing regularly.",
    objective: "Full mouth examination performed. 28 teeth present. No visible caries. Mild plaque accumulation. Gingival tissues appear healthy with no bleeding on probing.",
    assessment: "Healthy dentition. Mild gingivitis localized to posterior regions.",
    plan: "1. Adult prophylaxis (D1110)\n2. Fluoride varnish applied\n3. Patient educated on flossing technique\n4. Recall in 6 months",
  },
  "Filling": {
    subjective: "Patient reports sensitivity to cold on lower right molar for approximately 2 weeks. No spontaneous pain.",
    objective: "Tooth #30: Caries detected on mesial surface. Percussion negative. Cold test mildly positive, resolves quickly. No periapical pathology on X-ray.",
    assessment: "Dental caries — Tooth #30, mesial surface. Reversible pulpitis.",
    plan: "1. Composite resin restoration — Tooth #30, 2 surfaces (D2392)\n2. Local anesthesia administered\n3. Patient to return if sensitivity worsens\n4. Recall in 6 months",
  },
  "Root Canal": {
    subjective: "Patient presents with severe throbbing pain on upper left molar for 5 days. Pain is 9/10, spontaneous, and wakes patient at night. Pain relief with cold.",
    objective: "Tooth #14: Crown intact. Percussion severely positive. Cold test: lingering pain >30 seconds. Periapical radiolucency noted on PA X-ray. Swelling present on buccal mucosa.",
    assessment: "Irreversible pulpitis with periapical periodontitis — Tooth #14. Abscess formation.",
    plan: "1. Root canal therapy initiated — Tooth #14 (D3330)\n2. Local anesthesia: 2 carpules lidocaine 2%\n3. Working length established: 21mm\n4. Amoxicillin 500mg TID × 7 days\n5. Ibuprofen 400mg PRN pain\n6. Return for obturation next visit",
  },
  "Cleaning / Prophylaxis": {
    subjective: "Patient presents for routine cleaning. Reports occasional bleeding when brushing. Last cleaning was 12 months ago.",
    objective: "Plaque index: 2.1 (moderate). Bleeding on probing: 30% of sites. Pocket depths: 2-4mm throughout. No mobility noted. Calculus deposits present subgingivally on lower anteriors.",
    assessment: "Generalized moderate gingivitis. Localized plaque-induced periodontitis Stage I.",
    plan: "1. Adult prophylaxis completed (D1110)\n2. Scaling and polishing performed\n3. Fluoride varnish applied (D1208)\n4. OHI: Modified Bass technique demonstrated\n5. Recall in 4 months due to gingivitis",
  },
  "Emergency Visit": {
    subjective: "Patient presents as emergency walk-in with acute pain on lower left quadrant. Pain rated 8/10, constant, throbbing. Onset 2 days ago. OTC ibuprofen provided minimal relief.",
    objective: "Tooth #19: Fracture line visible on buccal cusp. Percussion positive. Bite test positive on buccal cusp. Cold test: extreme pain, not lingering. No periapical pathology on X-ray.",
    assessment: "Cracked tooth syndrome — Tooth #19. Possible partial pulp involvement.",
    plan: "1. Emergency palliative treatment provided\n2. Temp crown placed to protect fracture\n3. Options discussed: Full crown or extraction\n4. Ibuprofen 600mg Q6H prescribed\n5. Return in 1 week for definitive treatment",
  },
};

/* ─── New Note Dialog ────────────────────────────────────────────────────────── */
interface NoteEntry {
  id: string;
  date: string;
  patientName: string;
  type: string;
  tooth?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  provider: string;
}

function NewNoteDialog({
  open,
  onClose,
  defaultPatientId,
  patients,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  defaultPatientId: string;
  patients: { id: string; firstName: string; lastName: string }[];
  onSave: (note: NoteEntry) => void;
}) {
  const [patientId, setPatientId] = useState(defaultPatientId);
  const [noteType, setNoteType] = useState("Examination");
  const [tooth, setTooth] = useState("");
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [soapExpanded, setSoapExpanded] = useState(true);

  // Reset when opened with new patient
  useEffect(() => {
    if (open) {
      setPatientId(defaultPatientId);
      setNoteType("Examination");
      setTooth("");
      setSubjective("");
      setObjective("");
      setAssessment("");
      setPlan("");
    }
  }, [open, defaultPatientId]);

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const template = AI_SOAP_TEMPLATES[noteType] ?? AI_SOAP_TEMPLATES["Examination"];
    setSubjective(template.subjective);
    setObjective(template.objective);
    setAssessment(template.assessment);
    setPlan(template.plan);
    setAiGenerating(false);
    setSoapExpanded(true);
    toast.success("AI generated SOAP note for " + noteType);
  };

  const handleSave = () => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) { toast.error("Please select a patient"); return; }
    if (!subjective && !objective && !assessment && !plan) {
      toast.error("Please fill in at least one SOAP field or use AI Generate");
      return;
    }
    const note: NoteEntry = {
      id: `NOTE-${Date.now()}`,
      date: new Date().toISOString(),
      patientName: `${patient.firstName} ${patient.lastName}`,
      type: noteType,
      tooth: tooth || undefined,
      subjective,
      objective,
      assessment,
      plan,
      provider: "Dr. Sarah Martinez",
    };
    onSave(note);
    toast.success(`Clinical note saved for ${note.patientName}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            New Clinical Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Patient + Note Type row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Patient *</Label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select patient...</option>
                {patients.slice(0, 50).map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Visit Type *</Label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {NOTE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Tooth + Provider row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Tooth # <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="e.g. 14, 30, UL6..."
                value={tooth}
                onChange={(e) => setTooth(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Provider</Label>
              <Input defaultValue="Dr. Sarah Martinez" disabled className="opacity-60" />
            </div>
          </div>

          {/* AI Generate */}
          <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary" /> AI SOAP Generator
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auto-fill SOAP note based on visit type: <strong>{noteType}</strong>
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAIGenerate}
              disabled={aiGenerating}
              className="shrink-0"
            >
              {aiGenerating ? (
                <><span className="size-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="size-3.5" /> Generate</>
              )}
            </Button>
          </div>

          {/* SOAP Fields */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSoapExpanded(!soapExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 text-sm font-semibold hover:bg-muted/60 transition-colors"
            >
              <span>SOAP Note Fields</span>
              {soapExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {soapExpanded && (
              <div className="p-4 space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                    S — Subjective <span className="normal-case font-normal">(patient-reported symptoms)</span>
                  </Label>
                  <Textarea
                    placeholder="Chief complaint, pain description, duration, triggers..."
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    className="min-h-[72px] resize-none text-sm"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                    O — Objective <span className="normal-case font-normal">(clinical findings)</span>
                  </Label>
                  <Textarea
                    placeholder="Clinical observations, exam findings, vitals, test results..."
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="min-h-[72px] resize-none text-sm"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                    A — Assessment <span className="normal-case font-normal">(diagnosis)</span>
                  </Label>
                  <Textarea
                    placeholder="Diagnosis, ICD codes, differential diagnoses..."
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    className="min-h-[56px] resize-none text-sm"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                    P — Plan <span className="normal-case font-normal">(treatment)</span>
                  </Label>
                  <Textarea
                    placeholder="Treatment performed, procedures, prescriptions, follow-up instructions..."
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="min-h-[72px] resize-none text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="size-4" /> Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Clinical Page ─────────────────────────────────────────────────────── */
export default function ClinicalPage() {
  const { patients } = usePatientsStore();
  const canEdit = useCanEdit("Clinical");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? "");
  const [patientSearch, setPatientSearch] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [soapWords, setSoapWords] = useState<string[]>([]);
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState<NoteEntry[]>([]);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const soapRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 8);

  // Notes for selected patient (saved + from history)
  const patientSavedNotes = savedNotes.filter((n) => n.patientName === `${selectedPatient?.firstName} ${selectedPatient?.lastName}`);

  const handleRecord = () => {
    if (recording) {
      setRecording(false);
      setTranscriptVisible(true);
      setTimeout(() => {
        const words = MOCK_SOAP.split(" ");
        setSoapWords([]);
        let i = 0;
        soapRef.current = setInterval(() => {
          if (i >= words.length) { clearInterval(soapRef.current!); return; }
          setSoapWords((prev) => [...prev, words[i]]);
          i++;
        }, 40);
      }, 1500);
    } else {
      setRecording(true);
      setTranscriptVisible(false);
      setSoapWords([]);
    }
  };

  useEffect(() => {
    return () => { if (soapRef.current) clearInterval(soapRef.current); };
  }, []);

  const displaySoap = soapWords.join(" ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Clinical Notes</h2>
          <p className="text-sm text-muted-foreground">SOAP notes, treatment plans &amp; AI Scribe</p>
        </div>
        {canEdit && (
          <Button onClick={() => setNewNoteOpen(true)}>
            <Plus className="size-4" /> New Note
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selector */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Select Patient</p>
              <input
                placeholder="Search patient..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatientId(p.id); setPatientSearch(""); }}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${selectedPatientId === p.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
                  >
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedPatient && (
            <Card>
              <CardContent className="pt-4">
                <p className="font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p className="text-xs text-muted-foreground">{selectedPatient.age}y · {selectedPatient.gender}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedPatient.allergies.map((a) => (
                    <span key={a} className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full px-1.5 py-0.5">{a}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Last visit: {formatDate(selectedPatient.lastVisit)}</p>
                {canEdit && (
                  <Button size="sm" className="w-full mt-3" onClick={() => setNewNoteOpen(true)}>
                    <Plus className="size-3.5" /> Add Note for {selectedPatient.firstName}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Scribe + Notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Scribe Card */}
          <Card className={recording ? "ring-2 ring-red-400 dark:ring-red-600" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                AI Scribe
                {recording && <span className="size-2 rounded-full bg-red-500 animate-pulse" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  onClick={handleRecord}
                  variant={recording ? "destructive" : "default"}
                  className="gap-2"
                >
                  {recording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  {recording ? "Stop Recording" : "Start Recording"}
                </Button>
                {recording && (
                  <motion.div
                    className="flex items-center gap-1"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    {[3, 5, 4, 6, 3, 5].map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-red-500"
                        animate={{ height: [`${h * 4}px`, `${h * 8}px`, `${h * 4}px`] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {recording && (
                <p className="text-sm text-muted-foreground italic animate-pulse">Listening... speak naturally into the microphone</p>
              )}

              <AnimatePresence>
                {transcriptVisible && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Transcript</p>
                    <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground leading-relaxed max-h-32 overflow-y-auto scrollbar-thin">
                      {MOCK_TRANSCRIPT}
                    </div>
                    {displaySoap && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-2">
                          Generated SOAP Note
                          <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                        </p>
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto scrollbar-thin">
                          {displaySoap}
                        </div>
                        {soapWords.length > 0 && canEdit && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={() => { toast.success("SOAP note saved to patient chart"); setTranscriptVisible(false); setSoapWords([]); }}>
                              <Save className="size-3.5" /> Save to Chart
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setNewNoteOpen(true)}>Edit in Note Editor</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Saved notes from this session */}
          {patientSavedNotes.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Notes Added This Session</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {patientSavedNotes.map((note) => (
                  <div key={note.id} className="border border-primary/20 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-primary" />
                        <span className="text-sm font-medium">{note.type}</span>
                        {note.tooth && <span className="text-xs text-muted-foreground">— Tooth #{note.tooth}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDate(note.date)}</span>
                        {expandedNoteId === note.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </div>
                    </button>
                    {expandedNoteId === note.id && (
                      <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3 bg-muted/10">
                        {note.subjective && <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Subjective</p><p className="text-sm mt-0.5">{note.subjective}</p></div>}
                        {note.objective && <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Objective</p><p className="text-sm mt-0.5">{note.objective}</p></div>}
                        {note.assessment && <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Assessment</p><p className="text-sm mt-0.5">{note.assessment}</p></div>}
                        {note.plan && <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Plan</p><p className="text-sm mt-0.5 whitespace-pre-line">{note.plan}</p></div>}
                        <p className="text-xs text-muted-foreground pt-1">Provider: {note.provider}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Past SOAP Notes from patient history */}
          {selectedPatient && (
            <Card>
              <CardHeader><CardTitle>Clinical Notes History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectedPatient.dentalHistory.slice(0, 5).map((record, i) => (
                  <div key={i} className="border border-border rounded-lg overflow-hidden">
                    <button className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{record.procedure}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(record.date)}</span>
                          {record.tooth && <span className="text-xs text-muted-foreground">#{record.tooth}</span>}
                        </div>
                      </div>
                      {record.notes && <p className="text-xs text-muted-foreground mt-1 pl-6">{record.notes}</p>}
                    </button>
                  </div>
                ))}
                {selectedPatient.dentalHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No clinical history on record.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Treatment Plans */}
          {selectedPatient && selectedPatient.treatmentPlans.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Treatment Plans</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {selectedPatient.treatmentPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Plan — {formatDate(plan.date)}</p>
                      <p className="text-xs text-muted-foreground">{plan.procedures.length} procedures · ${plan.totalCost.toLocaleString()}</p>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Note Dialog */}
      <NewNoteDialog
        open={newNoteOpen}
        onClose={() => setNewNoteOpen(false)}
        defaultPatientId={selectedPatientId}
        patients={patients}
        onSave={(note) => setSavedNotes((prev) => [note, ...prev])}
      />
    </div>
  );
}
