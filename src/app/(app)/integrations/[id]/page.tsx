"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import integrationsData from "@/mock/integrations.json";
import { formatDateTime, formatDate } from "@/lib/utils";

const SYNC_HISTORY = [
  { time: "2025-06-15T10:43:00Z", records: 142, duration: "0.8s", status: "connected" },
  { time: "2025-06-15T10:28:00Z", records: 89, duration: "0.6s", status: "connected" },
  { time: "2025-06-15T10:13:00Z", records: 203, duration: "1.1s", status: "connected" },
  { time: "2025-06-15T09:58:00Z", records: 77, duration: "0.7s", status: "connected" },
  { time: "2025-06-15T09:43:00Z", records: 0, duration: "—", status: "error" },
  { time: "2025-06-15T09:28:00Z", records: 156, duration: "0.9s", status: "connected" },
  { time: "2025-06-15T09:13:00Z", records: 98, duration: "0.8s", status: "connected" },
  { time: "2025-06-15T08:58:00Z", records: 123, duration: "0.7s", status: "connected" },
  { time: "2025-06-15T08:43:00Z", records: 188, duration: "1.0s", status: "connected" },
  { time: "2025-06-15T08:28:00Z", records: 144, duration: "0.9s", status: "connected" },
];

const API_USAGE = Array.from({ length: 14 }, (_, i) => ({
  date: formatDate(new Date(Date.now() - (13 - i) * 86400000).toISOString()),
  calls: Math.floor(200 + Math.random() * 400),
}));

const ERROR_LOGS = [
  { time: "2025-06-15T09:43:12Z", code: "TIMEOUT_502", message: "Gateway timeout — sync retry succeeded", resolved: true },
  { time: "2025-06-14T15:22:08Z", code: "AUTH_401", message: "Token expired — auto-refreshed", resolved: true },
  { time: "2025-06-12T10:05:44Z", code: "RATE_LIMIT_429", message: "API rate limit reached — queued for retry", resolved: true },
];

const FIELD_MAPPING = [
  { source: "patient_id", destination: "patientId", type: "String", synced: true },
  { source: "first_name", destination: "firstName", type: "String", synced: true },
  { source: "last_name", destination: "lastName", type: "String", synced: true },
  { source: "date_of_birth", destination: "dateOfBirth", type: "Date", synced: true },
  { source: "insurance_id", destination: "insurancePrimary.memberId", type: "String", synced: true },
  { source: "next_appt", destination: "nextAppointment", type: "DateTime", synced: false },
];

export default function IntegrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "fail" | null>(null);

  const integration = integrationsData.find((i) => i.id === id);
  if (!integration) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">Integration not found</p>
      <Button onClick={() => router.push("/integrations")} variant="outline"><ArrowLeft className="size-4" /> Back</Button>
    </div>
  );

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult("success");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/integrations")}>
        <ArrowLeft className="size-4" /> Back to Integrations
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{integration.name}</h1>
                <StatusBadge status={integration.status} />
              </div>
              <p className="text-muted-foreground text-sm">{integration.description}</p>
              <p className="text-xs text-muted-foreground mt-1">API Version: {integration.apiVersion} · {integration.category}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant={integration.status === "connected" ? "outline" : "default"}
              >
                {integration.status === "connected" ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{integration.recordsSynced.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Records Synced</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-sm font-bold">{integration.lastSync ? formatDateTime(integration.lastSync) : "Never"}</p>
          <p className="text-xs text-muted-foreground mt-1">Last Sync</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{integration.uptime}%</p>
          <p className="text-xs text-muted-foreground mt-1">Uptime</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className={`text-2xl font-bold ${integration.healthScore >= 90 ? "text-green-600" : "text-yellow-600"}`}>{integration.healthScore}%</p>
          <p className="text-xs text-muted-foreground mt-1">Health Score</p>
          <Progress value={integration.healthScore} className="h-1 mt-1" />
        </CardContent></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="api">API Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={integration.status} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sync Frequency</span><span>{integration.syncFrequency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Records Synced</span><span>{integration.recordsSynced.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uptime (30d)</span><span className="text-green-600">{integration.uptime}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">API Version</span><span className="font-mono text-xs">{integration.apiVersion}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-right px-4 py-3">Records</th>
                  <th className="text-right px-4 py-3">Duration</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr></thead>
                <tbody>
                  {SYNC_HISTORY.map((s, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-2 text-muted-foreground">{formatDateTime(s.time)}</td>
                      <td className="px-4 py-2 text-right">{s.records > 0 ? s.records : "—"}</td>
                      <td className="px-4 py-2 text-right">{s.duration}</td>
                      <td className="px-4 py-2">
                        {s.status === "connected" ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="size-3" /> Success</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle className="size-3" /> Error</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              {ERROR_LOGS.map((err, i) => (
                <div key={i} className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-red-700 dark:text-red-400">{err.code}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(err.time)}</span>
                  </div>
                  <p className="mt-1 text-foreground">{err.message}</p>
                  {err.resolved && <p className="text-xs text-green-600 mt-1">✓ Auto-resolved</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Daily API Calls — Last 14 Days</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={API_USAGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} name="API Calls" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Field Mapping</CardTitle>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">Source Field</th>
                  <th className="text-left px-4 py-3">Destination Field</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-center px-4 py-3">Synced</th>
                </tr></thead>
                <tbody>
                  {FIELD_MAPPING.map((f, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-2 font-mono text-xs">{f.source}</td>
                      <td className="px-4 py-2 font-mono text-xs text-primary">{f.destination}</td>
                      <td className="px-4 py-2 text-muted-foreground">{f.type}</td>
                      <td className="px-4 py-2 text-center">{f.synced ? "✅" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Test Connection</CardTitle></CardHeader>
            <CardContent>
              <Button onClick={handleTest} disabled={testing}>
                <RefreshCw className={`size-4 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              {testResult === "success" && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="size-4" /> Connection successful!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
