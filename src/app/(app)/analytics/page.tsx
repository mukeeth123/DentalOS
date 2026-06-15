"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const DATE_RANGES = ["7d", "30d", "90d", "12m"] as const;
type DateRange = typeof DATE_RANGES[number];

/* ─── Full dataset (12 months) ─────────────────────────────────────────────── */
const ALL_REVENUE = [
  { label: "Jan", revenue: 98000, expenses: 61000 },
  { label: "Feb", revenue: 112000, expenses: 68000 },
  { label: "Mar", revenue: 108000, expenses: 65000 },
  { label: "Apr", revenue: 124000, expenses: 72000 },
  { label: "May", revenue: 119000, expenses: 70000 },
  { label: "Jun", revenue: 131000, expenses: 76000 },
  { label: "Jul", revenue: 128000, expenses: 74000 },
  { label: "Aug", revenue: 135000, expenses: 79000 },
  { label: "Sep", revenue: 127000, expenses: 73000 },
  { label: "Oct", revenue: 141600, expenses: 82000 },
  { label: "Nov", revenue: 138000, expenses: 80000 },
  { label: "Dec", revenue: 152000, expenses: 88000 },
];

// Daily revenue for 7d / 30d (last 30 days)
const ALL_DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: 3200 + Math.floor(Math.sin(i * 0.6) * 800 + Math.random() * 600),
    expenses: 1900 + Math.floor(Math.random() * 400),
  };
});

const ALL_CLAIMS_MONTHLY = [
  { label: "Jan", submitted: 45, approved: 38, denied: 7 },
  { label: "Feb", submitted: 52, approved: 44, denied: 8 },
  { label: "Mar", submitted: 48, approved: 42, denied: 6 },
  { label: "Apr", submitted: 56, approved: 49, denied: 7 },
  { label: "May", submitted: 50, approved: 43, denied: 7 },
  { label: "Jun", submitted: 61, approved: 52, denied: 9 },
  { label: "Jul", submitted: 57, approved: 49, denied: 8 },
  { label: "Aug", submitted: 63, approved: 54, denied: 9 },
  { label: "Sep", submitted: 59, approved: 51, denied: 8 },
  { label: "Oct", submitted: 68, approved: 59, denied: 9 },
  { label: "Nov", submitted: 64, approved: 56, denied: 8 },
  { label: "Dec", submitted: 72, approved: 63, denied: 9 },
];

const ALL_CLAIMS_DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    submitted: Math.floor(2 + Math.random() * 4),
    approved: Math.floor(1 + Math.random() * 3),
    denied: Math.floor(Math.random() * 2),
  };
});

const ALL_PATIENTS_MONTHLY = [
  { label: "Jan", count: 28, retention: 82 }, { label: "Feb", count: 31, retention: 83 },
  { label: "Mar", count: 24, retention: 81 }, { label: "Apr", count: 35, retention: 84 },
  { label: "May", count: 29, retention: 83 }, { label: "Jun", count: 38, retention: 85 },
  { label: "Jul", count: 33, retention: 84 }, { label: "Aug", count: 40, retention: 86 },
  { label: "Sep", count: 36, retention: 85 }, { label: "Oct", count: 42, retention: 87 },
  { label: "Nov", count: 39, retention: 86 }, { label: "Dec", count: 45, retention: 88 },
];

const ALL_PATIENTS_DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: Math.floor(1 + Math.random() * 4),
    retention: Math.floor(80 + Math.random() * 10),
  };
});

const REVENUE_BY_PROVIDER = [
  { name: "Dr. Martinez", revenue: 62000 }, { name: "Dr. Chen", revenue: 44000 },
  { name: "Dr. Patel", revenue: 35600 },
];
const REVENUE_BY_CATEGORY = [
  { name: "Preventive", value: 38000, color: "#4F46E5" },
  { name: "Basic Restorative", value: 45000, color: "#06B6D4" },
  { name: "Major Restorative", value: 31000, color: "#10B981" },
  { name: "Orthodontics", value: 18000, color: "#F59E0B" },
  { name: "Implants", value: 9600, color: "#EF4444" },
];
const DENIAL_REASONS = [
  { reason: "Missing Info", count: 14 }, { reason: "Not Covered", count: 11 },
  { reason: "Pre-auth Required", count: 9 }, { reason: "Duplicate", count: 4 },
  { reason: "Timely Filing", count: 3 },
];
const DAYS_TO_PAYMENT = [
  { insurer: "Aetna", days: 14 }, { insurer: "Delta", days: 18 },
  { insurer: "Cigna", days: 16 }, { insurer: "United", days: 22 }, { insurer: "BlueCross", days: 20 },
];
const AI_TASKS = [
  { agent: "AI Receptionist", tasks: 47, revenue: 3420 }, { agent: "AI Claims", tasks: 18, revenue: 24800 },
  { agent: "AI Recall", tasks: 124, revenue: 8900 }, { agent: "AI Billing", tasks: 34, revenue: 12300 },
  { agent: "AI Insurance", tasks: 31, revenue: 0 }, { agent: "AI Scribe", tasks: 23, revenue: 0 },
];
const TREATMENT_ACCEPTANCE = [
  { type: "Crown", rate: 82 }, { type: "Implant", rate: 68 }, { type: "Root Canal", rate: 74 },
  { type: "Filling", rate: 91 }, { type: "Extraction", rate: 88 }, { type: "Ortho", rate: 61 },
];

function getRevenueData(range: DateRange) {
  if (range === "7d") return ALL_DAILY.slice(-7);
  if (range === "30d") return ALL_DAILY;
  if (range === "90d") return ALL_DAILY; // same daily data as approximation for 90d
  return ALL_REVENUE; // 12m
}
function getClaimsData(range: DateRange) {
  if (range === "7d") return ALL_CLAIMS_DAILY.slice(-7);
  if (range === "30d") return ALL_CLAIMS_DAILY;
  if (range === "90d") return ALL_CLAIMS_MONTHLY.slice(-3);
  return ALL_CLAIMS_MONTHLY;
}
function getPatientsData(range: DateRange) {
  if (range === "7d") return ALL_PATIENTS_DAILY.slice(-7);
  if (range === "30d") return ALL_PATIENTS_DAILY;
  if (range === "90d") return ALL_PATIENTS_MONTHLY.slice(-3);
  return ALL_PATIENTS_MONTHLY;
}

function rangeSummary(range: DateRange, data: { revenue: number }[]) {
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const prev = total * (range === "7d" ? 0.94 : range === "30d" ? 0.96 : 0.91);
  const pct = (((total - prev) / prev) * 100).toFixed(1);
  return { total, pct };
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const revenueData = useMemo(() => getRevenueData(dateRange), [dateRange]);
  const claimsData = useMemo(() => getClaimsData(dateRange), [dateRange]);
  const patientsData = useMemo(() => getPatientsData(dateRange), [dateRange]);
  const { total, pct } = useMemo(() => rangeSummary(dateRange, revenueData), [dateRange, revenueData]);

  const totalNewPts = patientsData.reduce((s, d) => s + d.count, 0);
  const totalClaims = claimsData.reduce((s, d) => s + d.submitted, 0);
  const totalApproved = claimsData.reduce((s, d) => s + d.approved, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Analytics</h2>
          <p className="text-sm text-muted-foreground">Practice performance insights</p>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {DATE_RANGES.map((r) => (
            <button key={r} onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${dateRange === r ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Revenue</p>
          <p className="text-2xl font-bold">${(total / 1000).toFixed(0)}k</p>
          <p className={`text-xs mt-1 ${Number(pct) >= 0 ? "text-green-600" : "text-red-500"}`}>↑ {pct}% vs prior period</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">New Patients</p>
          <p className="text-2xl font-bold">{totalNewPts}</p>
          <p className="text-xs text-green-600 mt-1">↑ 8% vs prior period</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Claims Submitted</p>
          <p className="text-2xl font-bold">{totalClaims}</p>
          <p className="text-xs text-muted-foreground mt-1">{totalApproved} approved ({Math.round((totalApproved / totalClaims) * 100)}%)</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">AI Tasks</p>
          <p className="text-2xl font-bold">297</p>
          <p className="text-xs text-green-600 mt-1">$49.4k revenue attributed</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="ai">AI Performance</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Revenue Trend — {dateRange}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer key={`rev-trend-${dateRange}`} width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, ""]} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={1.5} fill="none" name="Expenses" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Revenue by Provider</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={REVENUE_BY_PROVIDER}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Revenue by Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={REVENUE_BY_CATEGORY} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {REVENUE_BY_CATEGORY.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Claims — {dateRange}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer key={`claims-trend-${dateRange}`} width="100%" height={260}>
                <BarChart data={claimsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Bar dataKey="submitted" fill="#4F46E5" name="Submitted" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="denied" fill="#EF4444" name="Denied" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Top Denial Reasons</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={DENIAL_REASONS} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="reason" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Avg Days to Payment</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={DAYS_TO_PAYMENT}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="insurer" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="days" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Days" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>New Patients — {dateRange}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer key={`patients-trend-${dateRange}`} width="100%" height={260}>
                <BarChart data={patientsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} name="New Patients" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-6">
            <Card><CardContent className="pt-6 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-2">Retention Rate</p>
              <p className="text-5xl font-bold text-green-600">84%</p>
              <p className="text-sm text-muted-foreground mt-1">return within 18 months</p>
              <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-3 bg-green-500 rounded-full" style={{ width: "84%" }} />
              </div>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-2">Avg Patient LTV</p>
              <p className="text-5xl font-bold text-primary">$3,420</p>
              <p className="text-sm text-muted-foreground mt-1">lifetime value per active patient</p>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* AI Performance Tab */}
        <TabsContent value="ai" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Tasks per Agent</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={AI_TASKS} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="agent" tick={{ fontSize: 10 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#4F46E5" radius={[0, 4, 4, 0]} name="Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Revenue by Agent</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={AI_TASKS.filter((a) => a.revenue > 0)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="agent" tick={{ fontSize: 10 }} width={110} />
                    <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card><CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-3xl font-bold">297</p><p className="text-sm text-muted-foreground">Total AI Tasks</p></div>
              <div><p className="text-3xl font-bold text-green-600">$49,420</p><p className="text-sm text-muted-foreground">Revenue from AI</p></div>
              <div><p className="text-3xl font-bold text-primary">87%</p><p className="text-sm text-muted-foreground">Avg Success Rate</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Treatment Tab */}
        <TabsContent value="treatment" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Treatment Acceptance Rate by Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={TREATMENT_ACCEPTANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: unknown) => [`${v}%`, "Acceptance"]} />
                  <Bar dataKey="rate" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Acceptance %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card><CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div><p className="text-3xl font-bold text-primary">68%</p><p className="text-sm text-muted-foreground">Overall Acceptance</p><p className="text-xs text-green-600 mt-1">↑ 5% vs last month</p></div>
              <div><p className="text-3xl font-bold text-orange-600">$42,600</p><p className="text-sm text-muted-foreground">Unaccepted Treatment Value</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
