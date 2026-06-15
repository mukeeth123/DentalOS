"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MessageSquare, FileText, StickyNote, Download, Mail, Phone, MapPin, Shield, CheckCircle, Clock, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePatientsStore } from "@/stores/patientsStore";
import { useClaimsStore } from "@/stores/claimsStore";
import { useBillingStore } from "@/stores/billingStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "overview" | "journey" | "clinical" | "insurance" | "claims" | "billing" | "communications" | "documents";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "journey", label: "Patient Journey" },
  { id: "clinical", label: "Clinical" },
  { id: "insurance", label: "Insurance" },
  { id: "claims", label: "Claims" },
  { id: "billing", label: "Billing" },
  { id: "communications", label: "Communications" },
  { id: "documents", label: "Documents" },
];

function BookModal({ patient, open, onClose }: { patient: any; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ date: "", time: "09:00", type: "Cleaning", dentist: "Dr. Sarah Martinez", notes: "" });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const handleBook = () => {
    if (!form.date) { toast.error("Please select a date"); return; }
    toast.success(`Appointment booked for ${patient.firstName} ${patient.lastName} on ${formatDate(form.date)} at ${form.time}`);
    onClose();
    router.push("/appointments");
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Calendar className="size-4" /> Book Appointment</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Patient</Label><Input value={`${patient.firstName} ${patient.lastName}`} readOnly className="bg-muted" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={f("date")} /></div>
            <div><Label>Time</Label><Input type="time" value={form.time} onChange={f("time")} /></div>
          </div>
          <div><Label>Type</Label>
            <select value={form.type} onChange={f("type")} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              {["Cleaning", "Exam", "Filling", "Crown", "Root Canal", "Extraction", "Consultation", "Whitening", "Orthodontic", "X-Ray"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><Label>Dentist</Label>
            <select value={form.dentist} onChange={f("dentist")} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              {["Dr. Sarah Martinez", "Dr. James Chen", "Dr. Emily Rodriguez", "Dr. Michael Thompson", "Dr. Lisa Park", "Dr. Robert Davis"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div><Label>Notes</Label><textarea value={form.notes} onChange={f("notes")} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBook}>Book Appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageSheet({ patient, open, onClose }: { patient: any; open: boolean; onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const [channel, setChannel] = useState("SMS");
  const [sending, setSending] = useState(false);
  const handleSend = () => {
    if (!msg.trim()) { toast.error("Please enter a message"); return; }
    setSending(true);
    setTimeout(() => {
      toast.success(`${channel} sent to ${patient.firstName} ${patient.lastName}`);
      onClose(); setSending(false); setMsg("");
    }, 800);
  };
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader><SheetTitle>Message {patient.firstName} {patient.lastName}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Contact</p>
            <p className="font-medium">{patient.phone}</p>
            <p className="text-muted-foreground">{patient.email}</p>
          </div>
          <div><Label>Channel</Label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
              <option>SMS</option><option>Email</option><option>Portal Message</option>
            </select>
          </div>
          {channel === "Email" && <div><Label>Subject</Label><Input placeholder="Re: Your appointment" className="mt-1" /></div>}
          <div><Label>Message</Label>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1"
              placeholder={`Hi ${patient.firstName}, ...`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["Appointment reminder", "Balance due notice", "Recall reminder", "Treatment follow-up"].map((t) => (
              <button key={t} onClick={() => setMsg(`Hi ${patient.firstName}, this is SmileCare Dental. ${t === "Appointment reminder" ? "This is a reminder for your upcoming appointment." : t === "Balance due notice" ? `You have a balance of ${formatCurrency(patient.outstandingBalance)} due.` : t === "Recall reminder" ? "It's time for your 6-month cleaning and exam!" : "We hope you're recovering well from your recent procedure."} Please call us at (512) 555-0100. Thank you!`)}
                className="text-left text-xs border border-dashed border-border rounded-md p-2 hover:bg-muted text-muted-foreground">{t}</button>
            ))}
          </div>
          <Button className="w-full" onClick={handleSend} disabled={sending}>{sending ? "Sending..." : `Send ${channel}`}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NoteSheet({ patient, open, onClose }: { patient: any; open: boolean; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [type, setType] = useState("Clinical Note");
  const handleSave = () => {
    if (!note.trim()) { toast.error("Note cannot be empty"); return; }
    toast.success("Note saved to patient record");
    onClose(); setNote("");
  };
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader><SheetTitle>Add Note — {patient.firstName} {patient.lastName}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
              {["Clinical Note", "Administrative Note", "Billing Note", "Communication Note", "Alert"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><Label>Note</Label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1"
              placeholder="Enter clinical notes, observations..." />
          </div>
          <Button className="w-full" onClick={handleSave}>Save Note</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ClaimSheet({ patient, open, onClose }: { patient: any; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ procedure: "D0120 – Periodic Oral Evaluation", tooth: "", amount: "150", dos: new Date().toISOString().split("T")[0], notes: "" });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const handleSubmit = () => {
    toast.success(`Claim submitted to ${patient.insurancePrimary.insurerName} for ${formatCurrency(Number(form.amount))}`);
    onClose();
  };
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader><SheetTitle>Submit Claim — {patient.firstName} {patient.lastName}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Insurance</p>
            <p className="font-medium">{patient.insurancePrimary.insurerName}</p>
            <p className="text-muted-foreground">Member: {patient.insurancePrimary.memberId} · Group: {patient.insurancePrimary.groupNumber}</p>
          </div>
          <div><Label>Procedure Code</Label>
            <select value={form.procedure} onChange={f("procedure")} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
              {["D0120 – Periodic Oral Evaluation", "D0150 – Comprehensive Oral Evaluation", "D0210 – Full Mouth X-Rays", "D1110 – Adult Prophylaxis", "D2140 – Amalgam Filling, 1 Surface", "D2740 – Crown – Porcelain/Ceramic", "D3330 – Root Canal – Molar", "D4341 – Periodontal Scaling"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tooth #</Label><Input value={form.tooth} onChange={f("tooth")} placeholder="e.g. 14" /></div>
            <div><Label>Fee ($)</Label><Input type="number" value={form.amount} onChange={f("amount")} /></div>
          </div>
          <div><Label>Date of Service</Label><Input type="date" value={form.dos} onChange={f("dos")} /></div>
          <div><Label>Notes</Label><textarea value={form.notes} onChange={f("notes")} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1" /></div>
          <Button className="w-full" onClick={handleSubmit}>Submit Claim</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { patients } = usePatientsStore();
  const { claims } = useClaimsStore();
  const { invoices } = useBillingStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [bookOpen, setBookOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [quickMsg, setQuickMsg] = useState("");

  const patient = patients.find((p) => p.id === id);
  if (!patient) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">Patient not found.</p>
      <Button variant="outline" onClick={() => router.push("/patients")} className="mt-4">Back to Patients</Button>
    </div>
  );

  const patientClaims = claims.filter((c) => c.patientId === id);
  const patientInvoices = invoices.filter((inv) => inv.patientId === id);

  const generateReport = () => {
    const content = [
      "PATIENT REPORT",
      "=====================================",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "PATIENT INFORMATION",
      `Name: ${patient.firstName} ${patient.lastName}`,
      `ID: ${patient.id}`,
      `DOB: ${formatDate(patient.dateOfBirth)} (Age ${patient.age})`,
      `Gender: ${patient.gender}`,
      `Phone: ${patient.phone}`,
      `Email: ${patient.email}`,
      `Address: ${patient.address.street}, ${patient.address.city}, ${patient.address.state} ${patient.address.zip}`,
      "",
      "INSURANCE",
      `Provider: ${patient.insurancePrimary.insurerName}`,
      `Member ID: ${patient.insurancePrimary.memberId}`,
      `Group: ${patient.insurancePrimary.groupNumber}`,
      `Annual Max: ${formatCurrency(patient.insurancePrimary.annualMax)}`,
      `Annual Used: ${formatCurrency(patient.insurancePrimary.annualUsed)}`,
      `Deductible: ${formatCurrency(patient.insurancePrimary.deductible)} (Met: ${formatCurrency(patient.insurancePrimary.deductibleMet)})`,
      `Preventive: ${patient.insurancePrimary.coveragePreventive}%  Basic: ${patient.insurancePrimary.coverageBasic}%  Major: ${patient.insurancePrimary.coverageMajor}%`,
      "",
      "HEALTH HISTORY",
      `Risk Score: ${patient.riskScore}`,
      `Allergies: ${patient.allergies.length > 0 ? patient.allergies.join(", ") : "None"}`,
      `Medications: ${patient.medications.length > 0 ? patient.medications.join(", ") : "None"}`,
      ...(patient.medicalHistory.map((m: any) => `  - ${m.condition} (${m.status})`)),
      "",
      "FINANCIAL SUMMARY",
      `Lifetime Value: ${formatCurrency(patient.lifetimeValue)}`,
      `Outstanding Balance: ${formatCurrency(patient.outstandingBalance)}`,
      `Total Claims: ${patientClaims.length}`,
      `Total Invoices: ${patientInvoices.length}`,
      "",
      "TREATMENT PLANS",
      ...(patient.treatmentPlans.length > 0
        ? patient.treatmentPlans.map((tp: any) => `  - ${tp.name}: ${formatCurrency(tp.totalFee ?? 0)}`)
        : ["  No active treatment plans"]),
      "",
      `Last Visit: ${patient.lastVisit ? formatDate(patient.lastVisit) : "N/A"}`,
      `Recall Due: ${patient.recallDue ? formatDate(patient.recallDue) : "N/A"}`,
      "",
      "=====================================",
      "SmileCare Dental Group · (512) 555-0100",
      "1234 Medical Drive, Austin TX 78701",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `patient-report-${patient.id}.txt`;
    a.click();
    toast.success("Patient report downloaded");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}><ArrowLeft className="size-4" /></Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
          <p className="text-sm text-muted-foreground">{patient.id} · {patient.age}y {patient.gender}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setBookOpen(true)}><Calendar className="size-3.5 mr-1" /> Book</Button>
          <Button size="sm" variant="outline" onClick={() => setMsgOpen(true)}><MessageSquare className="size-3.5 mr-1" /> Message</Button>
          <Button size="sm" variant="outline" onClick={() => setClaimOpen(true)}><FileText className="size-3.5 mr-1" /> Claim</Button>
          <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}><StickyNote className="size-3.5 mr-1" /> Note</Button>
          <Button size="sm" variant="outline" onClick={generateReport}><Download className="size-3.5 mr-1" /> Export</Button>
        </div>
      </div>

      {/* Hero */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <img src={patient.photo} alt="" className="size-16 rounded-full bg-muted border-2 border-primary/20 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StatusBadge status={patient.riskScore} />
                {patient.tags.map((t: string) => <span key={t} className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">{t}</span>)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Insurance</p><p className="font-medium">{patient.insurancePrimary.insurerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Balance</p><p className={`font-bold ${patient.outstandingBalance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(patient.outstandingBalance)}</p></div>
                <div><p className="text-xs text-muted-foreground">Last Visit</p><p className="font-medium">{patient.lastVisit ? formatDate(patient.lastVisit) : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Lifetime Value</p><p className="font-medium">{formatCurrency(patient.lifetimeValue)}</p></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex border-b border-border gap-0 min-w-max">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
              {tab.id === "claims" && patientClaims.length > 0 && <span className="ml-1 text-xs bg-muted rounded-full px-1.5">{patientClaims.length}</span>}
              {tab.id === "billing" && patientInvoices.length > 0 && <span className="ml-1 text-xs bg-muted rounded-full px-1.5">{patientInvoices.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /><span>{patient.phone}</span></div>
              <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><span>{patient.email}</span></div>
              <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /><span>{patient.address.street}, {patient.address.city}, {patient.address.state} {patient.address.zip}</span></div>
              <div className="border-t pt-3"><p className="text-xs text-muted-foreground">Date of Birth</p><p>{formatDate(patient.dateOfBirth)}</p></div>
              {patient.notes && <div className="border-t pt-3"><p className="text-xs text-muted-foreground">Notes</p><p className="text-muted-foreground">{patient.notes}</p></div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Medical History</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {patient.medicalHistory.length > 0
                ? patient.medicalHistory.map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{m.condition}</span><StatusBadge status={m.status} />
                    </div>
                  ))
                : <p className="text-muted-foreground">No significant medical history</p>}
              {patient.allergies.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                  <div className="flex flex-wrap gap-1">{patient.allergies.map((a: string) => <span key={a} className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">{a}</span>)}</div>
                </div>
              )}
              {patient.medications.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Medications</p>
                  <div className="flex flex-wrap gap-1">{patient.medications.map((m: string) => <span key={m} className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{m}</span>)}</div>
                </div>
              )}
            </CardContent>
          </Card>
          {patient.treatmentPlans.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-sm">Treatment Plans</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patient.treatmentPlans.map((tp: any) => (
                  <div key={tp.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{tp.name}</p>
                      <div className="flex items-center gap-2"><StatusBadge status={tp.status} /><span className="font-bold text-sm">{formatCurrency(tp.totalFee)}</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <span>Ins Est: {formatCurrency(tp.insuranceEstimate)}</span>
                      <span>Pt Portion: {formatCurrency(tp.patientPortion)}</span>
                      <span>{tp.acceptanceDate ? `Accepted: ${formatDate(tp.acceptanceDate)}` : "Pending Acceptance"}</span>
                    </div>
                    {tp.procedures?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {tp.procedures.map((pr: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{pr.code} — {pr.description}</span><span>{formatCurrency(pr.fee)}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Journey */}
      {activeTab === "journey" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Patient Journey</CardTitle></CardHeader>
          <CardContent>
            <div className="relative pl-8 space-y-0">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
              {patient.journey.map((step: any) => {
                const Icon = step.status === "completed" ? CheckCircle : step.status === "in-progress" ? Clock : Circle;
                const iconColor = step.status === "completed" ? "text-green-500" : step.status === "in-progress" ? "text-yellow-500" : "text-muted-foreground";
                return (
                  <div key={step.id} className="relative pb-6">
                    <div className="absolute -left-5 top-0 bg-background rounded-full p-0.5"><Icon className={`size-4 ${iconColor}`} /></div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{step.stage}</p>
                      <p className="text-xs text-muted-foreground shrink-0">{formatDate(step.date)}</p>
                    </div>
                    {step.notes && <p className="text-xs text-muted-foreground mt-0.5">{step.notes}</p>}
                    {step.agentName && <p className="text-xs text-primary mt-0.5">→ {step.agentName}</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Clinical */}
      {activeTab === "clinical" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Dental History</CardTitle></CardHeader>
          <CardContent>
            {patient.dentalHistory.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Procedure</th>
                  <th className="text-left py-2">Tooth</th>
                  <th className="text-left py-2">Provider</th>
                  <th className="text-right py-2">Fee</th>
                </tr></thead>
                <tbody>
                  {patient.dentalHistory.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="py-2 text-muted-foreground">{formatDate(d.date)}</td>
                      <td className="py-2">{d.procedure}</td>
                      <td className="py-2 text-muted-foreground">{d.tooth || "—"}</td>
                      <td className="py-2 text-muted-foreground">{d.provider}</td>
                      <td className="py-2 text-right">{formatCurrency(d.fee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-muted-foreground text-sm">No dental history recorded.</p>}
          </CardContent>
        </Card>
      )}

      {/* Tab: Insurance */}
      {activeTab === "insurance" && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="size-4" /> Primary Insurance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
              <div><p className="text-xs text-muted-foreground">Provider</p><p className="font-semibold">{patient.insurancePrimary.insurerName}</p></div>
              <div><p className="text-xs text-muted-foreground">Member ID</p><p className="font-mono">{patient.insurancePrimary.memberId}</p></div>
              <div><p className="text-xs text-muted-foreground">Group #</p><p className="font-mono">{patient.insurancePrimary.groupNumber}</p></div>
              <div><p className="text-xs text-muted-foreground">Copay</p><p>{formatCurrency(patient.insurancePrimary.copay)}</p></div>
              <div><p className="text-xs text-muted-foreground">Effective</p><p>{patient.insurancePrimary.effectiveDate}</p></div>
              <div><p className="text-xs text-muted-foreground">Eligibility</p><StatusBadge status={patient.insurancePrimary.eligibilityVerified ? "Verified" : "Unverified"} /></div>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span>Annual Max</span><span className="font-medium">{formatCurrency(patient.insurancePrimary.annualUsed)} / {formatCurrency(patient.insurancePrimary.annualMax)}</span></div>
                <div className="h-2 bg-muted rounded-full"><div className="h-2 bg-primary rounded-full" style={{ width: `${(patient.insurancePrimary.annualUsed / patient.insurancePrimary.annualMax) * 100}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span>Deductible</span><span className="font-medium">{formatCurrency(patient.insurancePrimary.deductibleMet)} / {formatCurrency(patient.insurancePrimary.deductible)}</span></div>
                <div className="h-2 bg-muted rounded-full"><div className="h-2 bg-green-500 rounded-full" style={{ width: `${Math.min((patient.insurancePrimary.deductibleMet / patient.insurancePrimary.deductible) * 100, 100)}%` }} /></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm mb-4">
              {[["Preventive", patient.insurancePrimary.coveragePreventive], ["Basic", patient.insurancePrimary.coverageBasic], ["Major", patient.insurancePrimary.coverageMajor], ["Orthodontic", patient.insurancePrimary.coverageOrthodontic]].map(([l, v]) => (
                <div key={String(l)} className="text-center rounded-lg bg-muted p-3">
                  <p className="text-2xl font-bold">{v}%</p>
                  <p className="text-xs text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => toast.success(`Insurance verified — ${patient.firstName} ${patient.lastName} is an active member of ${patient.insurancePrimary.insurerName}`)}>
                <Shield className="size-3.5 mr-1" /> Verify Eligibility
              </Button>
              <Button size="sm" variant="outline" onClick={() => { toast.success("EOB downloaded"); generateReport(); }}>
                <Download className="size-3.5 mr-1" /> Download EOB
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Claims */}
      {activeTab === "claims" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Claims History
              <Button size="sm" onClick={() => setClaimOpen(true)}><Plus className="size-3.5 mr-1" /> New Claim</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patientClaims.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2">ID</th><th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Insurer</th><th className="text-right py-2">Billed</th>
                  <th className="text-right py-2">Paid</th><th className="text-left py-2">Status</th>
                </tr></thead>
                <tbody>
                  {patientClaims.map((c) => (
                    <tr key={c.id} className="border-b border-border/40">
                      <td className="py-2 font-mono text-xs">{c.id}</td>
                      <td className="py-2 text-muted-foreground">{formatDate((c as any).dateOfService ?? "")}</td>
                      <td className="py-2">{c.insurerName}</td>
                      <td className="py-2 text-right">{formatCurrency(c.totalBilled)}</td>
                      <td className="py-2 text-right text-green-600">{formatCurrency(c.totalPaid)}</td>
                      <td className="py-2"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <FileText className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No claims yet.</p>
                <Button size="sm" className="mt-3" onClick={() => setClaimOpen(true)}>Submit First Claim</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Billing */}
      {activeTab === "billing" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Invoice History</CardTitle></CardHeader>
          <CardContent>
            {patientInvoices.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div><p className="text-xs text-muted-foreground">Total Billed</p><p className="text-xl font-bold">{formatCurrency(patientInvoices.reduce((s, i) => s + i.totalBilled, 0))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Ins. Paid</p><p className="text-xl font-bold text-green-600">{formatCurrency(patientInvoices.reduce((s, i) => s + i.insurancePaid, 0))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Balance</p><p className={`text-xl font-bold ${patient.outstandingBalance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(patient.outstandingBalance)}</p></div>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left py-2">Invoice</th><th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Billed</th><th className="text-right py-2">Balance</th><th className="text-left py-2">Status</th>
                  </tr></thead>
                  <tbody>
                    {patientInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/40">
                        <td className="py-2 font-mono text-xs">{inv.id}</td>
                        <td className="py-2 text-muted-foreground">{formatDate(inv.date)}</td>
                        <td className="py-2 text-right">{formatCurrency(inv.totalBilled)}</td>
                        <td className={`py-2 text-right font-medium ${inv.balance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(inv.balance)}</td>
                        <td className="py-2"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : <p className="text-muted-foreground text-center py-8">No invoices found.</p>}
          </CardContent>
        </Card>
      )}

      {/* Tab: Communications */}
      {activeTab === "communications" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Quick Message</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={quickMsg} onChange={(e) => setQuickMsg(e.target.value)} placeholder={`Quick SMS to ${patient.firstName}...`}
                  onKeyDown={(e) => { if (e.key === "Enter" && quickMsg.trim()) { toast.success(`SMS sent to ${patient.firstName}`); setQuickMsg(""); } }} />
                <Button onClick={() => { if (quickMsg.trim()) { toast.success(`SMS sent to ${patient.firstName}`); setQuickMsg(""); } }}>Send SMS</Button>
                <Button variant="outline" onClick={() => setMsgOpen(true)}>More Options</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Communication History</CardTitle></CardHeader>
            <CardContent>
              {patient.communications && patient.communications.length > 0 ? (
                <div className="space-y-3">
                  {patient.communications.map((c: any, i: number) => (
                    <div key={i} className="flex gap-3 border-b border-border/40 pb-3">
                      <div className={`size-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${c.channel === "SMS" ? "bg-green-500" : c.channel === "Email" ? "bg-blue-500" : "bg-purple-500"}`}>
                        {c.channel?.[0] ?? "?"}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <p className="font-medium">{c.channel} · {c.direction}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(c.date)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.subject}</p>
                        <p className="text-xs mt-0.5">{c.body?.slice(0, 120)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-sm">No communications recorded.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === "documents" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Documents
              <Button size="sm" onClick={generateReport}><Download className="size-3.5 mr-1" /> Generate Report</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: "Patient Summary Report", type: "TXT", date: new Date().toISOString().split("T")[0] },
                { name: `Insurance EOB — ${patient.insurancePrimary.insurerName}`, type: "PDF", date: "2025-03-15" },
                { name: "Treatment Plan Estimate", type: "PDF", date: "2025-02-28" },
                { name: "Patient Consent Form", type: "PDF", date: "2025-01-10" },
                { name: "Full Mouth X-Ray Series", type: "DICOM", date: "2024-12-05" },
                ...(patient.documents || []),
              ].map((doc: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded bg-primary/10 flex items-center justify-center">
                      <FileText className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.type} · {formatDate(doc.date)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { toast.success(`Downloading ${doc.name}`); if (i === 0) generateReport(); }}>
                    <Download className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals & Sheets */}
      <BookModal patient={patient} open={bookOpen} onClose={() => setBookOpen(false)} />
      <MessageSheet patient={patient} open={msgOpen} onClose={() => setMsgOpen(false)} />
      <NoteSheet patient={patient} open={noteOpen} onClose={() => setNoteOpen(false)} />
      <ClaimSheet patient={patient} open={claimOpen} onClose={() => setClaimOpen(false)} />
    </div>
  );
}
