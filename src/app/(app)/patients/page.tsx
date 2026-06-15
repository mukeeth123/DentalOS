"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Grid, List, ChevronLeft, ChevronRight, Download, Filter, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonTable } from "@/components/shared/SkeletonLoader";
import { usePatientsStore } from "@/stores/patientsStore";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Patient } from "@/types";
import { toast } from "sonner";
import { useCanEdit } from "@/hooks/usePermission";

const PAGE_SIZE = 20;
const INSURERS = ["Delta Dental", "Cigna", "Aetna", "MetLife", "United Concordia"];

function AddPatientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { patients, updatePatient } = usePatientsStore();
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "", gender: "Female", phone: "", email: "",
    street: "", city: "", state: "TX", zip: "",
    insurer: "Delta Dental", memberId: "", groupNumber: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error("First name, last name and phone are required");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const newId = `PAT-${String(patients.length + 1).padStart(4, "0")}`;
    const dob = form.dateOfBirth || "1990-01-01";
    const born = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;

    const newPatient: Patient = {
      id: newId,
      photo: `https://api.dicebear.com/7.x/personas/svg?seed=${form.firstName}${form.lastName}${Date.now()}`,
      firstName: form.firstName, lastName: form.lastName,
      dateOfBirth: dob, age,
      gender: form.gender as Patient["gender"],
      phone: form.phone, email: form.email,
      address: { street: form.street, city: form.city, state: form.state, zip: form.zip },
      insurancePrimary: {
        insurerId: `ins-${form.insurer.replace(/ /g, "-").toLowerCase()}`,
        insurerName: form.insurer,
        memberId: form.memberId || `MBR${Math.floor(Math.random() * 900000 + 100000)}`,
        groupNumber: form.groupNumber || `GRP${Math.floor(Math.random() * 90000 + 10000)}`,
        effectiveDate: "2024-01-01", copay: 20, deductible: 50, deductibleMet: 0,
        annualMax: 1500, annualUsed: 0,
        coveragePreventive: 100, coverageBasic: 80, coverageMajor: 50, coverageOrthodontic: 50,
        eligibilityVerified: false, lastVerifiedDate: new Date().toISOString().split("T")[0],
      },
      medicalHistory: [], allergies: [], medications: [],
      dentalHistory: [], treatmentPlans: [], claims: [], invoices: [], communications: [],
      documents: [], journey: [{
        id: `j-${newId}-0`, stage: "Lead Created", date: new Date().toISOString().split("T")[0],
        status: "completed", agentId: undefined, agentName: undefined, notes: "Patient added manually",
      }],
      recallDue: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
      lastVisit: "", riskScore: "Low",
      lifetimeValue: 0, outstandingBalance: 0,
      clinic: "clinic-1a", assignedDentist: "STF-0001",
      tags: ["New Patient"], createdAt: new Date().toISOString().split("T")[0],
      notes: form.notes,
    };

    // Add to store via a workaround
    (usePatientsStore.getState() as any).patients.unshift(newPatient);
    usePatientsStore.setState({ patients: [newPatient, ...usePatientsStore.getState().patients.filter((p: Patient) => p.id !== newId)] });

    toast.success(`Patient ${form.firstName} ${form.lastName} added successfully!`);
    setSaving(false);
    onClose();
    setForm({ firstName: "", lastName: "", dateOfBirth: "", gender: "Female", phone: "", email: "", street: "", city: "", state: "TX", zip: "", insurer: "Delta Dental", memberId: "", groupNumber: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="size-5" /> Add New Patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name *</Label><Input value={form.firstName} onChange={f("firstName")} placeholder="Sarah" /></div>
            <div><Label>Last Name *</Label><Input value={form.lastName} onChange={f("lastName")} placeholder="Johnson" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")} /></div>
            <div><Label>Gender</Label>
              <select value={form.gender} onChange={f("gender")} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>Female</option><option>Male</option><option>Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone *</Label><Input value={form.phone} onChange={f("phone")} placeholder="(555) 555-5555" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={f("email")} placeholder="sarah@email.com" /></div>
          </div>
          <div><Label>Street Address</Label><Input value={form.street} onChange={f("street")} placeholder="123 Main St" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>City</Label><Input value={form.city} onChange={f("city")} placeholder="Austin" /></div>
            <div><Label>ZIP</Label><Input value={form.zip} onChange={f("zip")} placeholder="78701" /></div>
          </div>
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Insurance Information</p>
            <div className="grid grid-cols-1 gap-3">
              <div><Label>Insurance Provider</Label>
                <select value={form.insurer} onChange={f("insurer")} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {INSURERS.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Member ID</Label><Input value={form.memberId} onChange={f("memberId")} placeholder="MBR123456" /></div>
                <div><Label>Group Number</Label><Input value={form.groupNumber} onChange={f("groupNumber")} placeholder="GRP12345" /></div>
              </div>
            </div>
          </div>
          <div><Label>Notes</Label>
            <textarea value={form.notes} onChange={f("notes")} rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Patient preferences, special notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Adding..." : "Add Patient"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PatientsPage() {
  const router = useRouter();
  const { patients } = usePatientsStore();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [insurerFilter, setInsurerFilter] = useState("All");
  const [view, setView] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const canEdit = useCanEdit("Patients");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.phone.includes(q) || p.id.toLowerCase().includes(q);
    const matchRisk = riskFilter === "All" || p.riskScore === riskFilter;
    const matchIns = insurerFilter === "All" || p.insurancePrimary.insurerName === insurerFilter;
    return matchSearch && matchRisk && matchIns;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const rows = [
      ["ID", "First Name", "Last Name", "Age", "Gender", "Phone", "Email", "Insurance", "Risk", "Last Visit", "Balance"],
      ...filtered.map((p) => [p.id, p.firstName, p.lastName, p.age, p.gender, p.phone, p.email, p.insurancePrimary.insurerName, p.riskScore, p.lastVisit, p.outstandingBalance]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "patients-export.csv";
    a.click();
    toast.success("Patient list exported to CSV");
  };

  if (loading) return <SkeletonTable rows={10} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Patient Directory</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} of {patients.length} patients</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && <Button variant="outline" size="sm" onClick={exportCSV}><Download className="size-4" /> Export</Button>}
          {canEdit && <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add Patient</Button>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone, ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
        </div>
        <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="All">All Risk Scores</option>
          {["Low", "Medium", "High"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={insurerFilter} onChange={(e) => { setInsurerFilter(e.target.value); setPage(1); }} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="All">All Insurers</option>
          {INSURERS.map((i) => <option key={i}>{i}</option>)}
        </select>
        <div className="flex rounded-md border border-input overflow-hidden">
          <button onClick={() => setView("table")} className={`px-2.5 py-1.5 text-sm ${view === "table" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}><List className="size-4" /></button>
          <button onClick={() => setView("grid")} className={`px-2.5 py-1.5 text-sm ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}><Grid className="size-4" /></button>
        </div>
      </div>

      {view === "table" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium">Insurance</th>
                  <th className="text-left px-4 py-3 font-medium">Last Visit</th>
                  <th className="text-left px-4 py-3 font-medium">Next Appt</th>
                  <th className="text-right px-4 py-3 font-medium">Balance</th>
                  <th className="text-left px-4 py-3 font-medium">Risk</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((p: Patient) => (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => router.push(`/patients/${p.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.photo} alt="" className="size-8 rounded-full bg-muted shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-muted-foreground">{p.age}y {p.gender} · <span className="font-mono">{p.id}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-2 py-0.5">{p.insurancePrimary.insurerName}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.lastVisit ? formatDate(p.lastVisit) : "—"}</td>
                    <td className="px-4 py-3">
                      {p.nextAppointment ? (
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-0.5">{formatDate(p.nextAppointment)}</span>
                      ) : <span className="text-xs text-orange-500">Not scheduled</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${p.outstandingBalance > 0 ? "text-red-600" : "text-muted-foreground"}`}>{formatCurrency(p.outstandingBalance)}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.riskScore} /></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/patients/${p.id}`)}>View</Button>
                        {canEdit && <Button size="sm" onClick={() => { toast.success(`Booking appointment for ${p.firstName} ${p.lastName}`); router.push("/appointments"); }}>Book</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="size-7" onClick={() => setPage(Math.max(1, page-1))} disabled={page===1}><ChevronLeft className="size-3" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = page <= 3 ? i+1 : page-2+i;
                if (n<1||n>totalPages) return null;
                return <button key={n} onClick={() => setPage(n)} className={`size-7 rounded text-xs font-medium ${n===page?"bg-primary text-primary-foreground":"hover:bg-muted"}`}>{n}</button>;
              })}
              <Button size="icon" variant="outline" className="size-7" onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page===totalPages}><ChevronRight className="size-3" /></Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((p: Patient) => (
            <Card key={p.id} className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all hover:-translate-y-0.5" onClick={() => router.push(`/patients/${p.id}`)}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={p.photo} alt="" className="size-12 rounded-full bg-muted" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-muted-foreground">{p.age}y · {p.gender}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <StatusBadge status={p.riskScore} />
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-1.5 py-0.5">{p.insurancePrimary.insurerName}</span>
                  {p.outstandingBalance > 0 && <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full px-1.5 py-0.5">Owes {formatCurrency(p.outstandingBalance)}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{p.phone}</p>
                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags.slice(0, 3).map((t) => <span key={t} className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{t}</span>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddPatientModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
