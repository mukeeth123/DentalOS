"use client";

import { useState } from "react";
import { Edit2, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import staffData from "@/mock/staff.json";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import type { Staff } from "@/types";
import { useCanEdit } from "@/hooks/usePermission";

const ROLES = ["Super Admin", "DSO Admin", "Clinic Owner", "Dentist", "Front Desk", "Insurance Coordinator", "Billing Manager"];
const MODULES = ["Patients", "Appointments", "Clinical", "Claims", "Billing", "Reports", "Settings", "AI Agents"];

const ROLE_PERMISSIONS: Record<string, Record<string, "Full" | "Read" | "None">> = {
  "Super Admin": { Patients: "Full", Appointments: "Full", Clinical: "Full", Claims: "Full", Billing: "Full", Reports: "Full", Settings: "Full", "AI Agents": "Full" },
  "Clinic Owner": { Patients: "Full", Appointments: "Full", Clinical: "Full", Claims: "Full", Billing: "Full", Reports: "Full", Settings: "Read", "AI Agents": "Full" },
  Dentist: { Patients: "Full", Appointments: "Full", Clinical: "Full", Claims: "Read", Billing: "Read", Reports: "Read", Settings: "None", "AI Agents": "None" },
  "Front Desk": { Patients: "Read", Appointments: "Full", Clinical: "None", Claims: "Read", Billing: "None", Reports: "None", Settings: "None", "AI Agents": "None" },
  "Insurance Coordinator": { Patients: "Read", Appointments: "Read", Clinical: "None", Claims: "Full", Billing: "Read", Reports: "Read", Settings: "None", "AI Agents": "None" },
  "Billing Manager": { Patients: "Read", Appointments: "None", Clinical: "None", Claims: "Full", Billing: "Full", Reports: "Full", Settings: "None", "AI Agents": "None" },
  "DSO Admin": { Patients: "Full", Appointments: "Full", Clinical: "Full", Claims: "Full", Billing: "Full", Reports: "Full", Settings: "Full", "AI Agents": "Full" },
};

const AUDIT_LOGS = [
  { time: "2025-06-15T10:47:00Z", user: "Dr. Sarah Martinez", action: "Viewed patient chart", module: "Clinical", ip: "192.168.1.42", result: "Success" },
  { time: "2025-06-15T10:31:00Z", user: "Lisa Chen", action: "Submitted claim CLM-0089", module: "Claims", ip: "192.168.1.18", result: "Success" },
  { time: "2025-06-15T10:12:00Z", user: "James Rodriguez", action: "Created appointment", module: "Appointments", ip: "192.168.1.33", result: "Success" },
  { time: "2025-06-15T09:58:00Z", user: "Admin", action: "Modified AI agent config", module: "AI Agents", ip: "192.168.1.1", result: "Success" },
  { time: "2025-06-15T09:44:00Z", user: "Dr. Michael Johnson", action: "Deleted appointment (unauthorized)", module: "Appointments", ip: "192.168.2.55", result: "Denied" },
  { time: "2025-06-15T09:30:00Z", user: "Lisa Chen", action: "Exported patient list", module: "Reports", ip: "192.168.1.18", result: "Success" },
  { time: "2025-06-15T09:15:00Z", user: "Dr. Sarah Martinez", action: "Login", module: "Auth", ip: "192.168.1.42", result: "Success" },
];

const PERM_CELL: Record<string, React.ReactNode> = {
  Full: <span className="text-green-600 text-xs font-medium">✅ Full</span>,
  Read: <span className="text-yellow-600 text-xs font-medium">🟡 Read</span>,
  None: <span className="text-muted-foreground text-xs">⬜ None</span>,
};

function StaffModal({ staff, onClose }: { staff: Staff | null; onClose: () => void }) {
  const isEdit = !!staff;
  const [form, setForm] = useState({
    firstName: staff?.firstName ?? "",
    lastName: staff?.lastName ?? "",
    email: staff?.email ?? "",
    phone: staff?.phone ?? "",
    role: staff?.role ?? "Front Desk",
    status: staff?.status ?? "Active",
    npi: (staff as any)?.npi ?? "",
  });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.email) { toast.error("Name and email required"); return; }
    toast.success(`Staff member ${isEdit ? "updated" : "added"}: ${form.firstName} ${form.lastName}`);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name</Label><Input value={form.firstName} onChange={f("firstName")} placeholder="Sarah" /></div>
            <div><Label>Last Name</Label><Input value={form.lastName} onChange={f("lastName")} placeholder="Martinez" /></div>
          </div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={f("email")} placeholder="sarah@smilecare.com" /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={f("phone")} placeholder="(512) 555-0100" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role</Label>
              <select value={form.role} onChange={f("role")} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {["Super Admin", "DSO Admin", "Clinic Owner", "Dentist", "Front Desk", "Insurance Coordinator", "Billing Manager"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><Label>Status</Label>
              <select value={form.status} onChange={f("status")} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>Active</option><option>Inactive</option><option>On Leave</option>
              </select>
            </div>
          </div>
          {(form.role === "Dentist") && <div><Label>NPI Number</Label><Input value={form.npi} onChange={f("npi")} placeholder="1234567890" /></div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{isEdit ? "Save Changes" : "Add Staff Member"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffPage() {
  const staff = (staffData.staff as Staff[]);
  const canEdit = useCanEdit("Settings");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [staffModal, setStaffModal] = useState<{ open: boolean; staff: Staff | null }>({ open: false, staff: null });

  const filtered = staff.filter((s) => {
    const matchRole = roleFilter === "All" || s.role === roleFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchRole && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Staff Management</h2>
          <p className="text-sm text-muted-foreground">{staff.length} staff members</p>
        </div>
        {canEdit && <Button onClick={() => setStaffModal({ open: true, staff: null })}><Plus className="size-4" /> Add Staff</Button>}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Role Matrix</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <div className="flex gap-3 mb-4">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-8 rounded-lg border border-border bg-background px-2 text-sm">
              <option value="All">All Roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 rounded-lg border border-border bg-background px-2 text-sm">
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Staff Member</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Last Login</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.slice(0, 30).map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {getInitials(`${s.firstName} ${s.lastName}`)}
                          </div>
                          <div>
                            <p className="font-medium">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-2 py-0.5">{s.role}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(s.lastLogin)}</td>
                      <td className="px-4 py-3 text-right">
                        {canEdit && <Button size="icon-xs" variant="outline" onClick={() => setStaffModal({ open: true, staff: s })}><Edit2 className="size-3" /></Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Role Matrix Tab */}
        <TabsContent value="roles" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">Module</th>
                    {Object.keys(ROLE_PERMISSIONS).map((role) => (
                      <th key={role} className="text-center px-3 py-3 font-medium text-xs min-w-[120px]">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod) => (
                    <tr key={mod} className="border-b border-border/50">
                      <td className="px-4 py-2.5 font-medium text-xs text-muted-foreground">{mod}</td>
                      {Object.keys(ROLE_PERMISSIONS).map((role) => (
                        <td key={role} className="px-3 py-2.5 text-center">
                          {PERM_CELL[ROLE_PERMISSIONS[role]?.[mod] ?? "None"]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Module</th>
                  <th className="text-left px-4 py-3 font-medium">IP</th>
                  <th className="text-left px-4 py-3 font-medium">Result</th>
                </tr></thead>
                <tbody>
                  {AUDIT_LOGS.map((log, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.time)}</td>
                      <td className="px-4 py-2.5 font-medium">{log.user}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{log.action}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs bg-muted rounded-full px-2 py-0.5">{log.module}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{log.ip}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium ${log.result === "Success" ? "text-green-600" : "text-red-600"}`}>{log.result}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      {staffModal.open && <StaffModal staff={staffModal.staff} onClose={() => setStaffModal({ open: false, staff: null })} />}
    </div>
  );
}
