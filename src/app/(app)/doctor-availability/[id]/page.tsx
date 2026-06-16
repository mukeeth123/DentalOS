"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, Award, Armchair, Star, TrendingUp,
  ShieldAlert, Plus, CalendarOff, CheckCircle, XCircle, Clock,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { KPICard } from "@/components/shared/KPICard";
import { useDoctorsStore } from "@/stores/doctorsStore";
import { useAppointmentsStore } from "@/stores/appointmentsStore";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { DoctorStatus, LeaveRecord, LeaveType } from "@/types";

const DAY_ORDER: { key: keyof import("@/types").WeeklySchedule; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const STATUS_OPTIONS: DoctorStatus[] = ["Available", "Busy", "On Leave", "In Surgery", "Off Duty"];
const LEAVE_TYPES: LeaveType[] = ["Vacation", "Sick Leave", "Training", "Conference"];

function weekSeries(seed: number, base: number) {
  // Deterministic pseudo-variation so SSR/CSR match (no Math.random)
  return Array.from({ length: 7 }, (_, i) => {
    const variance = Math.sin((seed + i) * 0.9) * 0.18 + Math.cos(i * 1.3 + seed) * 0.08;
    return Math.max(0, Math.round(base * (1 + variance)));
  });
}

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { doctors, setStatus, addLeave } = useDoctorsStore();
  const { appointments } = useAppointmentsStore();
  const user = useAuthStore((s) => s.user);

  const doctor = doctors.find((d) => d.id === id);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: "Vacation" as LeaveType, startDate: "", endDate: "", reason: "" });

  const canManage = !!user && ["Super Admin", "DSO Admin", "Clinic Owner"].includes(user.role);
  const isOwnProfile = !!user && !!doctor && user.firstName === doctor.firstName && user.lastName === doctor.lastName;
  const isDentist = user?.role === "Dentist";

  const doctorAppointments = useMemo(
    () => (doctor ? appointments.filter((a) => a.dentistId === doctor.id).sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime)) : []),
    [appointments, doctor]
  );

  if (!doctor) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Doctor not found.</p>
        <Button variant="outline" onClick={() => router.push("/doctor-availability")} className="mt-4">Back to Doctor Availability</Button>
      </div>
    );
  }

  // Dentist role: view own schedule only
  if (isDentist && !isOwnProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <ShieldAlert className="size-12 text-red-500" />
        <div>
          <h2 className="text-xl font-bold">View Restricted</h2>
          <p className="text-muted-foreground text-sm mt-1">Dentists can only view their own schedule.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/doctor-availability")}>Back to My Schedule</Button>
      </div>
    );
  }

  const seed = doctor.id.split("-").pop()?.charCodeAt(0) ?? 1;
  const patientsSeries = weekSeries(seed, Math.round(doctor.patientsSeenMonth / 22));
  const revenueSeries = weekSeries(seed + 3, Math.round(doctor.revenueGenerated / 22));
  const perfData = DAY_ORDER.slice(0, 7).map((d, i) => ({ day: d.label.slice(0, 3), patients: patientsSeries[i], revenue: revenueSeries[i] }));

  const todaysAppointments = doctorAppointments.filter((a) => {
    const d = new Date(a.startTime);
    const today = new Date("2025-06-15");
    return d.toDateString() === today.toDateString();
  });

  const handleSubmitLeave = () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error("Please fill in all leave request fields");
      return;
    }
    const leave: LeaveRecord = {
      id: `LV-${Date.now()}`,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      status: canManage ? "Approved" : "Pending",
      reason: leaveForm.reason,
      requestedDate: new Date().toISOString().slice(0, 10),
      approvedBy: canManage ? `${user?.firstName} ${user?.lastName}` : undefined,
    };
    addLeave(doctor.id, leave);
    toast.success(canManage ? "Leave approved and recorded" : "Leave request submitted for approval");
    setLeaveOpen(false);
    setLeaveForm({ type: "Vacation", startDate: "", endDate: "", reason: "" });
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/doctor-availability")} className="-ml-2">
        <ArrowLeft className="size-4" /> Back to Doctor Availability
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <img src={doctor.photo} alt={doctor.firstName} className="size-16 rounded-full bg-muted shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">Dr. {doctor.firstName} {doctor.lastName}</h2>
                  <StatusBadge status={doctor.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{doctor.specialties.join(" · ")}</p>
                <p className="text-xs text-muted-foreground mt-1">{doctor.clinicNames.join(" · ")}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="size-3" /> {doctor.email}</span>
                  <span className="flex items-center gap-1"><Phone className="size-3" /> {doctor.phone}</span>
                  <span className="flex items-center gap-1"><Star className="size-3 text-yellow-500" /> {doctor.avgRating.toFixed(1)}</span>
                  <span className="flex items-center gap-1"><Award className="size-3" /> {doctor.yearsExperience} yrs experience</span>
                </div>
              </div>
            </div>

            {canManage && (
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Label className="text-xs text-muted-foreground">Update Status</Label>
                <select
                  value={doctor.status}
                  onChange={(e) => { setStatus(doctor.id, e.target.value as DoctorStatus); toast.success(`Status updated to ${e.target.value}`); }}
                  className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Utilization" value={doctor.utilizationRate} suffix="%" trend={doctor.utilizationRate >= 75 ? 4 : -3} icon={<TrendingUp className="size-4" />} />
        <KPICard title="Revenue Generated" value={doctor.revenueGenerated} format="currency" description={`Goal: ${formatCurrency(doctor.revenueGoal)}`} />
        <KPICard title="Patients Seen (Month)" value={doctor.patientsSeenMonth} description={`${doctor.patientsSeenToday} today`} />
        <KPICard title="No-Show Rate" value={doctor.noShowRate} suffix="%" trend={doctor.noShowRate <= 5 ? 1 : -2} />
        <KPICard title="Slots Open Today" value={doctor.slotsAvailableToday} description={doctor.slotsAvailableToday === 0 ? "Fully booked" : "Available"} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule &amp; Availability</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{doctor.bio}</p></CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Armchair className="size-4" /> Assigned Chairs</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {doctor.assignedChairs.map((c) => (
                    <span key={c} className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">{c}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Credentials</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">NPI Number</span><span className="font-mono">{doctor.npiNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">License</span><span className="font-mono">{doctor.licenseNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Next Available Slot</span><span>{formatDateTime(doctor.nextAvailableSlot)}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule & Availability */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Weekly Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Day</th>
                    <th className="text-left px-3 py-2 font-medium">Hours</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr></thead>
                  <tbody>
                    {DAY_ORDER.map(({ key, label }) => {
                      const day = doctor.schedule[key];
                      return (
                        <tr key={key} className="border-b border-border/50">
                          <td className="px-3 py-2.5 font-medium">{label}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{day.active ? `${day.start} – ${day.end}` : "—"}</td>
                          <td className="px-3 py-2.5">
                            {day.active
                              ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="size-3.5" /> Working</span>
                              : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="size-3.5" /> Off</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Next 7 Days — Availability Calendar</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date("2025-06-15");
                  date.setDate(date.getDate() + i);
                  const dayKey = DAY_ORDER[(date.getDay() + 6) % 7].key;
                  const daySchedule = doctor.schedule[dayKey];
                  const dateStr = date.toISOString().slice(0, 10);
                  const onLeave = doctor.leaveRecords.some((l) => l.status === "Approved" && dateStr >= l.startDate.slice(0, 10) && dateStr <= l.endDate.slice(0, 10));
                  const apptCount = doctorAppointments.filter((a) => a.startTime.slice(0, 10) === dateStr && a.status !== "Cancelled").length;
                  const blocked = onLeave || !daySchedule.active;
                  return (
                    <div key={i} className={`rounded-lg border p-2.5 text-center ${blocked ? "bg-muted/40 border-border" : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40"}`}>
                      <p className="text-[10px] text-muted-foreground uppercase">{date.toLocaleDateString("en-US", { weekday: "short" })}</p>
                      <p className="text-sm font-bold">{date.getDate()}</p>
                      {blocked ? (
                        <p className="text-[10px] text-muted-foreground mt-1">{onLeave ? "On Leave" : "Off"}</p>
                      ) : (
                        <>
                          <p className="text-[10px] text-green-700 dark:text-green-400 mt-1">{daySchedule.start}–{daySchedule.end}</p>
                          <p className="text-[10px] text-muted-foreground">{apptCount} booked</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Management */}
        <TabsContent value="leave" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setLeaveOpen(true)}><Plus className="size-3.5" /> Request Leave</Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Dates</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 font-medium">Requested</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {doctor.leaveRecords.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No leave records on file.</td></tr>
                  )}
                  {doctor.leaveRecords.map((l) => (
                    <tr key={l.id} className="border-b border-border/50">
                      <td className="px-4 py-2.5"><span className="text-xs bg-muted rounded-full px-2 py-0.5">{l.type}</span></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{l.reason}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(l.requestedDate)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={l.status === "Approved" ? "Approved" : l.status === "Denied" ? "Denied" : "Pending"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Appointments */}
        <TabsContent value="appointments" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Today&apos;s Appointments ({todaysAppointments.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {todaysAppointments.length === 0 && <p className="text-sm text-muted-foreground">No appointments scheduled today.</p>}
              {todaysAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{a.patientName}</span>
                    <span className="text-muted-foreground">— {a.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{formatDateTime(a.startTime)}</span>
                    <StatusBadge status={a.status} size="sm" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent &amp; Upcoming ({doctorAppointments.length} total)</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Chair</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {doctorAppointments.slice(0, 20).map((a) => (
                    <tr key={a.id} className="border-b border-border/50">
                      <td className="px-4 py-2.5 font-medium">{a.patientName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{a.type}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDateTime(a.startTime)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{a.chair}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={a.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Patients Seen — Last 7 Days</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="patients" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Patients" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Revenue — Last 7 Days</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card><CardContent className="pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-bold">{doctor.avgRating.toFixed(1)} ★</p><p className="text-xs text-muted-foreground mt-1">Patient Rating</p></div>
              <div><p className="text-2xl font-bold text-red-600">{doctor.noShowRate}%</p><p className="text-xs text-muted-foreground mt-1">No-Show Rate</p></div>
              <div><p className="text-2xl font-bold">{doctor.utilizationRate}%</p><p className="text-xs text-muted-foreground mt-1">Chair Utilization</p></div>
              <div><p className="text-2xl font-bold text-green-600">{Math.round((doctor.revenueGenerated / doctor.revenueGoal) * 100)}%</p><p className="text-xs text-muted-foreground mt-1">of Revenue Goal</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Request Leave Dialog */}
      <Dialog open={leaveOpen} onOpenChange={(o) => !o && setLeaveOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarOff className="size-4" /> Request Leave — Dr. {doctor.lastName}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Leave Type</Label>
              <select value={leaveForm.type} onChange={(e) => setLeaveForm((f) => ({ ...f, type: e.target.value as LeaveType }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))} className="mt-1" /></div>
              <div><Label>End Date</Label><Input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Reason</Label><textarea value={leaveForm.reason} onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1" placeholder="Briefly describe the reason for leave..." /></div>
            {!canManage && <p className="text-xs text-muted-foreground">This request will be submitted as Pending until approved by a Clinic Owner or Admin.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitLeave}>{canManage ? "Approve & Record" : "Submit Request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
