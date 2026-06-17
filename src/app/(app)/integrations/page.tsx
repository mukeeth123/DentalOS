"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Database, Camera, Shield, MessageSquare, CreditCard, BookOpen, Globe,
  Phone, Mail, Plus, Plug, Settings2, BarChart3, ChevronDown, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import integrationsData from "@/mock/integrations.json";
import { useCustomIntegrationsStore, type CustomIntegration, type AuthType, type CICategory } from "@/stores/customIntegrationsStore";
import { useAuthStore } from "@/stores/authStore";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const ICONS: Record<string, React.ElementType> = {
  "open-dental": Database, dentrix: Database, dexis: Camera, dentalxchange: Shield,
  weave: MessageSquare, stripe: CreditCard, quickbooks: BookOpen,
  "google-workspace": Globe, twilio: Phone, sendgrid: Mail,
};
const ICON_COLORS: Record<string, string> = {
  "Practice Management": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Imaging": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Claims Clearinghouse": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Communications": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Payments": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Accounting": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Productivity": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "SMS/Voice": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "Email": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "CRM Systems": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "ERP Systems": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "HR Systems": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "Accounting Platforms": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Marketing Platforms": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  "Insurance Platforms": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "Custom AI Services": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
  "Internal Enterprise Systems": "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

const CATEGORY_OPTIONS: CICategory[] = [
  "CRM Systems", "ERP Systems", "HR Systems", "Accounting Platforms",
  "Marketing Platforms", "Insurance Platforms", "Custom AI Services", "Internal Enterprise Systems",
];
const AUTH_OPTIONS: AuthType[] = ["API Key", "Bearer Token", "OAuth 2.0", "Basic Auth"];
const FREQ_OPTIONS = ["Real-time", "Every 15 minutes", "Every 30 minutes", "Every 1 hour", "Every 2 hours", "Every 4 hours", "Every 6 hours", "Daily at 6 AM", "Daily at 2 AM", "Weekly"];

const BLANK_FORM = {
  name: "", description: "", category: "CRM Systems" as CICategory,
  baseUrl: "", authType: "API Key" as AuthType, webhookUrl: "",
  syncFrequency: "Every 30 minutes", status: "connected" as "connected" | "disconnected",
};

export default function IntegrationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const canEdit = ["Super Admin", "DSO Admin", "Clinic Owner"].includes(user?.role ?? "");

  const [integrations, setIntegrations] = useState(integrationsData);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { integrations: customList, addIntegration, updateStatus: updateCI } = useCustomIntegrationsStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [ciConnecting, setCiConnecting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"platform" | "custom">("platform");

  // Sync schedule editor
  type SyncTarget = { id: string; name: string; freq: string; isCustom: boolean };
  const [syncEditTarget, setSyncEditTarget] = useState<SyncTarget | null>(null);
  const [newFreq, setNewFreq] = useState("");
  const { updateIntegration: updateCI2 } = useCustomIntegrationsStore();

  const openSyncEdit = (id: string, name: string, freq: string, isCustom: boolean) => {
    if (!canEdit) { toast.error("Read-only access"); return; }
    setSyncEditTarget({ id, name, freq, isCustom });
    setNewFreq(freq);
  };

  const saveSyncFreq = () => {
    if (!syncEditTarget) return;
    if (syncEditTarget.isCustom) {
      updateCI2(syncEditTarget.id, { syncFrequency: newFreq });
    } else {
      setIntegrations((prev) => prev.map((i) => i.id === syncEditTarget.id ? { ...i, syncFrequency: newFreq } : i));
    }
    toast.success(`Sync schedule updated to "${newFreq}" for ${syncEditTarget.name}`);
    setSyncEditTarget(null);
  };

  const toggleConnect = (id: string, currentStatus: string) => {
    if (!canEdit) { toast.error("Read-only access"); return; }
    setConnecting(id);
    setTimeout(() => {
      setIntegrations((prev) => prev.map((i) => i.id === id
        ? { ...i, status: currentStatus === "connected" ? "disconnected" : "connected", lastSync: currentStatus === "connected" ? null : new Date().toISOString() }
        : i
      ));
      const integ = integrations.find((i) => i.id === id);
      toast.success(currentStatus === "connected" ? `${integ?.name} disconnected` : `${integ?.name} connected successfully`);
      setConnecting(null);
    }, 1200);
  };

  const toggleCI = (id: string, currentStatus: string) => {
    if (!canEdit) { toast.error("Read-only access"); return; }
    setCiConnecting(id);
    setTimeout(() => {
      updateCI(id, currentStatus === "connected" ? "disconnected" : "connected");
      toast.success(currentStatus === "connected" ? "Integration disconnected" : "Integration connected");
      setCiConnecting(null);
    }, 1200);
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.baseUrl.trim()) { toast.error("Name and Base URL are required"); return; }
    setSaving(true);
    setTimeout(() => {
      const newCI: CustomIntegration = {
        id: `ci-${Date.now()}`,
        name: form.name,
        description: form.description,
        category: form.category,
        status: form.status,
        healthScore: form.status === "connected" ? Math.floor(70 + Math.random() * 25) : 0,
        baseUrl: form.baseUrl,
        authType: form.authType,
        webhookUrl: form.webhookUrl,
        syncFrequency: form.syncFrequency,
        lastSync: form.status === "connected" ? new Date().toISOString() : null,
        recordsSynced: form.status === "connected" ? Math.floor(100 + Math.random() * 500) : 0,
        uptime: form.status === "connected" ? parseFloat((95 + Math.random() * 4.9).toFixed(1)) : 0,
        apiVersion: "v1.0",
        totalApiCalls: form.status === "connected" ? Math.floor(1000 + Math.random() * 5000) : 0,
        successRate: form.status === "connected" ? parseFloat((92 + Math.random() * 7).toFixed(1)) : 0,
        failedSyncs: form.status === "connected" ? Math.floor(Math.random() * 10) : 0,
        avgResponseMs: form.status === "connected" ? Math.floor(100 + Math.random() * 900) : 0,
        dataVolumeMB: form.status === "connected" ? Math.floor(50 + Math.random() * 500) : 0,
        fieldMappings: [],
        webhookEvents: form.webhookUrl ? ["data.received"] : [],
        workflowTriggers: ["sync_success", "sync_failed"],
        syncLogs: form.status === "connected" ? [{ time: new Date().toISOString(), records: 0, duration: "—", status: "success" }] : [],
        errorLogs: [],
      };
      addIntegration(newCI);
      toast.success(`${form.name} created successfully`);
      setSaving(false);
      setBuilderOpen(false);
      setForm(BLANK_FORM);
      setActiveTab("custom");
    }, 1000);
  };

  const connected = integrations.filter((i) => i.status === "connected").length;
  const ciConnected = customList.filter((i) => i.status === "connected").length;
  const allConnected = connected + ciConnected;
  const allTotal = integrations.length + customList.length;
  const avgHealth = Math.round(
    [...integrations, ...customList].filter((i) => i.status === "connected").reduce((s, i) => s + i.healthScore, 0) /
    Math.max(allConnected, 1)
  );
  const totalRecords = [...integrations, ...customList].reduce((s, i) => s + i.recordsSynced, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Integration Hub</h2>
          <p className="text-sm text-muted-foreground">{allConnected} of {allTotal} integrations connected</p>
        </div>
        {canEdit && (
          <Button onClick={() => setBuilderOpen(true)} className="shrink-0">
            <Plus className="size-4" /> Create Custom Integration
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allConnected}</p>
          <p className="text-xs text-muted-foreground mt-1">Connected</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{avgHealth}%</p>
          <p className="text-xs text-muted-foreground mt-1">Avg Health Score</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Records Synced</p>
        </CardContent></Card>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {(["platform", "custom"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "platform" ? `Platform Integrations (${integrations.length})` : `Custom Integrations (${customList.length})`}
          </button>
        ))}
      </div>

      {/* Platform Integrations */}
      {activeTab === "platform" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {integrations.map((integration) => {
            const Icon = ICONS[integration.id] ?? Zap;
            const iconClass = ICON_COLORS[integration.category] ?? "bg-gray-100 text-gray-700";
            return (
              <IntegrationCard
                key={integration.id}
                id={integration.id}
                name={integration.name}
                category={integration.category}
                description={integration.description}
                status={integration.status}
                healthScore={integration.healthScore}
                syncFrequency={integration.syncFrequency}
                lastSync={integration.lastSync}
                Icon={Icon}
                iconClass={iconClass}
                connecting={connecting === integration.id}
                canEdit={canEdit}
                onDetails={() => router.push(`/integrations/${integration.id}`)}
                onToggle={() => toggleConnect(integration.id, integration.status)}
                onSyncEdit={() => openSyncEdit(integration.id, integration.name, integration.syncFrequency, false)}
              />
            );
          })}
        </div>
      )}

      {/* Custom Integrations */}
      {activeTab === "custom" && (
        <div className="space-y-4">
          {customList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 border-2 border-dashed border-border rounded-xl">
              <Plug className="size-10 text-muted-foreground" />
              <p className="text-muted-foreground">No custom integrations yet</p>
              {canEdit && <Button onClick={() => setBuilderOpen(true)} size="sm"><Plus className="size-4" /> Create First Integration</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {customList.map((ci) => {
                const iconClass = ICON_COLORS[ci.category] ?? "bg-gray-100 text-gray-700";
                return (
                  <IntegrationCard
                    key={ci.id}
                    id={ci.id}
                    name={ci.name}
                    category={ci.category}
                    description={ci.description}
                    status={ci.status}
                    healthScore={ci.healthScore}
                    syncFrequency={ci.syncFrequency}
                    lastSync={ci.lastSync}
                    Icon={Plug}
                    iconClass={iconClass}
                    connecting={ciConnecting === ci.id}
                    canEdit={canEdit}
                    onDetails={() => router.push(`/integrations/${ci.id}`)}
                    onToggle={() => toggleCI(ci.id, ci.status)}
                    onSyncEdit={() => openSyncEdit(ci.id, ci.name, ci.syncFrequency, true)}
                    isCustom
                  />
                );
              })}
            </div>
          )}

          {/* Custom Integration Analytics summary */}
          {customList.filter((c) => c.status === "connected").length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-4" /> Custom Integration Analytics</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left px-3 py-2">Integration</th>
                      <th className="text-right px-3 py-2">API Calls</th>
                      <th className="text-right px-3 py-2">Success Rate</th>
                      <th className="text-right px-3 py-2">Failed Syncs</th>
                      <th className="text-right px-3 py-2">Avg Resp</th>
                      <th className="text-right px-3 py-2">Data (MB)</th>
                    </tr></thead>
                    <tbody>
                      {customList.filter((c) => c.status === "connected").map((c) => (
                        <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/integrations/${c.id}`)}>
                          <td className="px-3 py-2 font-medium">{c.name}</td>
                          <td className="px-3 py-2 text-right">{c.totalApiCalls.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={c.successRate >= 95 ? "text-green-600" : c.successRate >= 80 ? "text-yellow-600" : "text-red-600"}>
                              {c.successRate}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">{c.failedSyncs > 0 ? <span className="text-red-500">{c.failedSyncs}</span> : "0"}</td>
                          <td className="px-3 py-2 text-right">{c.avgResponseMs}ms</td>
                          <td className="px-3 py-2 text-right">{c.dataVolumeMB.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Sync Schedule Editor Dialog */}
      <Dialog open={!!syncEditTarget} onOpenChange={(o) => { if (!o) setSyncEditTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Clock className="size-4" /> Edit Sync Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Updating schedule for <strong>{syncEditTarget?.name}</strong></p>

            {/* Quick presets */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quick Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                {["Real-time", "Every 15 minutes", "Every 30 minutes", "Every 1 hour", "Every 2 hours", "Every 4 hours", "Every 6 hours", "Every 12 hours", "Every 24 hours", "Daily at 6 AM", "Daily at 2 AM", "Weekly"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setNewFreq(f)}
                    className={`rounded-lg border px-2 py-1.5 text-xs text-left transition-colors ${newFreq === f ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50 hover:bg-muted"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Or type a custom schedule</Label>
              <Input
                value={newFreq}
                onChange={(e) => setNewFreq(e.target.value)}
                placeholder="e.g. Every 3 hours"
              />
            </div>

            {newFreq && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary">
                New schedule: <strong>{newFreq}</strong>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setSyncEditTarget(null)}>Cancel</Button>
              <Button className="flex-1" onClick={saveSyncFreq} disabled={!newFreq.trim()}>Save Schedule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Custom Integration Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings2 className="size-4" /> Create Custom Integration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Integration Name *</Label>
                <Input placeholder="e.g. Salesforce CRM" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Description</Label>
                <Input placeholder="What does this integration do?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <div className="relative">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as CICategory })}
                  >
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Authentication Type</Label>
                <div className="relative">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.authType}
                    onChange={(e) => setForm({ ...form, authType: e.target.value as AuthType })}
                  >
                    {AUTH_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted-foreground" />
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Base URL *</Label>
                <Input placeholder="https://api.yoursystem.com/v1" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Webhook URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input placeholder="https://hooks.dentalos.ai/..." value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Sync Frequency</Label>
                <div className="relative">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.syncFrequency}
                    onChange={(e) => setForm({ ...form, syncFrequency: e.target.value })}
                  >
                    {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Initial Status</Label>
                <div className="relative">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "connected" | "disconnected" })}
                  >
                    <option value="connected">Connected</option>
                    <option value="disconnected">Disconnected</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Category preview chips */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Workflow Triggers (auto-configured)</p>
              <div className="flex flex-wrap gap-1">
                {["Sync Success", "Sync Failed", "Data Received", "Webhook Event"].map((t) => (
                  <span key={t} className="bg-primary/10 text-primary rounded-full px-2 py-0.5">{t}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setBuilderOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating..." : "Create Integration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationCard({
  id, name, category, description, status, healthScore, syncFrequency, lastSync,
  Icon, iconClass, connecting, canEdit, onDetails, onToggle, onSyncEdit, isCustom,
}: {
  id: string; name: string; category: string; description: string;
  status: string; healthScore: number; syncFrequency: string; lastSync: string | null;
  Icon: React.ElementType; iconClass: string; connecting: boolean; canEdit: boolean;
  onDetails: () => void; onToggle: () => void; onSyncEdit: () => void; isCustom?: boolean;
}) {
  return (
    <Card className="hover:ring-primary/30 transition-all cursor-pointer" onClick={onDetails}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${iconClass}`}>
            <Icon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm truncate">{name}</p>
              {isCustom && <span className="shrink-0 text-[9px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0">CUSTOM</span>}
            </div>
            <p className="text-xs text-muted-foreground">{category}</p>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
        {status === "connected" && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Health</span>
              <span className={`font-medium ${healthScore >= 90 ? "text-green-600" : healthScore >= 70 ? "text-yellow-600" : "text-red-600"}`}>{healthScore}%</span>
            </div>
            <Progress value={healthScore} className="h-1" />
          </div>
        )}
        {/* Sync info row */}
        <div className="rounded-lg bg-muted/50 px-2.5 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs font-medium text-foreground">
              <Clock className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{lastSync ? syncFrequency : "Not configured"}</span>
            </div>
            {lastSync && (
              <p className="text-[10px] text-muted-foreground mt-0.5 pl-4">Last synced {timeAgo(lastSync)}</p>
            )}
          </div>
          {canEdit && status === "connected" && (
            <button
              onClick={(e) => { e.stopPropagation(); onSyncEdit(); }}
              className="shrink-0 text-[10px] text-primary hover:underline font-medium"
            >
              Edit
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); onDetails(); }}>Details</Button>
            {canEdit && (
              <Button size="xs" variant={status === "connected" ? "destructive" : "default"} disabled={connecting} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                {connecting ? "..." : status === "connected" ? "Disconnect" : "Connect"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
