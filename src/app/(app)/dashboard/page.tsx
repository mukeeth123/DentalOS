"use client";

import { useRouter } from "next/navigation";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/shared/KPICard";
import { AgentActivityFeed } from "@/components/shared/AgentActivityFeed";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDoctorsStore } from "@/stores/doctorsStore";
import { AlertTriangle, Clock, Users, CheckCircle, Stethoscope } from "lucide-react";

const STATUS_DOT: Record<string, string> = {
  Available: "bg-green-500", Busy: "bg-yellow-500", "On Leave": "bg-amber-500",
  "In Surgery": "bg-purple-500", "Off Duty": "bg-gray-400",
};

const REVENUE_DATA = [
  { month: "Jan", revenue: 98000, projected: null },
  { month: "Feb", revenue: 112000, projected: null },
  { month: "Mar", revenue: 108000, projected: null },
  { month: "Apr", revenue: 124000, projected: null },
  { month: "May", revenue: 119000, projected: null },
  { month: "Jun", revenue: 131000, projected: null },
  { month: "Jul", revenue: 128000, projected: null },
  { month: "Aug", revenue: 135000, projected: null },
  { month: "Sep", revenue: 127000, projected: null },
  { month: "Oct", revenue: 141600, projected: 141600 },
  { month: "Nov", revenue: null, projected: 148000 },
  { month: "Dec", revenue: null, projected: 155000 },
];

const WEEKLY_DATA = [
  { week: "Wk 1", production: 38200, collections: 33000 },
  { week: "Wk 2", production: 41500, collections: 36200 },
  { week: "Wk 3", production: 37800, collections: 35000 },
  { week: "Wk 4", production: 44200, collections: 38900 },
  { week: "Wk 5", production: 39600, collections: 34800 },
  { week: "Wk 6", production: 46000, collections: 41200 },
  { week: "Wk 7", production: 43100, collections: 38600 },
  { week: "Wk 8", production: 48400, collections: 43800 },
];

const APPT_TYPES = [
  { name: "Cleaning", value: 72, color: "#4F46E5" },
  { name: "Exam", value: 48, color: "#06B6D4" },
  { name: "Filling", value: 38, color: "#10B981" },
  { name: "Crown", value: 24, color: "#F59E0B" },
  { name: "Root Canal", value: 18, color: "#EF4444" },
  { name: "Other", value: 20, color: "#8B5CF6" },
];

const PATIENT_GROWTH = [
  { month: "Jan", patients: 782 }, { month: "Feb", patients: 794 },
  { month: "Mar", patients: 801 }, { month: "Apr", patients: 810 },
  { month: "May", patients: 818 }, { month: "Jun", patients: 824 },
  { month: "Jul", patients: 829 }, { month: "Aug", patients: 835 },
  { month: "Sep", patients: 840 }, { month: "Oct", patients: 847 },
  { month: "Nov", patients: 853 }, { month: "Dec", patients: 860 },
];

const CLAIMS_PIPELINE = [
  { stage: "Total", count: 150 },
  { stage: "Submitted", count: 120 },
  { stage: "Pending", count: 89 },
  { stage: "Approved", count: 142 },
  { stage: "Paid", count: 108 },
];

export default function DashboardPage() {
  const router = useRouter();
  const { doctors } = useDoctorsStore();
  const availableDoctors = doctors.filter((d) => d.status === "Available").length;
  const onLeaveDoctors = doctors.filter((d) => d.status === "On Leave").length;

  const ALERTS = [
    {
      color: "border-red-400 bg-red-50 dark:bg-red-950/20",
      icon: AlertTriangle, iconColor: "text-red-500",
      title: "Claims at Risk of Denial", count: 12,
      desc: "12 claims with missing info need attention",
      action: "Review Claims", href: "/claims",
    },
    {
      color: "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20",
      icon: Clock, iconColor: "text-yellow-600",
      title: "Unverified Insurance", count: 8,
      desc: "8 patients with tomorrow appointments need verification",
      action: "Verify Now", href: "/insurance",
    },
    {
      color: "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
      icon: AlertTriangle, iconColor: "text-orange-500",
      title: "90-Day AR Outstanding", count: 23,
      desc: "$34,200 in 90+ day accounts receivable",
      action: "Run Collection", href: "/billing",
    },
    {
      color: "border-blue-400 bg-blue-50 dark:bg-blue-950/20",
      icon: Users, iconColor: "text-blue-500",
      title: "Recall Overdue", count: 67,
      desc: "67 patients are 1+ years overdue for cleaning",
      action: "Launch Recall", href: "/communications",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Practice Overview</h2>
        <p className="text-sm text-muted-foreground">June 2025 — SmileCare Dental Group</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Revenue MTD" value={141600} format="currency" trend={8.2} trendLabel="vs last month" />
        <KPICard title="Collections Rate" value={87} suffix="%" trend={2.1} trendLabel="↑ from 85.2%" />
        <KPICard title="Production MTD" value={163400} format="currency" trend={11.5} />
        <KPICard title="Claims Approved" value={142} trend={3} description="94% approval rate" />
        <KPICard title="Appointments Today" value="24/28" animate={false} description="24 booked, 28 available" />
        <KPICard title="Treatment Acceptance" value={68} suffix="%" trend={5} trendLabel="vs last month" />
        <KPICard title="AI Tasks Today" value={297} trend={12} description="All 8 agents active" />
        <KPICard title="Active Patients" value={847} trend={1.4} description="847 total active patients" />
      </div>

      {/* Revenue + Production Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Trend — 2025</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, ""]} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} name="Revenue" connectNulls={false} />
                <Line type="monotone" dataKey="projected" stroke="#06B6D4" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Projected" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Production vs Collections — Weekly</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, ""]} />
                <Legend />
                <Bar dataKey="production" fill="#4F46E5" name="Production" radius={[3, 3, 0, 0]} />
                <Bar dataKey="collections" fill="#06B6D4" name="Collections" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Three-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Appointment Mix</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={APPT_TYPES} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={false} labelLine={false}>
                  {APPT_TYPES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {APPT_TYPES.map((t) => (
                <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full shrink-0" style={{ background: t.color }} />
                  {t.name} ({t.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Claims Pipeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {CLAIMS_PIPELINE.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs w-20 text-muted-foreground">{item.stage}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(item.count / 150) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => router.push("/claims")}>View All Claims</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Patient Growth — 2025</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={PATIENT_GROWTH}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[770, 870]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="patients" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.15} name="Patients" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              AI Activity Feed
              <span className="inline-flex size-2 rounded-full bg-green-500 animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AgentActivityFeed />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Alerts &amp; Action Items</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ALERTS.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${alert.color}`}>
                  <Icon className={`size-4 mt-0.5 shrink-0 ${alert.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <span className="text-xs font-bold text-foreground/70 bg-background/60 rounded-full px-1.5">{alert.count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.desc}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2" onClick={() => router.push(alert.href)}>
                    {alert.action}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Doctor Availability Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Stethoscope className="size-4" /> Doctor Availability Today</span>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => router.push("/doctor-availability")}>View All</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" /> {availableDoctors} available</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> {onLeaveDoctors} on leave</span>
            <span>{doctors.length} total doctors</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {doctors.slice(0, 10).map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <div className="relative shrink-0">
                  <img src={d.photo} alt={d.firstName} className="size-8 rounded-full bg-muted" />
                  <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card ${STATUS_DOT[d.status]}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">Dr. {d.lastName}</p>
                  <div className="-mt-0.5"><StatusBadge status={d.status} size="sm" /></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
