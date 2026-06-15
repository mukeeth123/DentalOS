"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useAgentStore, getNextActivity } from "@/stores/agentStore";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  idle: "bg-gray-400",
  paused: "bg-yellow-500",
};

function ConfigureSheet({ agent, onClose }: { agent: any; onClose: () => void }) {
  const { toggleAgent } = useAgentStore();
  const [threshold, setThreshold] = useState<number[]>([agent.successRate ?? 75]);
  const [autoApprove, setAutoApprove] = useState(true);
  const [notify, setNotify] = useState(true);
  const handleSave = () => {
    toast.success(`${agent.name} configuration saved`);
    onClose();
  };
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">{agent.avatar}</span> Configure {agent.name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Current Status</p>
            <p className="font-medium capitalize">{agent.status} · {agent.tasksToday} tasks today · {agent.successRate}% success</p>
            <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Agent Active</Label>
              <p className="text-xs text-muted-foreground">Enable or pause this AI agent</p>
            </div>
            <Switch checked={agent.status !== "paused"} onCheckedChange={() => toggleAgent(agent.id)} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Label>Confidence Threshold</Label>
              <span className="text-sm font-bold text-primary">{threshold[0]}%</span>
            </div>
            <Slider value={threshold} onValueChange={(v) => setThreshold(Array.isArray(v) ? v : [v as number])} min={50} max={99} step={1} />
            <p className="text-xs text-muted-foreground mt-1">Agent will only act when confidence exceeds this threshold</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Approve Actions</Label>
              <p className="text-xs text-muted-foreground">Allow agent to act without manual review</p>
            </div>
            <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Notifications</Label>
              <p className="text-xs text-muted-foreground">Alert me when agent flags issues</p>
            </div>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </div>
          <div>
            <Label>Working Hours</Label>
            <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
              <option>24/7 (No restrictions)</option>
              <option>Business hours only (Mon-Fri 8AM-6PM)</option>
              <option>Custom schedule</option>
            </select>
          </div>
          <Button className="w-full" onClick={handleSave}>Save Configuration</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AIWorkforcePage() {
  const { agents, activities, addActivity } = useAgentStore();
  const [configAgent, setConfigAgent] = useState<any | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      addActivity(getNextActivity());
    }, 6000);
    return () => clearInterval(interval);
  }, [addActivity]);

  const totalTasks = agents.reduce((s, a) => s + a.tasksToday, 0);
  const totalRevenue = agents.reduce((s, a) => s + a.revenueToday, 0);
  const activeCount = agents.filter((a) => a.status === "active").length;

  const router = useRouter();

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Your AI Workforce</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 text-sm font-semibold">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              {activeCount} Agents Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{totalTasks} tasks completed today · {formatCurrency(totalRevenue)} revenue generated</p>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
          >
            <Card className="h-full cursor-pointer hover:ring-primary/30 transition-all" onClick={() => router.push(`/ai-workforce/${agent.id}`)}>
              <CardContent className="pt-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{agent.avatar}</span>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{agent.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`size-1.5 rounded-full ${STATUS_COLORS[agent.status] ?? "bg-gray-400"} ${agent.status === "active" ? "animate-pulse" : ""}`} />
                        <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted p-1.5">
                    <p className="text-sm font-bold">{agent.tasksToday}</p>
                    <p className="text-[10px] text-muted-foreground">Tasks</p>
                  </div>
                  <div className="rounded-lg bg-muted p-1.5">
                    <p className="text-sm font-bold text-green-600">{agent.successRate}%</p>
                    <p className="text-[10px] text-muted-foreground">Success</p>
                  </div>
                  <div className="rounded-lg bg-muted p-1.5">
                    <p className="text-sm font-bold text-primary">{agent.revenueToday > 0 ? `$${(agent.revenueToday / 1000).toFixed(1)}k` : "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={agent.sparklineData.map((v, i) => ({ i, v }))}>
                      <Line type="monotone" dataKey="v" stroke="#4F46E5" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {agent.currentActivity && (
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {agent.status === "active" && <span className="inline-block size-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />}
                    {agent.currentActivity}
                  </p>
                )}

                <div className="flex gap-2 mt-auto pt-1">
                  <Button size="xs" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/ai-workforce/${agent.id}`); }}>View Agent</Button>
                  <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); setConfigAgent(agent); }}>Configure</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live Activity Strip */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Live Activity Feed
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {activities.slice(0, 15).map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx === 0 ? 0 : 0 }}
              className="shrink-0 w-64 rounded-xl border border-border bg-card p-3 text-sm"
            >
              <p className="font-medium text-xs text-primary truncate">{activity.agentName}</p>
              <p className="text-sm mt-1 leading-snug line-clamp-2">{activity.action}</p>
              {activity.outcome && <p className="text-xs text-green-600 mt-1">✓ {activity.outcome}</p>}
              <p className="text-[10px] text-muted-foreground mt-2">{timeAgo(activity.timestamp)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    {configAgent && <ConfigureSheet agent={configAgent} onClose={() => setConfigAgent(null)} />}
    </>
  );
}
