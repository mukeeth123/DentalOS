"use client";

import { useState } from "react";
import { Play, Pause, Copy, Trash2, Edit2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import workflowsData from "@/mock/workflows.json";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Workflow } from "@/types";

const TRIGGER_OPTIONS = ["Patient Recall Due", "Appointment Booked", "Appointment Completed", "Claim Denied", "Invoice Overdue", "New Patient Added", "Treatment Plan Created", "Doctor On Leave", "Schedule Full", "Open Slot Available", "Manual Trigger"];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(workflowsData as Workflow[]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newWf, setNewWf] = useState({ name: "", trigger: "Patient Recall Due", description: "" });
  const [editWf, setEditWf] = useState<Workflow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", trigger: "Patient Recall Due", description: "", stepsCount: 1 });

  const openEdit = (wf: Workflow) => {
    setEditWf(wf);
    setEditForm({ name: wf.name, trigger: wf.trigger, description: wf.description, stepsCount: wf.stepsCount });
  };

  const saveEdit = () => {
    if (!editWf) return;
    if (!editForm.name) { toast.error("Workflow name required"); return; }
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === editWf.id
          ? { ...w, name: editForm.name, trigger: editForm.trigger, description: editForm.description, stepsCount: editForm.stepsCount }
          : w
      )
    );
    toast.success(`Workflow "${editForm.name}" updated`);
    setEditWf(null);
  };

  const toggleStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === id
          ? { ...wf, status: wf.status === "Active" ? "Paused" : wf.status === "Paused" ? "Active" : wf.status }
          : wf
      )
    );
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Automation Workflows</h2>
          <p className="text-sm text-muted-foreground">{workflows.filter((w) => w.status === "Active").length} active · {workflows.length} total</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Create Workflow</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{workflows.reduce((s, w) => s + w.actionsCount, 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Actions Taken</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{workflows.filter((w) => w.status === "Active").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Workflows</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{workflows.filter((w) => w.status === "Paused").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Paused</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{workflows.filter((w) => w.status === "Draft").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Drafts</p>
        </CardContent></Card>
      </div>

      {/* Workflow Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <Card key={wf.id} className={wf.status === "Paused" ? "opacity-75" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{wf.name}</h3>
                    <StatusBadge status={wf.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{wf.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="text-primary">⚡</span> Trigger: {wf.trigger}
                    </span>
                    <span>{wf.stepsCount} steps</span>
                    <span className="text-green-600 font-medium">{wf.actionsCount.toLocaleString()} actions taken</span>
                  </div>

                  {wf.lastRun && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last run: {formatDateTime(wf.lastRun)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="xs"
                    variant={wf.status === "Active" ? "outline" : "default"}
                    onClick={() => toggleStatus(wf.id)}
                    className="w-full"
                    disabled={wf.status === "Draft"}
                  >
                    {wf.status === "Active" ? <><Pause className="size-3" /> Pause</> : <><Play className="size-3" /> Activate</>}
                  </Button>
                  <div className="flex gap-1">
                    <Button size="icon-xs" variant="outline" onClick={() => openEdit(wf)}><Edit2 className="size-3" /></Button>
                    <Button size="icon-xs" variant="outline" onClick={() => { setWorkflows((p) => [...p, { ...wf, id: `${wf.id}-copy`, name: `${wf.name} (Copy)`, status: "Draft" }]); toast.success("Workflow duplicated"); }}><Copy className="size-3" /></Button>
                    <Button size="icon-xs" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setWorkflows((p) => p.filter((w) => w.id !== wf.id)); toast.success("Workflow deleted"); }}><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Create Workflow Dialog */}
    <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Workflow Name</Label><Input value={newWf.name} onChange={(e) => setNewWf((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Appointment Reminder Sequence" className="mt-1" /></div>
          <div><Label>Trigger</Label>
            <select value={newWf.trigger} onChange={(e) => setNewWf((p) => ({ ...p, trigger: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
              {TRIGGER_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><Label>Description</Label><textarea value={newWf.description} onChange={(e) => setNewWf((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1" placeholder="What does this workflow do?" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!newWf.name) { toast.error("Workflow name required"); return; }
            const wf: Workflow = { id: `wf-${Date.now()}`, name: newWf.name, description: newWf.description || "Custom workflow", trigger: newWf.trigger, status: "Draft", stepsCount: 1, actionsCount: 0, lastRun: undefined };
            setWorkflows((p) => [wf, ...p]);
            toast.success(`Workflow "${newWf.name}" created`);
            setCreateOpen(false);
            setNewWf({ name: "", trigger: "Patient Recall Due", description: "" });
          }}>Create Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Workflow Dialog */}
    <Dialog open={!!editWf} onOpenChange={(o) => !o && setEditWf(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Workflow: {editWf?.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Workflow Name</Label><Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
          <div><Label>Trigger</Label>
            <select value={editForm.trigger} onChange={(e) => setEditForm((p) => ({ ...p, trigger: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
              {TRIGGER_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><Label>Steps</Label><Input type="number" min={1} value={editForm.stepsCount} onChange={(e) => setEditForm((p) => ({ ...p, stepsCount: Math.max(1, parseInt(e.target.value) || 1) }))} className="mt-1" /></div>
          <div><Label>Description</Label><textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditWf(null)}>Cancel</Button>
          <Button onClick={saveEdit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
