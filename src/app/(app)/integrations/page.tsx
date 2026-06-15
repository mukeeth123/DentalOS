"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Database, Camera, Shield, MessageSquare, CreditCard, BookOpen, Globe, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import integrationsData from "@/mock/integrations.json";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

const ICONS: Record<string, React.ElementType> = {
  "open-dental": Database,
  dentrix: Database,
  dexis: Camera,
  dentalxchange: Shield,
  weave: MessageSquare,
  stripe: CreditCard,
  quickbooks: BookOpen,
  "google-workspace": Globe,
  twilio: Phone,
  sendgrid: Mail,
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
};

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState(integrationsData);
  const [connecting, setConnecting] = useState<string | null>(null);

  const toggleConnect = (id: string, currentStatus: string) => {
    setConnecting(id);
    setTimeout(() => {
      setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, status: currentStatus === "connected" ? "disconnected" : "connected", lastSync: currentStatus === "connected" ? null : new Date().toISOString() } : i));
      const integ = integrations.find((i) => i.id === id);
      toast.success(currentStatus === "connected" ? `${integ?.name} disconnected` : `${integ?.name} connected successfully`);
      setConnecting(null);
    }, 1200);
  };

  const connected = integrations.filter((i) => i.status === "connected").length;
  const avgHealth = Math.round(integrations.filter((i) => i.status === "connected").reduce((s, i) => s + i.healthScore, 0) / Math.max(connected, 1));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Integration Hub</h2>
        <p className="text-sm text-muted-foreground">{connected} of {integrations.length} integrations connected</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{connected}</p>
          <p className="text-xs text-muted-foreground mt-1">Connected</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{avgHealth}%</p>
          <p className="text-xs text-muted-foreground mt-1">Avg Health Score</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{integrations.reduce((s, i) => s + i.recordsSynced, 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Records Synced</p>
        </CardContent></Card>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {integrations.map((integration) => {
          const Icon = ICONS[integration.id] ?? Zap;
          const iconClass = ICON_COLORS[integration.category] ?? "bg-gray-100 text-gray-700";

          return (
            <Card key={integration.id} className="hover:ring-primary/30 transition-all cursor-pointer" onClick={() => router.push(`/integrations/${integration.id}`)}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${iconClass}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.category}</p>
                  </div>
                  <StatusBadge status={integration.status} size="sm" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>

                {integration.status === "connected" && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Health</span>
                      <span className={`font-medium ${integration.healthScore >= 90 ? "text-green-600" : integration.healthScore >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                        {integration.healthScore}%
                      </span>
                    </div>
                    <Progress value={integration.healthScore} className="h-1" />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {integration.lastSync ? (
                      <span>{integration.syncFrequency}</span>
                    ) : (
                      <span>Not configured</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/integrations/${integration.id}`); }}>
                      Details
                    </Button>
                    <Button
                      size="xs"
                      variant={integration.status === "connected" ? "destructive" : "default"}
                      disabled={connecting === integration.id}
                      onClick={(e) => { e.stopPropagation(); toggleConnect(integration.id, integration.status); }}
                    >
                      {connecting === integration.id ? "..." : integration.status === "connected" ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
