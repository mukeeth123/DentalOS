"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { List, Columns, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClaimsStore } from "@/stores/claimsStore";
import { usePatientsStore } from "@/stores/patientsStore";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { ClaimStatus } from "@/types";
import { useCanEdit } from "@/hooks/usePermission";

const KANBAN_COLUMNS: ClaimStatus[] = ["Draft", "Submitted", "Pending", "Approved", "Denied", "Appealed", "Paid"];

const COLUMN_COLORS: Record<ClaimStatus, string> = {
  Draft: "border-t-gray-400",
  Submitted: "border-t-blue-400",
  Pending: "border-t-yellow-400",
  Approved: "border-t-green-400",
  Denied: "border-t-red-400",
  Appealed: "border-t-purple-400",
  Paid: "border-t-emerald-400",
};

function AIScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : score >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${color}`}>{score}</span>;
}

export default function ClaimsPage() {
  const router = useRouter();
  const { claims, updateStatus } = useClaimsStore();
  const { patients } = usePatientsStore();
  const canEdit = useCanEdit("Claims");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [newClaimForm, setNewClaimForm] = useState({
    patientId: "", procedure: "D0120 – Periodic Oral Evaluation", amount: "150",
    dos: new Date().toISOString().split("T")[0], insurer: "Delta Dental",
  });

  const exportCSV = () => {
    const rows = [
      ["ID", "Patient", "Insurer", "Date", "Billed", "Paid", "Status", "AI Score"],
      ...claims.map((c) => [c.id, c.patientName, c.insurerName, (c as any).dateOfService ?? "", c.totalBilled, c.totalPaid, c.status, c.aiScore]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "claims-export.csv";
    a.click();
    toast.success("Claims exported to CSV");
  };

  const handleNewClaim = () => {
    const patient = patients.find((p) => p.id === newClaimForm.patientId);
    if (!patient) { toast.error("Select a patient"); return; }
    toast.success(`Claim submitted for ${patient.firstName} ${patient.lastName} — ${formatCurrency(Number(newClaimForm.amount))}`);
    setNewClaimOpen(false);
    setNewClaimForm({ patientId: "", procedure: "D0120 – Periodic Oral Evaluation", amount: "150", dos: new Date().toISOString().split("T")[0], insurer: "Delta Dental" });
  };

  const totalBilled = claims.reduce((s, c) => s + c.totalBilled, 0);
  const approved = claims.filter((c) => c.status === "Approved" || c.status === "Paid");
  const denied = claims.filter((c) => c.status === "Denied");
  const pending = claims.filter((c) => c.status === "Pending" || c.status === "Submitted");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Claims Management</h2>
          <p className="text-sm text-muted-foreground">{claims.length} total claims</p>
        </div>
          <div className="flex items-center gap-2">
            {canEdit && <Button variant="outline" size="sm" onClick={exportCSV}><Download className="size-4" /> Export</Button>}
            {canEdit && <Button size="sm" onClick={() => setNewClaimOpen(true)}><Plus className="size-4" /> New Claim</Button>}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setView("kanban")} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Columns className="size-4" /> Kanban
              </button>
              <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <List className="size-4" /> List
              </button>
            </div>
          </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">Total Billed</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalBilled)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">Approval Rate</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{((approved.length / claims.length) * 100).toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">{approved.length} approved</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">Denial Rate</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{((denied.length / claims.length) * 100).toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">{denied.length} denied</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">Pending</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{pending.length}</p>
          <p className="text-xs text-muted-foreground">awaiting decision</p>
        </CardContent></Card>
      </div>

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const colClaims = claims.filter((c) => c.status === col);
            return (
              <div key={col} className="flex-shrink-0 w-64">
                <div className={`rounded-xl border border-border bg-card overflow-hidden border-t-2 ${COLUMN_COLORS[col]}`}>
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold">{col}</span>
                    <span className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">{colClaims.length}</span>
                  </div>
                  <div className="p-2 space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                    {colClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="rounded-lg bg-background border border-border p-2.5 cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all"
                        onClick={() => router.push(`/claims/${claim.id}`)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-medium truncate">{claim.patientName}</p>
                          <AIScoreBadge score={claim.aiScore} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{claim.id}</p>
                        <p className="text-xs text-muted-foreground">{claim.insurerName}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold">{formatCurrency(claim.totalBilled)}</span>
                          {claim.status === "Pending" && canEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(claim.id, "Approved"); }}
                              className="text-xs text-green-600 hover:underline"
                            >Approve</button>
                          )}
                          {claim.status === "Denied" && canEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(claim.id, "Appealed"); }}
                              className="text-xs text-purple-600 hover:underline"
                            >Appeal</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {colClaims.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4">Empty</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium">Insurer</th>
                  <th className="text-right px-4 py-3 font-medium">Billed</th>
                  <th className="text-right px-4 py-3 font-medium">Paid</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">AI Score</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{claim.id}</td>
                    <td className="px-4 py-3 font-medium">{claim.patientName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{claim.insurerName}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(claim.totalBilled)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(claim.totalPaid)}</td>
                    <td className="px-4 py-3"><StatusBadge status={claim.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-16 bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${claim.aiScore >= 80 ? "bg-green-500" : claim.aiScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${claim.aiScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{claim.aiScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="xs" variant="outline" onClick={() => router.push(`/claims/${claim.id}`)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New Claim Sheet */}
      <Sheet open={newClaimOpen} onOpenChange={(o) => !o && setNewClaimOpen(false)}>
        <SheetContent>
          <SheetHeader><SheetTitle>Submit New Claim</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Patient</Label>
              <select value={newClaimForm.patientId} onChange={(e) => setNewClaimForm((p) => ({ ...p, patientId: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                <option value="">Select patient...</option>
                {patients.slice(0, 30).map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            {newClaimForm.patientId && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                {(() => { const p = patients.find((pt) => pt.id === newClaimForm.patientId); return p ? <><p className="font-medium">{p.insurancePrimary.insurerName}</p><p className="text-muted-foreground">Member: {p.insurancePrimary.memberId}</p></> : null; })()}
              </div>
            )}
            <div>
              <Label>Procedure Code</Label>
              <select value={newClaimForm.procedure} onChange={(e) => setNewClaimForm((p) => ({ ...p, procedure: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                {["D0120 – Periodic Oral Evaluation", "D0150 – Comprehensive Oral Evaluation", "D0210 – Full Mouth X-Rays", "D1110 – Adult Prophylaxis", "D2140 – Amalgam Filling, 1 Surface", "D2740 – Crown – Porcelain/Ceramic", "D3330 – Root Canal – Molar", "D4341 – Periodontal Scaling"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fee ($)</Label><Input type="number" value={newClaimForm.amount} onChange={(e) => setNewClaimForm((p) => ({ ...p, amount: e.target.value }))} className="mt-1" /></div>
              <div><Label>Date of Service</Label><Input type="date" value={newClaimForm.dos} onChange={(e) => setNewClaimForm((p) => ({ ...p, dos: e.target.value }))} className="mt-1" /></div>
            </div>
            <Button className="w-full" onClick={handleNewClaim}>Submit Claim</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
