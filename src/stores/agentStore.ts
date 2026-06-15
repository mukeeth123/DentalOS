import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIAgent, AgentActivity } from "@/types";
import agentsData from "@/mock/ai-agents.json";

const LIVE_ACTIVITIES = [
  { agentId: "agent-receptionist", agentName: "AI Receptionist", action: "Booking appointment for Sarah Johnson - Friday 10AM", outcome: "Appointment scheduled" },
  { agentId: "agent-claims", agentName: "AI Claims", action: "Submitting claim CLM-0089 to Cigna - $1,240", outcome: "Claim submitted" },
  { agentId: "agent-recall", agentName: "AI Recall", action: "Sending recall SMS to 14 overdue patients", outcome: "14 messages sent" },
  { agentId: "agent-insurance", agentName: "AI Insurance", action: "Verifying Delta Dental eligibility for PAT-0056", outcome: "Coverage confirmed" },
  { agentId: "agent-billing", agentName: "AI Billing", action: "Sending 90-day statement to 8 overdue accounts", outcome: "Statements sent" },
  { agentId: "agent-scribe", agentName: "AI Scribe", action: "Generating SOAP note for Dr. Martinez - Patient PAT-0023", outcome: "Note saved to chart" },
  { agentId: "agent-receptionist", agentName: "AI Receptionist", action: "Answered inquiry about insurance coverage - Maria Garcia", outcome: "Question resolved" },
  { agentId: "agent-claims", agentName: "AI Claims", action: "Appealing denied claim CLM-0043 - Delta Dental", outcome: "Appeal filed" },
  { agentId: "agent-recall", agentName: "AI Recall", action: "Launching birthday campaign for 3 patients", outcome: "Campaign sent" },
  { agentId: "agent-revenue", agentName: "AI Revenue", action: "Identified $4,800 in unscheduled treatment for active patients", outcome: "Report generated" },
];

let activityCounter = 1000;

interface AgentStore {
  agents: AIAgent[];
  activities: AgentActivity[];
  addActivity: (activity: AgentActivity) => void;
  toggleAgent: (id: string) => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      agents: agentsData as AIAgent[],
      activities: LIVE_ACTIVITIES.slice(0, 5).map((a, i) => ({
        ...a,
        id: "act-" + (1000 + i),
        timestamp: new Date(Date.now() - (5 - i) * 120000).toISOString(),
      })),
      addActivity: (activity) =>
        set((s) => ({ activities: [activity, ...s.activities].slice(0, 50) })),
      toggleAgent: (id) =>
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a
          ),
        })),
    }),
    { name: "dental-agents" }
  )
);

export function getNextActivity(): AgentActivity {
  const template = LIVE_ACTIVITIES[activityCounter % LIVE_ACTIVITIES.length];
  activityCounter++;
  return { ...template, id: "act-" + activityCounter, timestamp: new Date().toISOString() };
}
