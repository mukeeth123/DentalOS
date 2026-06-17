"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, RefreshCw, Play, Zap,
  ArrowRight, Activity, AlertTriangle, Plug, Clock,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import integrationsData from "@/mock/integrations.json";
import { useCustomIntegrationsStore } from "@/stores/customIntegrationsStore";
import { useAuthStore } from "@/stores/authStore";
import { formatDateTime, formatDate, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const SYNC_PRESETS = [
  "Real-time", "Every 15 minutes", "Every 30 minutes", "Every 1 hour",
  "Every 2 hours", "Every 4 hours", "Every 6 hours", "Every 12 hours",
  "Every 24 hours", "Daily at 6 AM", "Daily at 2 AM", "Weekly",
];

// Deterministic API usage chart (no Math.random to avoid hydration mismatch)
function apiUsage(seed: string) {
  const base = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 14 }, (_, i) => ({
    date: formatDate(new Date(Date.UTC(2026, 5, 3) + i * 86400000).toISOString()),
    calls: ((base * (i + 7)) % 600) + 200,
  }));
}

const WORKFLOW_TRIGGERS = [
  { id: "sync_success", label: "Sync Success", desc: "Fires when a sync completes with ≥1 record", color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" },
  { id: "sync_failed", label: "Sync Failed", desc: "Fires when a sync returns an error or 0 records after retry", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" },
  { id: "data_received", label: "Data Received", desc: "Fires when inbound webhook payload is received", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900" },
  { id: "webhook_received", label: "Webhook Event", desc: "Fires on any registered webhook event from the external system", color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900" },
];

export default function IntegrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const canEdit = ["Super Admin", "DSO Admin", "Clinic Owner"].includes(user?.role ?? "");

  const { integrations: customList, updateStatus, appendSyncLog } = useCustomIntegrationsStore();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "fail" | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncFreqEdit, setSyncFreqEdit] = useState<string | null>(null); // null = closed, string = current value being edited
  const [platformFreqs, setPlatformFreqs] = useState<Record<string, string>>({});

  // Find in platform data or custom store
  const platformInteg = integrationsData.find((i) => i.id === id);
  const customInteg = customList.find((i) => i.id === id);
  const isCustom = !platformInteg && !!customInteg;

  const integration = platformInteg ?? customInteg;

  const syncLogs = useMemo(() => {
    if (isCustom && customInteg) return customInteg.syncLogs;
    return [
      { time: "2026-06-17T09:30:00Z", records: 142, duration: "0.8s", status: "success" },
      { time: "2026-06-17T09:15:00Z", records: 89, duration: "0.6s", status: "success" },
      { time: "2026-06-17T09:00:00Z", records: 203, duration: "1.1s", status: "success" },
      { time: "2026-06-17T08:45:00Z", records: 77, duration: "0.7s", status: "success" },
      { time: "2026-06-17T08:30:00Z", records: 0, duration: "—", status: "error" },
      { time: "2026-06-17T08:15:00Z", records: 156, duration: "0.9s", status: "success" },
      { time: "2026-06-17T08:00:00Z", records: 98, duration: "0.8s", status: "success" },
      { time: "2026-06-17T07:45:00Z", records: 123, duration: "0.7s", status: "success" },
    ];
  }, [isCustom, customInteg]);

  const errorLogs = useMemo(() => {
    if (isCustom && customInteg) return customInteg.errorLogs;
    return [
      { time: "2026-06-17T08:30:22Z", code: "TIMEOUT_502", message: "Gateway timeout — sync retry succeeded", resolved: true },
      { time: "2026-06-15T15:22:08Z", code: "AUTH_401", message: "Token expired — auto-refreshed", resolved: true },
      { time: "2026-06-12T10:05:44Z", code: "RATE_LIMIT_429", message: "API rate limit reached — queued for retry", resolved: true },
    ];
  }, [isCustom, customInteg]);

  const fieldMappings = useMemo(() => {
    if (isCustom && customInteg) return customInteg.fieldMappings.map((f) => ({ source: f.externalField, destination: f.dentalOsField, type: f.type, synced: f.synced, dentalOsField: f.dentalOsField }));
    return [
      { source: "patient_id", destination: "patientId", dentalOsField: "Patient ID", type: "String", synced: true },
      { source: "first_name", destination: "firstName", dentalOsField: "Patient Name", type: "String", synced: true },
      { source: "last_name", destination: "lastName", dentalOsField: "Patient Name", type: "String", synced: true },
      { source: "date_of_birth", destination: "dateOfBirth", dentalOsField: "Date of Birth", type: "Date", synced: true },
      { source: "insurance_id", destination: "insurancePrimary.memberId", dentalOsField: "Insurance ID", type: "String", synced: true },
      { source: "next_appt", destination: "nextAppointment", dentalOsField: "Appointment Date", type: "DateTime", synced: false },
    ];
  }, [isCustom, customInteg]);

  const webhookEvents: string[] = useMemo(() => {
    if (isCustom && customInteg?.webhookEvents) return customInteg.webhookEvents;
    return ["patient.created", "appointment.confirmed", "invoice.paid"];
  }, [isCustom, customInteg]);

  const workflowTriggers: string[] = useMemo(() => {
    if (isCustom && customInteg?.workflowTriggers) return customInteg.workflowTriggers;
    return ["sync_success", "sync_failed"];
  }, [isCustom, customInteg]);

  const chartData = useMemo(() => apiUsage(id), [id]);

  const analytics = {
    totalApiCalls: isCustom ? (customInteg?.totalApiCalls ?? 0) : 184200,
    successRate: isCustom ? (customInteg?.successRate ?? 0) : 98.7,
    failedSyncs: isCustom ? (customInteg?.failedSyncs ?? 0) : 12,
    avgResponseMs: isCustom ? (customInteg?.avgResponseMs ?? 0) : 320,
    dataVolumeMB: isCustom ? (customInteg?.dataVolumeMB ?? 0) : 2140,
  };

  if (!integration) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">Integration not found</p>
      <Button onClick={() => router.push("/integrations")} variant="outline"><ArrowLeft className="size-4 mr-1" /> Back</Button>
    </div>
  );

  const currentFreq = isCustom
    ? (customInteg?.syncFrequency ?? "")
    : (platformFreqs[id] ?? (platformInteg?.syncFrequency ?? ""));

  const saveSyncFreq = () => {
    if (!syncFreqEdit) return;
    if (isCustom) {
      updateStatus; // keep reference
      useCustomIntegrationsStore.getState().updateIntegration(id, { syncFrequency: syncFreqEdit });
    } else {
      setPlatformFreqs((prev) => ({ ...prev, [id]: syncFreqEdit }));
    }
    toast.success(`Sync schedule updated to "${syncFreqEdit}"`);
    setSyncFreqEdit(null);
  };

  const handleTest = () => {
    setTesting(true); setTestResult(null);
    setTimeout(() => { setTesting(false); setTestResult("success"); toast.success("Connection test passed"); }, 1500);
  };

  const handleRunSync = () => {
    if (!canEdit) { toast.error("Read-only access"); return; }
    setSyncing(true);
    setTimeout(() => {
      const records = Math.floor(50 + Math.random() * 300);
      if (isCustom) appendSyncLog(id, { time: new Date().toISOString(), records, duration: "1.2s", status: "success" });
      toast.success(`Sync complete — ${records} records processed`);
      setSyncing(false);
    }, 2000);
  };

  const handleToggleConnect = () => {
    if (!canEdit) { toast.error("Read-only access"); return; }
    setConnecting(true);
    setTimeout(() => {
      if (isCustom) {
        const newStatus = integration.status === "connected" ? "disconnected" : "connected";
        updateStatus(id, newStatus);
        toast.success(newStatus === "connected" ? "Integration connected" : "Integration disconnected");
      }
      setConnecting(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/integrations")}>
        <ArrowLeft className="size-4 mr-1" /> Back to Integrations
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                {isCustom && <span className="size-8 rounded-lg bg-primary/10 flex items-center justify-center"><Plug className="size-4 text-primary" /></span>}
                <h1 className="text-2xl font-bold">{integration.name}</h1>
                {isCustom && <span className="text-xs font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">CUSTOM</span>}
                <StatusBadge status={integration.status} />
              </div>
              <p className="text-muted-foreground text-sm">{integration.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isCustom && customInteg ? `${customInteg.authType} · ` : ""}
                API Version: {integration.apiVersion} · {integration.category}
              </p>
              {isCustom && customInteg && (
                <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate max-w-md">{customInteg.baseUrl}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {canEdit && (
                <Button size="sm" onClick={handleRunSync} disabled={syncing || integration.status !== "connected"} variant="outline">
                  <Play className={`size-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Run Sync"}
                </Button>
              )}
              <Button size="sm" variant={integration.status === "connected" ? "destructive" : "default"} disabled={connecting} onClick={handleToggleConnect}>
                {connecting ? "..." : integration.status === "connected" ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{integration.recordsSynced.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Records Synced</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-lg font-bold">{integration.lastSync ? timeAgo(integration.lastSync) : "Never"}</p>
          {integration.lastSync && <p className="text-[10px] text-muted-foreground">{formatDateTime(integration.lastSync)}</p>}
          <p className="text-xs text-muted-foreground mt-1">Last Sync</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{integration.uptime}%</p>
          <p className="text-xs text-muted-foreground mt-1">Uptime (30d)</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className={`text-2xl font-bold ${integration.healthScore >= 90 ? "text-green-600" : integration.healthScore >= 70 ? "text-yellow-600" : "text-muted-foreground"}`}>
            {integration.healthScore}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Health Score</p>
          <Progress value={integration.healthScore} className="h-1 mt-1" />
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className={`text-2xl font-bold ${analytics.successRate >= 95 ? "text-green-600" : "text-yellow-600"}`}>{analytics.successRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
          <TabsTrigger value="errors">
            Error Logs
            {errorLogs.filter((e) => !e.resolved).length > 0 && (
              <span className="ml-1 size-4 text-[10px] rounded-full bg-red-500 text-white flex items-center justify-center">{errorLogs.filter((e) => !e.resolved).length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="api">API Usage</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Connection Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={integration.status} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{integration.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sync Frequency</span><span>{integration.syncFrequency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Records Synced</span><span>{integration.recordsSynced.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uptime (30d)</span><span className="text-green-600">{integration.uptime}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">API Version</span><span className="font-mono text-xs">{integration.apiVersion}</span></div>
              {isCustom && customInteg && <>
                <div className="flex justify-between"><span className="text-muted-foreground">Auth Type</span><span>{customInteg.authType}</span></div>
                <div className="flex justify-between items-center gap-4"><span className="text-muted-foreground">Base URL</span><span className="font-mono text-xs truncate max-w-xs">{customInteg.baseUrl}</span></div>
                {customInteg.webhookUrl && <div className="flex justify-between items-center gap-4"><span className="text-muted-foreground">Webhook URL</span><span className="font-mono text-xs truncate max-w-xs">{customInteg.webhookUrl}</span></div>}
              </>}
            </CardContent>
          </Card>

          {/* Analytics overview */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total API Calls", value: analytics.totalApiCalls.toLocaleString(), color: "" },
              { label: "Success Rate", value: `${analytics.successRate}%`, color: analytics.successRate >= 95 ? "text-green-600" : "text-yellow-600" },
              { label: "Failed Syncs", value: analytics.failedSyncs.toString(), color: analytics.failedSyncs > 20 ? "text-red-600" : "" },
              { label: "Avg Response", value: `${analytics.avgResponseMs}ms`, color: analytics.avgResponseMs < 500 ? "text-green-600" : analytics.avgResponseMs < 1000 ? "text-yellow-600" : "text-red-600" },
              { label: "Data Processed", value: `${analytics.dataVolumeMB.toLocaleString()} MB`, color: "" },
            ].map((m) => (
              <Card key={m.label}><CardContent className="pt-4 text-center">
                <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        {/* Sync History */}
        <TabsContent value="sync" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-4" /> Sync Logs</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-right px-4 py-3">Records</th>
                  <th className="text-right px-4 py-3">Duration</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr></thead>
                <tbody>
                  {syncLogs.map((s, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-2 text-muted-foreground">{formatDateTime(s.time)}</td>
                      <td className="px-4 py-2 text-right">{s.records > 0 ? s.records : "—"}</td>
                      <td className="px-4 py-2 text-right">{s.duration}</td>
                      <td className="px-4 py-2">
                        {s.status === "success" ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="size-3" /> Success</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle className="size-3" /> Error</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {syncLogs.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No sync history yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Error Logs */}
        <TabsContent value="errors" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-red-500" /> Error Logs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {errorLogs.length === 0 ? (
                <div className="text-center py-8 text-green-600 flex flex-col items-center gap-2">
                  <CheckCircle className="size-8" />
                  <p className="text-sm">No errors recorded</p>
                </div>
              ) : errorLogs.map((err, i) => (
                <div key={i} className={`rounded-lg border p-3 text-sm ${err.resolved ? "border-muted bg-muted/30" : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-red-700 dark:text-red-400">{err.code}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(err.time)}</span>
                  </div>
                  <p className="mt-1 text-foreground">{err.message}</p>
                  <p className={`text-xs mt-1 ${err.resolved ? "text-green-600" : "text-red-500 font-medium"}`}>
                    {err.resolved ? "✓ Resolved" : "⚠ Unresolved — requires attention"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Usage */}
        <TabsContent value="api" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Daily API Calls — Last 14 Days</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="calls" name="API Calls" radius={[3, 3, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={i === chartData.length - 1 ? "var(--primary)" : "#4F46E580"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xl font-bold">{analytics.totalApiCalls.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total API Calls</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className={`text-xl font-bold ${analytics.successRate >= 95 ? "text-green-600" : "text-yellow-600"}`}>{analytics.successRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Sync Success Rate</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className={`text-xl font-bold ${analytics.avgResponseMs < 500 ? "text-green-600" : "text-yellow-600"}`}>{analytics.avgResponseMs}ms</p>
              <p className="text-xs text-muted-foreground mt-1">Avg Response Time</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xl font-bold">{analytics.dataVolumeMB.toLocaleString()} MB</p>
              <p className="text-xs text-muted-foreground mt-1">Data Volume Processed</p>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* Field Mapping */}
        <TabsContent value="mapping" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
              <p className="text-xs text-muted-foreground">DentalOS Field → External System Field</p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">DentalOS Field</th>
                  <th className="text-center px-4 py-3"></th>
                  <th className="text-left px-4 py-3">External Field</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-center px-4 py-3">Active</th>
                </tr></thead>
                <tbody>
                  {fieldMappings.map((f, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-2">
                        <span className="font-medium text-primary">{isCustom ? f.destination : f.dentalOsField}</span>
                      </td>
                      <td className="px-4 py-2 text-center text-muted-foreground"><ArrowRight className="size-4 mx-auto" /></td>
                      <td className="px-4 py-2 font-mono text-xs">{isCustom ? f.source : f.source}</td>
                      <td className="px-4 py-2 text-muted-foreground">{f.type}</td>
                      <td className="px-4 py-2 text-center">{f.synced ? <CheckCircle className="size-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Registered Webhook Events</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {webhookEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No webhook events configured</p>
              ) : webhookEvents.map((event) => (
                <div key={event} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span className="size-2 rounded-full bg-green-500 shrink-0" />
                  <span className="font-mono text-sm">{event}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Listening</span>
                </div>
              ))}
            </CardContent>
          </Card>
          {(isCustom ? customInteg?.webhookUrl : null) && (
            <Card>
              <CardHeader><CardTitle>Webhook Endpoint</CardTitle></CardHeader>
              <CardContent>
                <p className="font-mono text-sm bg-muted rounded-lg px-3 py-2 break-all">{customInteg?.webhookUrl}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Workflow Integration */}
        <TabsContent value="workflows" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="size-4 text-yellow-500" /> Workflow Triggers</CardTitle>
              <p className="text-xs text-muted-foreground">These events from this integration can trigger DentalOS workflows</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {WORKFLOW_TRIGGERS.map((trigger) => {
                const active = workflowTriggers.includes(trigger.id);
                return (
                  <div key={trigger.id} className={`flex items-start gap-3 rounded-lg border p-3 ${active ? trigger.color : "border-border bg-muted/30"}`}>
                    <div className={`size-2 rounded-full mt-1.5 shrink-0 ${active ? "bg-current" : "bg-muted-foreground/30"}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${active ? "" : "text-muted-foreground"}`}>{trigger.label}</p>
                      <p className={`text-xs mt-0.5 ${active ? "opacity-80" : "text-muted-foreground"}`}>{trigger.desc}</p>
                    </div>
                    <span className={`text-xs font-medium ${active ? "" : "text-muted-foreground"}`}>{active ? "Active" : "Inactive"}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings / Test */}
        <TabsContent value="settings" className="mt-4 space-y-4">

          {/* Sync Schedule Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="size-4" /> Sync Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current schedule display */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{currentFreq || "Not configured"}</p>
                  {integration.lastSync && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last synced {timeAgo(integration.lastSync)} · {formatDateTime(integration.lastSync)}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={() => setSyncFreqEdit(currentFreq)}>
                    Edit Schedule
                  </Button>
                )}
              </div>

              {/* Inline editor */}
              {syncFreqEdit !== null && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
                  <p className="text-sm font-medium text-foreground">Choose new sync frequency</p>

                  {/* Preset grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {SYNC_PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setSyncFreqEdit(p)}
                        className={`rounded-lg border px-2 py-2 text-xs text-center transition-colors leading-tight ${syncFreqEdit === p ? "border-primary bg-primary text-primary-foreground font-medium" : "border-border hover:border-primary/60 hover:bg-muted"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Custom value */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Or enter a custom schedule</p>
                    <input
                      value={syncFreqEdit}
                      onChange={(e) => setSyncFreqEdit(e.target.value)}
                      placeholder="e.g. Every 3 hours"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {syncFreqEdit && (
                    <div className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
                      Will sync: <strong>{syncFreqEdit}</strong>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSyncFreqEdit(null)}>Cancel</Button>
                    <Button size="sm" onClick={saveSyncFreq} disabled={!syncFreqEdit?.trim()}>Save Schedule</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Test Connection</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Send a test ping to verify connectivity and authentication.</p>
              <Button onClick={handleTest} disabled={testing}>
                <RefreshCw className={`size-4 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              {testResult === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-600 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-3">
                  <CheckCircle className="size-4 shrink-0" /> Connection successful — authentication verified
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Run Manual Sync</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Trigger a full sync immediately outside the scheduled frequency.</p>
              {canEdit ? (
                <Button onClick={handleRunSync} disabled={syncing || integration.status !== "connected"} variant="outline">
                  <Play className={`size-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Run Sync Now"}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Read-only access — contact your admin to run manual syncs.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
