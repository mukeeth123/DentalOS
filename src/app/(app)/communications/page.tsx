"use client";

import { useState } from "react";
import {
  Send, MessageSquare, Mail, Phone, Plus, X, Eye, Star,
  CheckCircle, Clock, Users, TrendingUp, FileText, Mic,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePatientsStore } from "@/stores/patientsStore";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useCanEdit } from "@/hooks/usePermission";

/* ─── Mock Data ─────────────────────────────────────────────────────────────── */
const INIT_CAMPAIGNS = [
  { id: "cp-1", name: "June Recall Campaign", type: "Recall", channel: "SMS", status: "Active", recipients: 67, sent: 52, opened: 33, openRate: "64%", revenue: 4200, createdAt: "2025-06-10" },
  { id: "cp-2", name: "No-Show Reactivation", type: "Reactivation", channel: "Email", status: "Active", recipients: 14, sent: 14, opened: 10, openRate: "71%", revenue: 1800, createdAt: "2025-06-12" },
  { id: "cp-3", name: "Birthday Greetings — June", type: "Birthday", channel: "SMS", status: "Completed", recipients: 8, sent: 8, opened: 8, openRate: "100%", revenue: 960, createdAt: "2025-06-01" },
  { id: "cp-4", name: "Post-Visit Review Request", type: "Review Request", channel: "Email", status: "Draft", recipients: 0, sent: 0, opened: 0, openRate: "—", revenue: 0, createdAt: "2025-06-15" },
  { id: "cp-5", name: "Implant Education Series", type: "Education", channel: "Voice", status: "Active", recipients: 23, sent: 19, opened: 12, openRate: "63%", revenue: 8400, createdAt: "2025-06-08" },
];

const INIT_REVIEWS = [
  { id: "r1", patient: "Sarah Johnson", email: "sarah.j@email.com", sent: "2025-06-14T10:00:00Z", clicked: true, reviewed: true, rating: 5, platform: "Google" },
  { id: "r2", patient: "Tom Wilson", email: "tom.w@email.com", sent: "2025-06-14T10:00:00Z", clicked: true, reviewed: false, rating: null, platform: "Google" },
  { id: "r3", patient: "Maria Garcia", email: "maria.g@email.com", sent: "2025-06-13T10:00:00Z", clicked: false, reviewed: false, rating: null, platform: "Yelp" },
  { id: "r4", patient: "James Rodriguez", email: "james.r@email.com", sent: "2025-06-12T10:00:00Z", clicked: true, reviewed: true, rating: 4, platform: "Google" },
  { id: "r5", patient: "Emma Thompson", email: "emma.t@email.com", sent: "2025-06-11T10:00:00Z", clicked: true, reviewed: true, rating: 5, platform: "Google" },
  { id: "r6", patient: "David Kim", email: "david.k@email.com", sent: "2025-06-10T10:00:00Z", clicked: true, reviewed: true, rating: 5, platform: "Healthgrades" },
];

/* Email Templates */
const EMAIL_TEMPLATES = [
  { id: "et1", name: "Recall Reminder", subject: "It's time for your dental check-up, {{name}}!", body: "Hi {{name}},\n\nWe noticed it's been a while since your last visit at SmileCare Dental. Your oral health is our priority!\n\nWe'd love to see you for a routine cleaning and exam. Preventive care is the best way to keep your smile healthy.\n\n📅 Click below to schedule your appointment:\n[Book Now →]\n\nYour teeth will thank you!\n\nWarm regards,\nSmileCare Dental Team\n(555) 100-2200" },
  { id: "et2", name: "Appointment Confirmation", subject: "Confirmed: Your appointment on {{date}} at {{time}}", body: "Hi {{name}},\n\nYour appointment is confirmed!\n\n📅 Date: {{date}}\n⏰ Time: {{time}}\n👨‍⚕️ Provider: {{provider}}\n📍 Location: 123 Smile Ave, Suite 200\n\nPlease arrive 10 minutes early to complete any paperwork.\n\nNeed to reschedule? Call us at (555) 100-2200 or reply to this email.\n\nSee you soon!\nSmileCare Dental" },
  { id: "et3", name: "Review Request", subject: "How was your visit, {{name}}? 😊", body: "Hi {{name}},\n\nThank you for choosing SmileCare Dental! We hope your recent visit went well.\n\nYour feedback means the world to us. Would you mind taking 60 seconds to leave us a review?\n\n⭐ [Leave a Google Review →]\n⭐ [Leave a Yelp Review →]\n\nYour review helps other patients find quality dental care.\n\nWith gratitude,\nDr. Sarah Martinez & the SmileCare Team" },
  { id: "et4", name: "No-Show Follow-Up", subject: "We missed you, {{name}} — let's reschedule", body: "Hi {{name}},\n\nWe noticed you weren't able to make your appointment on {{date}}. No worries — life gets busy!\n\nWe'd love to reschedule at a time that works for you:\n[Find Available Times →]\n\nOr call us at (555) 100-2200.\n\nTaking care of your oral health is important and we're here whenever you're ready.\n\nSmileCare Dental" },
];

/* SMS Templates */
const SMS_TEMPLATES = [
  { id: "st1", name: "Appointment Reminder", message: "Hi {{name}}! Reminder: You have an appointment tomorrow at {{time}} with {{provider}} at SmileCare Dental. Reply CONFIRM to confirm or CANCEL to cancel. (555) 100-2200" },
  { id: "st2", name: "Recall Outreach", message: "Hi {{name}}, it's SmileCare Dental! It's been a while since your last visit. Book your cleaning today: smilecare.com/book or call (555) 100-2200. Reply STOP to opt out." },
  { id: "st3", name: "Balance Reminder", message: "Hi {{name}}, you have an outstanding balance of ${{amount}} at SmileCare Dental. Pay online at smilecare.com/pay or call (555) 100-2200. Thank you!" },
  { id: "st4", name: "Review Request SMS", message: "Hi {{name}}! Thanks for visiting SmileCare Dental. Would you mind leaving us a quick review? It only takes 60 sec: g.page/smilecare ⭐ Thank you!" },
];

/* Voice Scripts */
const VOICE_SCRIPTS = [
  { id: "vs1", name: "Appointment Reminder Call", duration: "~45 sec", script: "Hi, this is Nova calling from SmileCare Dental with a reminder for {{name}}. You have an appointment scheduled for {{date}} at {{time}} with {{provider}}. Please call us at 555-100-2200 if you need to reschedule. We look forward to seeing you! Have a great day." },
  { id: "vs2", name: "Recall Outreach Call", duration: "~35 sec", script: "Hi, may I speak with {{name}}? This is Nova calling from SmileCare Dental. Our records show it's been a while since your last visit. We'd love to schedule a cleaning and exam for you. Please call us at 555-100-2200 or visit smilecare.com to book online. We hope to hear from you soon!" },
  { id: "vs3", name: "Balance Collection Call", duration: "~40 sec", script: "Hi {{name}}, this is Nova from SmileCare Dental billing department. You have an outstanding balance of ${{amount}}. We'd like to help you resolve this. Please call 555-100-2200 to discuss payment options. Thank you for your prompt attention." },
];

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  SMS: <MessageSquare className="size-3" />,
  Email: <Mail className="size-3" />,
  Voice: <Phone className="size-3" />,
};

/* ─── Campaign Detail Sheet ─────────────────────────────────────────────────── */
function CampaignSheet({ campaign, onClose }: { campaign: typeof INIT_CAMPAIGNS[0]; onClose: () => void }) {
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-2 py-0.5">{campaign.type}</span>
            {campaign.name}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Status", value: <StatusBadge status={campaign.status} /> },
              { label: "Channel", value: <span className="flex items-center gap-1 text-sm">{CHANNEL_ICON[campaign.channel]} {campaign.channel}</span> },
              { label: "Created", value: campaign.createdAt },
              { label: "Recipients", value: campaign.recipients },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <div className="font-medium text-sm">{value}</div>
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-semibold">Campaign Metrics</p>
            {[
              { label: "Messages Sent", value: campaign.sent, max: campaign.recipients, color: "bg-blue-500" },
              { label: "Opened / Clicked", value: campaign.opened, max: campaign.sent, color: "bg-green-500" },
            ].map(({ label, value, max, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value} / {max} ({max > 0 ? Math.round((value / max) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
            {campaign.revenue > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Revenue Attributed</span>
                <span className="font-bold text-green-600">${campaign.revenue.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Template preview based on channel */}
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold mb-2">Message Content</p>
            {campaign.channel === "Email" && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Subject: {EMAIL_TEMPLATES.find((t) => t.name.toLowerCase().includes(campaign.type.toLowerCase().split(" ")[0])) ? EMAIL_TEMPLATES[0].subject : "Your SmileCare Dental Update"}</p>
                <div className="bg-muted rounded-lg p-3 mt-2 whitespace-pre-line leading-relaxed">{EMAIL_TEMPLATES[0].body.replace("{{name}}", "[Patient Name]")}</div>
              </div>
            )}
            {campaign.channel === "SMS" && (
              <div className="bg-muted rounded-xl p-3 text-sm">{SMS_TEMPLATES[0].message.replace("{{name}}", "[Patient]").replace("{{time}}", "10:00 AM").replace("{{provider}}", "Dr. Martinez")}</div>
            )}
            {campaign.channel === "Voice" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Mic className="size-3" /> AI Voice Script — {VOICE_SCRIPTS[0].duration}</p>
                <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground italic leading-relaxed">&ldquo;{VOICE_SCRIPTS[0].script.replace("{{name}}", "[Patient Name]").replace("{{date}}", "June 20").replace("{{time}}", "10:00 AM").replace("{{provider}}", "Dr. Chen")}&rdquo;</div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => { toast.success(`Campaign "${campaign.name}" relaunched`); onClose(); }}>Relaunch Campaign</Button>
            <Button variant="outline" className="flex-1" onClick={() => { toast.info("Export coming soon"); }}>Export Results</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── New Campaign Dialog ────────────────────────────────────────────────────── */
function NewCampaignDialog({ onClose, onSave }: { onClose: () => void; onSave: (c: typeof INIT_CAMPAIGNS[0]) => void }) {
  const [step, setStep] = useState<"details" | "template" | "preview">("details");
  const [form, setForm] = useState({ name: "", type: "Recall", channel: "SMS" as "SMS" | "Email" | "Voice", audience: "all", message: "", subject: "", script: "" });

  const templateOptions = form.channel === "Email" ? EMAIL_TEMPLATES : form.channel === "SMS" ? SMS_TEMPLATES : VOICE_SCRIPTS;

  const handleSave = () => {
    if (!form.name) { toast.error("Campaign name required"); return; }
    onSave({
      id: `cp-${Date.now()}`,
      name: form.name,
      type: form.type,
      channel: form.channel,
      status: "Draft",
      recipients: 0,
      sent: 0,
      opened: 0,
      openRate: "—",
      revenue: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    toast.success(`Campaign "${form.name}" created as Draft`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-4" /> New Campaign
          </DialogTitle>
        </DialogHeader>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-4">
          {(["details", "template", "preview"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s || (i < ["details","template","preview"].indexOf(step)) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
              <span className={`text-xs capitalize ${step === s ? "font-semibold" : "text-muted-foreground"}`}>{s}</span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === "details" && (
          <div className="space-y-4">
            <div><Label>Campaign Name</Label><Input className="mt-1" placeholder="e.g. Summer Recall Drive" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                  {["Recall", "Reactivation", "Birthday", "Review Request", "Education", "Promotion", "Follow-Up"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Channel</Label>
                <div className="flex gap-2 mt-1">
                  {(["SMS", "Email", "Voice"] as const).map((ch) => (
                    <button key={ch} onClick={() => setForm((p) => ({ ...p, channel: ch }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm transition-colors ${form.channel === ch ? "border-primary bg-primary/10 text-primary font-medium" : "border-input hover:bg-muted"}`}>
                      {ch === "SMS" ? <MessageSquare className="size-3.5" /> : ch === "Email" ? <Mail className="size-3.5" /> : <Phone className="size-3.5" />}
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Target Audience</Label>
              <select value={form.audience} onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                <option value="all">All Active Patients (247)</option>
                <option value="overdue">Overdue for Recall (89)</option>
                <option value="noshow">No-Shows Last 90 Days (14)</option>
                <option value="birthday">Birthdays This Month (8)</option>
                <option value="postvisit">Post-Visit (Last 7 Days) (23)</option>
              </select>
            </div>
          </div>
        )}

        {step === "template" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose a template or write your own</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(templateOptions as any[]).map((t) => (
                <button key={t.id} onClick={() => setForm((p) => ({
                  ...p,
                  message: t.message ?? t.script ?? "",
                  subject: t.subject ?? "",
                  script: t.script ?? "",
                }))}
                  className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/50 ${(form.message === (t.message ?? t.script)) ? "border-primary bg-primary/5" : "border-border"}`}>
                  <p className="text-sm font-medium">{t.name}</p>
                  {"subject" in t && <p className="text-xs text-muted-foreground mt-0.5">{t.subject}</p>}
                  {"duration" in t && <p className="text-xs text-muted-foreground mt-0.5">{t.duration}</p>}
                </button>
              ))}
            </div>
            {form.channel === "Email" && (
              <div className="space-y-2">
                <div><Label>Subject Line</Label><Input className="mt-1" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} /></div>
                <div><Label>Body</Label><textarea rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} /></div>
              </div>
            )}
            {form.channel === "SMS" && (
              <div><Label>SMS Message</Label><textarea rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} /><p className="text-xs text-muted-foreground mt-1">{form.message.length}/160 characters</p></div>
            )}
            {form.channel === "Voice" && (
              <div><Label>Voice Script</Label><textarea rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mt-1 italic" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} /></div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Campaign</span><span className="font-semibold">{form.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span>{form.type}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Channel</span><span className="flex items-center gap-1">{CHANNEL_ICON[form.channel]} {form.channel}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Audience</span><span>{form.audience}</span></div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Message Preview</p>
              {form.channel === "Email" && form.subject && <p className="text-sm font-medium mb-2">Subject: {form.subject}</p>}
              {form.channel === "Voice" && <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Mic className="size-3" /> AI Voice Script</p>}
              <div className={`text-sm leading-relaxed whitespace-pre-line ${form.channel === "Voice" ? "italic text-muted-foreground" : ""}`}>
                {form.message || "No message content yet — go back to add a template."}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between mt-2">
          <Button variant="outline" onClick={() => step === "details" ? onClose() : setStep(step === "preview" ? "template" : "details")}>
            {step === "details" ? "Cancel" : "← Back"}
          </Button>
          <div className="flex gap-2">
            {step !== "preview" ? (
              <Button onClick={() => setStep(step === "details" ? "template" : "preview")}>Next →</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleSave}>Save as Draft</Button>
                <Button onClick={() => { handleSave(); toast.success("Campaign launched!"); }}>🚀 Launch Campaign</Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Send Review Request Dialog ────────────────────────────────────────────── */
function ReviewRequestDialog({ onClose, onSend }: { onClose: () => void; onSend: (r: typeof INIT_REVIEWS[0]) => void }) {
  const { patients } = usePatientsStore();
  const [patientSearch, setPatientSearch] = useState("");
  const [selected, setSelected] = useState<typeof patients[0] | null>(null);
  const [platform, setPlatform] = useState("Google");
  const [channel, setChannel] = useState<"Email" | "SMS">("Email");
  const [preview, setPreview] = useState(false);

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 5);

  const template = channel === "Email" ? EMAIL_TEMPLATES[2] : SMS_TEMPLATES[3];
  const name = selected ? `${selected.firstName} ${selected.lastName}` : "[Patient]";

  const handleSend = () => {
    if (!selected) { toast.error("Please select a patient"); return; }
    onSend({
      id: `r-${Date.now()}`,
      patient: name,
      email: selected.email,
      sent: new Date().toISOString(),
      clicked: false,
      reviewed: false,
      rating: null,
      platform,
    });
    toast.success(`Review request sent to ${name} via ${channel}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="size-4 text-yellow-500" /> Send Review Request</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Patient</Label>
            <Input className="mt-1" placeholder="Search patient..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
            {patientSearch && !selected && (
              <div className="mt-1 border border-border rounded-lg overflow-hidden">
                {filtered.map((p) => (
                  <button key={p.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => { setSelected(p); setPatientSearch(`${p.firstName} ${p.lastName}`); }}>
                    {p.firstName} {p.lastName} — {p.email}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Platform</Label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                {["Google", "Yelp", "Healthgrades", "Facebook", "Zocdoc"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label>Send via</Label>
              <div className="flex gap-2 mt-1">
                {(["Email", "SMS"] as const).map((ch) => (
                  <button key={ch} onClick={() => setChannel(ch)}
                    className={`flex-1 h-9 rounded-md border text-sm transition-colors flex items-center justify-center gap-1.5 ${channel === ch ? "border-primary bg-primary/10 text-primary font-medium" : "border-input hover:bg-muted"}`}>
                    {ch === "Email" ? <Mail className="size-3.5" /> : <MessageSquare className="size-3.5" />} {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{channel} Preview</p>
              <button onClick={() => setPreview(!preview)} className="text-xs text-primary hover:underline">{preview ? "Hide" : "Show full preview"}</button>
            </div>
            {channel === "Email" && <p className="text-xs font-medium text-muted-foreground">Subject: {(template as any).subject?.replace("{{name}}", name)}</p>}
            <div className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {(channel === "Email" ? (template as any).body : (template as any).message)?.replace(/{{name}}/g, name)}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!selected}><Send className="size-3.5" /> Send Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function CommunicationsPage() {
  const { patients } = usePatientsStore();
  const canEdit = useCanEdit("Patients");
  const [campaigns, setCampaigns] = useState(INIT_CAMPAIGNS);
  const [reviews, setReviews] = useState(INIT_REVIEWS);
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [newMessage, setNewMessage] = useState("");
  const [channelFilter, setChannelFilter] = useState("All");
  const [threadMessages, setThreadMessages] = useState([
    { id: "1", direction: "outbound", channel: "SMS", text: "Hi! This is a reminder that you have an appointment tomorrow at 10 AM with Dr. Martinez.", time: "Yesterday 2:00 PM" },
    { id: "2", direction: "inbound", channel: "SMS", text: "Thanks! I'll be there.", time: "Yesterday 2:15 PM" },
    { id: "3", direction: "outbound", channel: "SMS", text: "Great! Please arrive 10 minutes early to complete your forms. See you soon!", time: "Yesterday 2:16 PM" },
  ]);
  const [viewCampaign, setViewCampaign] = useState<typeof INIT_CAMPAIGNS[0] | null>(null);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [reviewRequestOpen, setReviewRequestOpen] = useState(false);

  const allComms = patients.flatMap((p) =>
    p.communications.map((c) => ({ ...c, patientName: `${p.firstName} ${p.lastName}`, patientId: p.id }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredComms = channelFilter === "All" ? allComms : allComms.filter((c) => c.channel === channelFilter);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setThreadMessages((prev) => [...prev, { id: Date.now().toString(), direction: "outbound", channel: "SMS", text: newMessage, time: "Just now" }]);
    setNewMessage("");
    toast.success("Message sent");
  };

  const avgRating = reviews.filter((r) => r.rating).reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.filter((r) => r.rating).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Communications Hub</h2>
          <p className="text-sm text-muted-foreground">Inbox · Campaigns · Review Requests</p>
        </div>
        {canEdit && <Button onClick={() => setNewCampaignOpen(true)}><Plus className="size-4" /> New Campaign</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-3 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><MessageSquare className="size-4 text-blue-600" /></div>
          <div><p className="text-xl font-bold">{allComms.length}</p><p className="text-xs text-muted-foreground">Total Messages</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><TrendingUp className="size-4 text-green-600" /></div>
          <div><p className="text-xl font-bold">{campaigns.filter((c) => c.status === "Active").length}</p><p className="text-xs text-muted-foreground">Active Campaigns</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"><Star className="size-4 text-yellow-600" /></div>
          <div><p className="text-xl font-bold">{avgRating.toFixed(1)} ⭐</p><p className="text-xs text-muted-foreground">Avg Review Rating</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Users className="size-4 text-purple-600" /></div>
          <div><p className="text-xl font-bold">{campaigns.reduce((s, c) => s + c.recipients, 0)}</p><p className="text-xs text-muted-foreground">Total Recipients</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="reviews">Review Requests</TabsTrigger>
        </TabsList>

        {/* ── Inbox ── */}
        <TabsContent value="inbox" className="mt-4">
          <div className="flex h-[calc(100vh-340px)] gap-4 min-h-[400px]">
            <Card className="w-72 shrink-0 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-border">
                <div className="flex gap-1">
                  {["All", "SMS", "Email", "Voice"].map((ch) => (
                    <button key={ch} onClick={() => setChannelFilter(ch)}
                      className={`flex-1 text-xs rounded-md py-1 transition-colors ${channelFilter === ch ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{ch}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border">
                {filteredComms.slice(0, 30).map((c) => (
                  <button key={c.id + c.patientId} className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${selectedPatient?.id === c.patientId ? "bg-muted/40" : ""}`}
                    onClick={() => { const p = patients.find((pt) => pt.id === c.patientId); if (p) setSelectedPatient(p); }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{c.patientName}</p>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        {CHANNEL_ICON[c.channel]}
                        {c.direction === "inbound" && <span className="size-1.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.preview}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(c.timestamp)}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="flex-1 overflow-hidden flex flex-col">
              {selectedPatient ? (
                <>
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                      <p className="text-xs text-muted-foreground">{selectedPatient.phone} · {selectedPatient.email}</p>
                    </div>
                    <div className="flex gap-1">
                      {["SMS", "Email", "Voice"].map((ch) => (
                        <button key={ch} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted flex items-center gap-1">
                          {CHANNEL_ICON[ch]}{ch}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                    {threadMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${msg.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <p>{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${msg.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-border">
                    <div className="flex gap-2 mb-2">
                      {["Hi, your appointment is tomorrow!", "Thank you for choosing SmileCare!", "Please call us to discuss your treatment."].map((t) => (
                        <button key={t} onClick={() => setNewMessage(t)} className="text-xs px-2 py-1 bg-muted rounded-full hover:bg-muted/80 truncate max-w-[160px]">{t}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="flex-1" />
                      <Button size="icon" onClick={sendMessage}><Send className="size-4" /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ── Campaigns ── */}
        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">Campaign</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Channel</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Recipients</th>
                  <th className="text-right px-4 py-3">Open Rate</th>
                  <th className="text-right px-4 py-3">Revenue</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-2 py-0.5">{c.type}</span></td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1 text-xs">{CHANNEL_ICON[c.channel]}{c.channel}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-right">{c.recipients}</td>
                      <td className="px-4 py-3 text-right font-medium">{c.openRate}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{c.revenue > 0 ? `$${c.revenue.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="xs" variant="outline" onClick={() => setViewCampaign(c)}>
                          <Eye className="size-3" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Templates ── */}
        <TabsContent value="templates" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Email Templates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Mail className="size-4 text-primary" /><h3 className="font-semibold">Email Templates</h3></div>
              {EMAIL_TEMPLATES.map((t) => (
                <Card key={t.id} className="hover:ring-1 hover:ring-primary/30 cursor-pointer transition-all">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Subject: {t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.body.slice(0, 80)}…</p>
                    <Button size="xs" variant="outline" className="mt-2" onClick={() => toast.info(`Template "${t.name}" copied`)}><FileText className="size-3" /> Use Template</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* SMS Templates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><MessageSquare className="size-4 text-green-600" /><h3 className="font-semibold">SMS Templates</h3></div>
              {SMS_TEMPLATES.map((t) => (
                <Card key={t.id} className="hover:ring-1 hover:ring-primary/30 cursor-pointer transition-all">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-sm font-medium">{t.name}</p>
                    <div className="mt-1 bg-muted rounded-lg p-2 text-xs text-muted-foreground line-clamp-3">{t.message}</div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-muted-foreground">{t.message.length} chars</p>
                      <Button size="xs" variant="outline" onClick={() => toast.info(`Template "${t.name}" copied`)}><FileText className="size-3" /> Use</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Voice Scripts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Mic className="size-4 text-purple-600" /><h3 className="font-semibold">Voice Scripts</h3></div>
              {VOICE_SCRIPTS.map((t) => (
                <Card key={t.id} className="hover:ring-1 hover:ring-primary/30 cursor-pointer transition-all">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{t.name}</p>
                      <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full px-1.5 py-0.5">{t.duration}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic line-clamp-3">&ldquo;{t.script}&rdquo;</p>
                    <Button size="xs" variant="outline" className="mt-2" onClick={() => toast.info(`Script "${t.name}" copied`)}><Mic className="size-3" /> Use Script</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Review Requests ── */}
        <TabsContent value="reviews" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-yellow-500">{avgRating.toFixed(1)} ⭐</p>
              <p className="text-xs text-muted-foreground mt-1">Average Rating</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-green-600">{reviews.filter((r) => r.reviewed).length}</p>
              <p className="text-xs text-muted-foreground mt-1">Reviews Received</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{Math.round((reviews.filter((r) => r.clicked).length / reviews.length) * 100)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Click Rate</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Review Requests</CardTitle>
                {canEdit && <Button size="sm" onClick={() => setReviewRequestOpen(true)}><Send className="size-3.5" /> Send Review Request</Button>}
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">Patient</th>
                  <th className="text-left px-4 py-3">Platform</th>
                  <th className="text-left px-4 py-3">Sent</th>
                  <th className="text-center px-4 py-3">Clicked</th>
                  <th className="text-center px-4 py-3">Reviewed</th>
                  <th className="text-center px-4 py-3">Rating</th>
                </tr></thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{r.patient}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-muted rounded-full px-2 py-0.5">{r.platform}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{timeAgo(r.sent)}</td>
                      <td className="px-4 py-3 text-center">{r.clicked ? <CheckCircle className="size-4 text-green-500 mx-auto" /> : <Clock className="size-4 text-muted-foreground mx-auto" />}</td>
                      <td className="px-4 py-3 text-center">{r.reviewed ? <CheckCircle className="size-4 text-green-500 mx-auto" /> : "—"}</td>
                      <td className="px-4 py-3 text-center">{r.rating ? <span className="text-yellow-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {newCampaignOpen && <NewCampaignDialog onClose={() => setNewCampaignOpen(false)} onSave={(c) => setCampaigns((p) => [c, ...p])} />}
      {viewCampaign && <CampaignSheet campaign={viewCampaign} onClose={() => setViewCampaign(null)} />}
      {reviewRequestOpen && <ReviewRequestDialog onClose={() => setReviewRequestOpen(false)} onSend={(r) => setReviews((p) => [r, ...p])} />}
    </div>
  );
}
