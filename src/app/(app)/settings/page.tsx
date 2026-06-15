"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAgentStore } from "@/stores/agentStore";
import { useCanEdit } from "@/hooks/usePermission";

const PRIMARY_COLORS = [
  { name: "Indigo", value: "#4F46E5" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
];

const BUSINESS_HOURS = [
  { day: "Monday", open: "08:00", close: "17:00", active: true },
  { day: "Tuesday", open: "08:00", close: "17:00", active: true },
  { day: "Wednesday", open: "08:00", close: "17:00", active: true },
  { day: "Thursday", open: "08:00", close: "17:00", active: true },
  { day: "Friday", open: "08:00", close: "14:00", active: true },
  { day: "Saturday", open: "09:00", close: "13:00", active: false },
  { day: "Sunday", open: "Closed", close: "Closed", active: false },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { agents, toggleAgent } = useAgentStore();
  const canEdit = useCanEdit("Settings");

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your DentalOS AI workspace</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Practice Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Practice Name</label>
                  <Input defaultValue="SmileCare Dental" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Phone</label>
                  <Input defaultValue="(512) 555-0101" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Address</label>
                <Input defaultValue="123 Main St, Austin, TX 78701" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">NPI Number</label>
                  <Input defaultValue="1234567890" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Tax ID</label>
                  <Input defaultValue="12-3456789" type="password" />
                </div>
              </div>
              {canEdit && <Button size="sm">Save Changes</Button>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Business Hours</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {BUSINESS_HOURS.map((h) => (
                  <div key={h.day} className="flex items-center gap-4 text-sm">
                    <span className="w-24 font-medium">{h.day}</span>
                    {h.active ? (
                      <>
                        <Input defaultValue={h.open} className="w-24 h-7 text-xs" />
                        <span className="text-muted-foreground">to</span>
                        <Input defaultValue={h.close} className="w-24 h-7 text-xs" />
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs">Closed</span>
                    )}
                    <Switch defaultChecked={h.active} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Light", icon: Sun, preview: "bg-white border-2" },
                  { value: "dark", label: "Dark", icon: Moon, preview: "bg-gray-900 border-2" },
                  { value: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-br from-white to-gray-900 border-2" },
                ].map((t) => {
                  const Icon = t.icon;
                  const selected = theme === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}
                    >
                      <div className={`rounded-lg h-16 mb-2 ${t.preview}`} />
                      <div className="flex items-center justify-center gap-1.5">
                        <Icon className="size-3.5" />
                        <span className="text-sm font-medium">{t.label}</span>
                      </div>
                      {selected && <p className="text-xs text-primary mt-1">Active</p>}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Primary Color</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {PRIMARY_COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.name}
                    className="size-8 rounded-full ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-foreground/20 transition-all"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Current theme uses Indigo (DentalOS default)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "New appointment bookings", desc: "When AI Receptionist books a new appointment" },
                { label: "Claim status updates", desc: "When claims are approved, denied, or paid" },
                { label: "Payment received", desc: "When patient or insurance payment is recorded" },
                { label: "AI agent alerts", desc: "When an agent encounters an issue or needs review" },
                { label: "Daily digest", desc: "Daily summary of practice performance at 8 AM" },
                { label: "Weekly report", desc: "Weekly performance report every Monday" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={i < 4} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{agent.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.description}</p>
                      </div>
                      <Switch checked={agent.status !== "paused"} onCheckedChange={() => toggleAgent(agent.id)} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground">Confidence Threshold</p>
                        <span className="text-xs font-bold text-primary">75%</span>
                      </div>
                      <Slider defaultValue={[75]} min={50} max={99} step={1} className="mb-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Working Hours: Mon–Fri 8AM–6PM · Success Rate: <span className="font-medium text-green-600">{agent.successRate}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Two-Factor Authentication", desc: "Require 2FA for all staff logins", enabled: true },
                { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
                { label: "IP Allowlist", desc: "Restrict access to approved IP addresses", enabled: false },
                { label: "Audit Logging", desc: "Log all user actions for compliance", enabled: true },
                { label: "HIPAA Audit Reports", desc: "Monthly HIPAA compliance reports", enabled: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.enabled} />
                </div>
              ))}
              <div className="h-px bg-border" />
              <div>
                <label className="text-sm font-medium block mb-2">Change Password</label>
                <div className="space-y-2">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                  <Input type="password" placeholder="Confirm new password" />
                  <Button size="sm">Update Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
