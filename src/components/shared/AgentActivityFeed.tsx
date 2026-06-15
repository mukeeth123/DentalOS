"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore, getNextActivity } from "@/stores/agentStore";
import { timeAgo } from "@/lib/utils";

const AGENT_COLORS: Record<string, string> = {
  "agent-receptionist": "bg-blue-100 text-blue-700",
  "agent-claims": "bg-purple-100 text-purple-700",
  "agent-recall": "bg-green-100 text-green-700",
  "agent-insurance": "bg-cyan-100 text-cyan-700",
  "agent-billing": "bg-yellow-100 text-yellow-700",
  "agent-scribe": "bg-pink-100 text-pink-700",
  "agent-revenue": "bg-orange-100 text-orange-700",
  "agent-copilot": "bg-indigo-100 text-indigo-700",
};

export function AgentActivityFeed() {
  const { activities, addActivity } = useAgentStore();

  useEffect(() => {
    const interval = setInterval(() => {
      addActivity(getNextActivity());
    }, 8000);
    return () => clearInterval(interval);
  }, [addActivity]);

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
      <AnimatePresence initial={false}>
        {activities.slice(0, 20).map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 rounded-lg bg-muted/40 border border-border/50 p-2.5 text-sm"
          >
            <div
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${AGENT_COLORS[activity.agentId] ?? "bg-gray-100 text-gray-700"}`}
            >
              {activity.agentName}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground leading-snug">{activity.action}</p>
              {activity.outcome && (
                <p className="text-xs text-muted-foreground mt-0.5">✓ {activity.outcome}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
