"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Plus, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  date: string;
  preview: string;
}

const PRIOR_CONVOS: Conversation[] = [
  { id: "c1", title: "Revenue Analysis — May 2025", date: "Jun 12", preview: "Revenue came in at $131k, up from..." },
  { id: "c2", title: "Delta Dental Denials Spike", date: "Jun 10", preview: "We saw a 28% increase in denials..." },
  { id: "c3", title: "Q2 Performance Review", date: "Jun 5", preview: "Overall production exceeded targets..." },
  { id: "c4", title: "AI Workforce ROI Check", date: "May 28", preview: "The AI workforce saved approximately..." },
];

const SUGGESTED_QUESTIONS = [
  "Why did revenue drop this month?",
  "Which claims are at risk of denial?",
  "Which patients are overdue for recall?",
  "Where are our revenue opportunities?",
  "How is the AI workforce performing?",
];

const AI_RESPONSES: Record<string, string> = {
  "Why did revenue drop this month?": `Revenue for June came in at **$127,400**, down **10.0%** from May's $141,600. The primary driver is a 23% increase in claim denials from Delta Dental — 14 claims worth $18,400 were denied. Secondary: 3 implant procedures cancelled due to no-shows, representing $7,200 in lost production.

**Key Numbers:**
• Claims denied: 14 (-$18,400)
• No-shows this month: 8 (-$7,200)
• New patients: 29 vs 33 last month (-$3,600)

**Recommended Actions:**
1. Appeal the 14 Delta Dental denials immediately — AI Claims can handle this automatically
2. Activate the No-Show Recovery workflow to recapture cancelled slots
3. Run a targeted recall campaign for the 67 patients overdue for cleaning`,

  "Which claims are at risk of denial?": `Based on AI analysis of your current claim pipeline, **12 claims** are at elevated denial risk totaling **$24,800**:

**High Risk (Score < 60):**
| Claim | Patient | Insurer | Amount | Risk Factor |
|-------|---------|---------|--------|-------------|
| CLM-0034 | Maria Garcia | Delta Dental | $1,240 | Missing pre-auth |
| CLM-0067 | Tom Wilson | Aetna | $2,800 | Procedure not covered |
| CLM-0089 | Lisa Chen | Cigna | $1,640 | Duplicate code flagged |

**Medium Risk (Score 60-75):**
9 additional claims flagged for missing X-rays or incomplete documentation.

**Recommended Actions:**
1. Let AI Claims auto-correct documentation on 8 of the 12 claims
2. Manually review CLM-0067 — benefit exclusion may require patient notification
3. Resubmit corrected claims within 48 hours to meet timely filing limits`,

  "Which patients are overdue for recall?": `You have **67 patients** who are 12+ months overdue for their cleaning and exam. Combined estimated value if booked: **$28,900**.

**Breakdown by overdue period:**
• 12–18 months overdue: 34 patients
• 18–24 months overdue: 21 patients
• 24+ months overdue: 12 patients (reactivation priority)

**Top 5 High-Value Patients to Contact:**
| Patient | Last Visit | LTV | Insurance |
|---------|------------|-----|-----------|
| James Rodriguez | Jan 2024 | $8,400 | Delta Dental |
| Emma Thompson | Dec 2023 | $6,200 | Aetna |
| David Kim | Nov 2023 | $5,800 | United |

**Recommended Actions:**
1. Activate AI Recall for all 67 patients — SMS + email sequence
2. Prioritize the 12 patients 24+ months overdue for AI voice call
3. Estimated bookings from this campaign: 18–22 patients (~$7,600)`,

  "Where are our revenue opportunities?": `Based on current data analysis, I've identified **$89,400 in untapped revenue opportunities**:

**1. Unscheduled Treatment Plans — $42,600**
24 patients have accepted treatment plans (crowns, root canals, implants) that haven't been scheduled. Average delay: 47 days.

**2. Recall Overdue — $28,900**
67 patients overdue for cleaning + exam. If we recover even 40%, that's ~$11,600.

**3. Secondary Insurance Not Filed — $9,800**
11 patients have secondary insurance that wasn't billed on recent claims. AI Claims can file these tonight.

**4. Treatment Upsell — $8,100**
14 patients came in for cleanings but have outstanding cavity diagnoses. A targeted follow-up call could convert ~$580 per patient.

**Top Immediate Action:**
→ Run the AI Revenue scan tonight — it will auto-contact unscheduled treatment patients and file missing secondary claims.`,

  "How is the AI workforce performing?": `Your AI Workforce completed **297 tasks today** and generated **$49,420 in attributed revenue**.

**Agent Performance Snapshot:**

| Agent | Tasks | Success Rate | Revenue |
|-------|-------|-------------|---------|
| AI Receptionist | 47 | 94% | $3,420 |
| AI Claims | 18 | 91% | $24,800 |
| AI Recall | 124 | 76% | $8,900 |
| AI Billing | 34 | 82% | $12,300 |
| AI Insurance | 31 | 89% | — |
| AI Scribe | 23 | 97% | — |

**30-Day Highlights:**
• AI Claims recovered $64,200 in denied claims through appeals
• AI Recall reactivated 34 dormant patients ($14,600 production)
• AI Receptionist handled 1,247 calls with 94% resolution rate

**Recommendation:** AI Revenue agent has been idle today. Consider activating it to scan for unscheduled treatment opportunities — estimated $4,800 in potential bookings.`,
};

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^• (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul class=\"list-disc pl-4 my-2 space-y-0.5\">$1</ul>")
    .replace(/^\*\*(\d+\..+)\*\*$/gm, "<p class=\"font-semibold mt-3\">$1</p>")
    .replace(/\n\n/g, "</p><p class=\"mt-2\">")
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter((c) => c.trim());
      return "<tr>" + cells.map((c) => `<td class="border border-border px-2 py-1 text-xs">${c.trim()}</td>`).join("") + "</tr>";
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, "<div class=\"overflow-x-auto my-3\"><table class=\"w-full border-collapse border border-border rounded-lg overflow-hidden\"><tbody>$1</tbody></table></div>");
}

export default function CEOCopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your CEO Copilot. I have full visibility into your practice data — revenue, claims, patients, AI agents, and more. Ask me anything about your practice performance or tap a suggested question below.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeConvo, setActiveConvo] = useState("new");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamResponse = useCallback((responseText: string) => {
    const words = responseText.split(" ");
    let wordIdx = 0;
    let current = "";

    const msgId = `msg-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: msgId, role: "assistant", content: "", timestamp: new Date(),
    }]);

    const interval = setInterval(() => {
      if (wordIdx >= words.length) {
        clearInterval(interval);
        setIsTyping(false);
        return;
      }
      current += (wordIdx > 0 ? " " : "") + words[wordIdx];
      wordIdx++;
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: current } : m));
    }, 50);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = AI_RESPONSES[text] ?? `I've analyzed your practice data for that question. Based on current metrics across all clinics, the data shows positive trends in most areas. Your revenue MTD is $141,600 (+8.2%), with 142 approved claims and 297 AI tasks completed today. For more specific analysis on "${text}", I'd recommend checking the Analytics dashboard or asking me a more specific follow-up question.`;
      streamResponse(response);
    }, 800);
  }, [isTyping, streamResponse]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <Button className="w-full" onClick={() => { setActiveConvo("new"); setMessages([{ id: "welcome", role: "assistant", content: "Hello! I'm your CEO Copilot. Ask me anything about your practice.", timestamp: new Date() }]); }}>
          <Plus className="size-4" /> New Conversation
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {PRIOR_CONVOS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConvo(c.id)}
              className={`w-full text-left rounded-lg p-2.5 text-sm transition-colors ${activeConvo === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
            >
              <p className="font-medium truncate">{c.title}</p>
              <div className="flex justify-between mt-0.5">
                <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                <span className="text-xs text-muted-foreground shrink-0 ml-1">{c.date}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-card rounded-xl ring-1 ring-foreground/10 overflow-hidden">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Brain className="size-5 text-primary" />
          <span className="font-semibold">CEO Copilot</span>
          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-0.5 ml-auto">
            Live data connected
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="size-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm mr-2 shrink-0 mt-0.5">🧠</div>
              )}
              <div
                className={`max-w-2xl rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">🧠</div>
              <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Questions */}
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs rounded-full border border-primary/30 text-primary hover:bg-primary/10 px-3 py-1 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask anything about your practice..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button onClick={() => sendMessage(input)} disabled={isTyping || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
