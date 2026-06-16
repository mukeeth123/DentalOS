# -*- coding: utf-8 -*-
"""Builds a professionally designed PDF of the DentalOS AI Application Flow doc."""

import re
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, NextPageTemplate, PageBreak,
    Paragraph, Spacer, Table, TableStyle, Preformatted, KeepTogether,
    Image, FrameBreak, ListFlowable, ListItem
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfgen import canvas as canvas_mod

SRC_MD = r"C:\Users\mukee\DentalOs\dentalos-ai\DENTALOS_AI_APPLICATION_FLOW.md"
OUT_PDF = r"C:\Users\mukee\DentalOs\dentalos-ai\DentalOS_AI_Application_Flow.pdf"

# ---------------------------------------------------------------- palette
NAVY = colors.HexColor("#0B2545")
TEAL = colors.HexColor("#0F8B8D")
TEAL_DARK = colors.HexColor("#0A6366")
LIGHT_TEAL = colors.HexColor("#E6F4F4")
SLATE = colors.HexColor("#475467")
LIGHT_GREY = colors.HexColor("#F4F6F8")
MID_GREY = colors.HexColor("#D8DEE4")
ACCENT = colors.HexColor("#2EC4B6")
WHITE = colors.white

PAGE_W, PAGE_H = LETTER
MARGIN = 0.85 * inch

# ---------------------------------------------------------------- styles
ss = getSampleStyleSheet()

styles = {
    "CoverTitle": ParagraphStyle("CoverTitle", fontName="Helvetica-Bold", fontSize=34,
                                  leading=40, textColor=WHITE, alignment=TA_LEFT, spaceAfter=10),
    "CoverSubtitle": ParagraphStyle("CoverSubtitle", fontName="Helvetica", fontSize=15,
                                     leading=20, textColor=colors.HexColor("#CFE9E9"), alignment=TA_LEFT),
    "CoverMeta": ParagraphStyle("CoverMeta", fontName="Helvetica", fontSize=10.5,
                                 leading=15, textColor=colors.HexColor("#9FC9C9"), alignment=TA_LEFT),
    "H1": ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=20, leading=24,
                          textColor=NAVY, spaceBefore=4, spaceAfter=12,
                          borderColor=TEAL, borderWidth=0, keepWithNext=True),
    "H2": ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=14, leading=18,
                          textColor=TEAL_DARK, spaceBefore=16, spaceAfter=8, keepWithNext=True),
    "Body": ParagraphStyle("Body", fontName="Helvetica", fontSize=9.6, leading=14.5,
                            textColor=colors.HexColor("#1F2937"), spaceAfter=8, alignment=TA_LEFT),
    "BodyBold": ParagraphStyle("BodyBold", fontName="Helvetica-Bold", fontSize=9.6, leading=14.5,
                                textColor=NAVY, spaceAfter=6),
    "Quote": ParagraphStyle("Quote", fontName="Helvetica-Oblique", fontSize=9.6, leading=14,
                             textColor=SLATE, leftIndent=10, spaceAfter=10,
                             borderColor=TEAL, borderWidth=0),
    "Bullet": ParagraphStyle("Bullet", fontName="Helvetica", fontSize=9.6, leading=14,
                              textColor=colors.HexColor("#1F2937"), leftIndent=14, spaceAfter=4,
                              bulletIndent=2),
    "TOCHeading": ParagraphStyle("TOCHeading", fontName="Helvetica-Bold", fontSize=22,
                                  textColor=NAVY, spaceAfter=18),
    "TOC1": ParagraphStyle("TOC1", fontName="Helvetica-Bold", fontSize=11.5, leftIndent=0,
                            firstLineIndent=0, spaceAfter=8, textColor=NAVY, leading=15),
    "Code": ParagraphStyle("Code", fontName="Courier", fontSize=7.6, leading=10.2,
                            textColor=colors.HexColor("#0B2545")),
    "TableCellHead": ParagraphStyle("TableCellHead", fontName="Helvetica-Bold", fontSize=8.4,
                                     leading=11, textColor=WHITE),
    "TableCell": ParagraphStyle("TableCell", fontName="Helvetica", fontSize=8.2,
                                 leading=11, textColor=colors.HexColor("#1F2937")),
    "TableCellBold": ParagraphStyle("TableCellBold", fontName="Helvetica-Bold", fontSize=8.2,
                                     leading=11, textColor=NAVY),
}

# ---------------------------------------------------------------- helpers

def P(text, style="Body"):
    return Paragraph(text, styles[style])


def cell(text, bold=False, head=False):
    s = "TableCellHead" if head else ("TableCellBold" if bold else "TableCell")
    return Paragraph(text, styles[s])


def styled_table(header_row, data_rows, col_widths, head_bg=TEAL, zebra=LIGHT_TEAL):
    table_data = [[cell(h, head=True) for h in header_row]]
    for row in data_rows:
        table_data.append([cell(str(c)) for c in row])
    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), head_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, MID_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, 0), 1.2, head_bg),
    ]
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0, i), (-1, i), zebra))
    t.setStyle(TableStyle(cmds))
    return t


def section_divider():
    t = Table([[""]], colWidths=[PAGE_W - 2 * MARGIN], rowHeights=[2])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), TEAL)]))
    return t


def code_block(text):
    tbl = Table([[Preformatted(text, styles["Code"])]],
                colWidths=[PAGE_W - 2 * MARGIN - 16])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0B2545")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#9FF0EC")),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return tbl

# ---------------------------------------------------------------- doc & page templates

class NumberedCanvas(canvas_mod.Canvas):
    pass


def header_footer(canvas, doc):
    canvas.saveState()
    page_num = canvas.getPageNumber()
    if page_num == 1:
        canvas.restoreState()
        return
    # header bar
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 0.5 * inch, PAGE_W, 0.5 * inch, stroke=0, fill=1)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(MARGIN, PAGE_H - 0.33 * inch, "DentalOS AI — Complete Application Flow Documentation")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#9FC9C9"))
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.33 * inch, "Confidential — Internal & Stakeholder Use")
    # footer
    canvas.setStrokeColor(MID_GREY)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, 0.55 * inch, PAGE_W - MARGIN, 0.55 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SLATE)
    canvas.drawString(MARGIN, 0.38 * inch, "DentalOS AI Platform")
    canvas.drawCentredString(PAGE_W / 2, 0.38 * inch, "Master Product Documentation")
    canvas.drawRightString(PAGE_W - MARGIN, 0.38 * inch, f"Page {page_num - 1}")
    canvas.restoreState()


def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # teal accent band
    canvas.setFillColor(TEAL_DARK)
    canvas.rect(0, PAGE_H * 0.42, PAGE_W, PAGE_H * 0.04, stroke=0, fill=1)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, PAGE_H * 0.46, PAGE_W, 0.04 * inch, stroke=0, fill=1)
    # decorative circles
    canvas.setFillColor(colors.Color(0.16, 0.55, 0.55, alpha=0.35))
    canvas.circle(PAGE_W - 1.0 * inch, PAGE_H - 1.2 * inch, 1.6 * inch, stroke=0, fill=1)
    canvas.setFillColor(colors.Color(0.16, 0.55, 0.55, alpha=0.2))
    canvas.circle(0.6 * inch, 1.4 * inch, 1.3 * inch, stroke=0, fill=1)

    # tooth glyph mark (simple abstract icon, top-left)
    canvas.setFillColor(ACCENT)
    canvas.circle(MARGIN + 14, PAGE_H - 1.15 * inch, 14, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawCentredString(MARGIN + 14, PAGE_H - 1.20 * inch, "D")

    canvas.setFillColor(colors.HexColor("#CFE9E9"))
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(MARGIN + 36, PAGE_H - 1.20 * inch, "DENTALOS AI")

    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 34)
    canvas.drawString(MARGIN, PAGE_H * 0.60, "DentalOS AI")
    canvas.setFont("Helvetica-Bold", 22)
    canvas.setFillColor(ACCENT)
    canvas.drawString(MARGIN, PAGE_H * 0.60 - 0.42 * inch, "Complete Application Flow")
    canvas.drawString(MARGIN, PAGE_H * 0.60 - 0.74 * inch, "Documentation")

    canvas.setFont("Helvetica", 12.5)
    canvas.setFillColor(colors.HexColor("#CFE9E9"))
    canvas.drawString(MARGIN, PAGE_H * 0.60 - 1.15 * inch,
                       "Master product documentation for the DentalOS AI platform —")
    canvas.drawString(MARGIN, PAGE_H * 0.60 - 1.38 * inch,
                       "modules, RBAC, AI Workforce, integrations, workflows & analytics.")

    # meta block
    y = 1.55 * inch
    canvas.setFont("Helvetica-Bold", 9.5)
    canvas.setFillColor(ACCENT)
    canvas.drawString(MARGIN, y, "PREPARED FOR")
    canvas.setFont("Helvetica", 10.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(MARGIN, y - 0.2 * inch, "Executive Stakeholders & Product Team")

    canvas.setFont("Helvetica-Bold", 9.5)
    canvas.setFillColor(ACCENT)
    canvas.drawString(MARGIN, y - 0.55 * inch, "DOCUMENT VERSION")
    canvas.setFont("Helvetica", 10.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(MARGIN, y - 0.75 * inch, "v1.0 — Demo Build Reference")

    canvas.setFont("Helvetica-Bold", 9.5)
    canvas.setFillColor(ACCENT)
    canvas.drawString(PAGE_W / 2 + 0.3*inch, y, "STACK")
    canvas.setFont("Helvetica", 10.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(PAGE_W / 2 + 0.3*inch, y - 0.2 * inch, "Next.js 16 · React 19 · Zustand · Tailwind")

    canvas.setFont("Helvetica-Bold", 9.5)
    canvas.setFillColor(ACCENT)
    canvas.drawString(PAGE_W / 2 + 0.3*inch, y - 0.55 * inch, "SECTIONS")
    canvas.setFont("Helvetica", 10.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(PAGE_W / 2 + 0.3*inch, y - 0.75 * inch, "15 — Overview through End-to-End User Stories")

    canvas.restoreState()


# ---------------------------------------------------------------- TOC entries
toc_entries = []

def heading(text, level, story, key):
    style = "H1" if level == 1 else "H2"
    bm = f"bm_{key}"
    p = Paragraph(text, styles[style])
    p._bookmarkName = bm
    story.append(p)
    toc_entries.append((level, text, bm))


def add_outline(canvas, doc):
    pass

# ================================================================== BUILD STORY
story = []

# ---- Section 1
heading("1. Platform Overview", 1, story, "s1")
story.append(P("<b>What is DentalOS AI</b> — DentalOS AI is a dental practice operating system that combines a "
               "traditional practice-management UI (patients, appointments, clinical, claims, billing) with a "
               "simulated layer of autonomous “AI agents” that perform front-desk, clinical documentation, "
               "insurance, billing, and recall work. The demo is fully client-side: data lives in seeded JSON mock "
               "files and Zustand stores persisted to <i>localStorage</i>; AI responses (CEO Copilot, call transcripts, "
               "SOAP notes) are pre-scripted rather than generated by a live LLM."))
story.append(P("<b>Core vision</b> — A single-pane-of-glass dental practice platform where an “AI Workforce” "
               "of 8 named agents handles repetitive operational work under human oversight, while a CEO Copilot "
               "gives practice owners conversational access to business insights, and a Workflow Engine lets staff "
               "automate event-driven processes without code."))
story.append(P("<b>Primary modules</b> — Dashboard, Patients, Appointments, Clinical, Imaging, Insurance, Claims, "
               "Billing, Communications, AI Workforce, Workflows, Analytics, CEO Copilot, Integrations, "
               "Staff &amp; RBAC, Settings."))
story.append(P("<b>Target users</b> — Multi-clinic dental service organizations (DSOs) and independent practices, "
               "modeled through seven personas: Super Admin, DSO Admin, Clinic Owner, Dentist, Front Desk, "
               "Insurance Coordinator, and Billing Manager."))

# ---- Section 2
heading("2. Navigation Structure", 1, story, "s2")
story.append(P("<b>Top-level sidebar</b> (in display order):"))
nav_items = ["Dashboard", "Patients", "Appointments", "Clinical", "Imaging", "Insurance", "Claims", "Billing",
             "Communications", "AI Workforce", "Workflows", "Analytics", "CEO Copilot", "Integrations",
             "Staff & Audit Logs", "Settings"]
story.append(ListFlowable([ListItem(P(x, "Bullet")) for x in nav_items], bulletType="bullet",
                           start="circle", bulletColor=TEAL))
story.append(P("The sidebar reads <font face=\"Courier\">authStore.user.permissions</font> and hides any module "
               "where the user's level is “None.” It collapses to an icon rail on small screens and "
               "highlights the active route."))

story.append(P("<b>Full route table</b>", "BodyBold"))
route_header = ["Route", "Dynamic Segment", "Purpose"]
route_rows = [
    ["/login", "–", "Email/password authentication"],
    ["/login/mfa", "–", "6-digit MFA verification + access-preview matrix"],
    ["/dashboard", "–", "Daily operational command center / KPIs"],
    ["/patients", "–", "Patient list / CRM"],
    ["/patients/[id]", "PAT-xxxx", "Patient detail: demographics, insurance, history, ledger, journey"],
    ["/appointments", "–", "Calendar/list scheduling"],
    ["/clinical", "–", "SOAP notes, charting"],
    ["/imaging", "–", "X-ray/CBCT/photo review with AI caries-detection overlay"],
    ["/insurance", "–", "Eligibility verification, pre-auth tracking"],
    ["/claims", "–", "Claims list/lifecycle"],
    ["/claims/[id]", "CLM-xxxx", "Claim detail: CDT codes, AI score/flags, status history"],
    ["/billing", "–", "Invoices, AR, payment collection"],
    ["/communications", "–", "Inbox, campaigns, templates, review requests"],
    ["/ai-workforce", "–", "Agent grid + live activity feed"],
    ["/ai-workforce/[agent]", "agent-receptionist, etc.", "Agent detail: calls, task log, config, 90-day chart"],
    ["/workflows", "–", "Automation workflow list + create dialog"],
    ["/analytics", "–", "Production/collections reporting"],
    ["/ceo-copilot", "–", "Executive AI chat"],
    ["/integrations", "–", "Integration hub grid"],
    ["/integrations/[id]", "open-dental, stripe, etc.", "Integration detail: health, sync, mapping, errors"],
    ["/staff", "–", "User management, role matrix, audit logs"],
    ["/settings", "–", "Clinic config, API keys, preferences"],
]
story.append(styled_table(route_header, route_rows, [1.5*inch, 1.5*inch, 3.55*inch]))
story.append(Spacer(1, 8))
story.append(P("<b>Navigation flow</b> — Login → (MFA if required) → Dashboard → any module via "
               "sidebar → detail drill-down (patient/claim/agent/integration) → back to list. Global "
               "Search (Cmd+K) and the notification bell provide cross-cutting jump points from anywhere in the app."))

# ---- Section 3 RBAC
heading("3. Role-Based Access Control (RBAC)", 1, story, "s3")
story.append(P("Permissions are evaluated per module at three levels — <b>Full</b> (view+edit), <b>Read</b> "
               "(view only), <b>None</b> (hidden from sidebar, gated by PermissionGuard). Super Admin, DSO Admin, "
               "and Clinic Owner are hard-coded to Full everywhere."))
rbac_header = ["Role", "Patients", "Appts", "Clinical", "Claims", "Billing", "Analytics", "Settings", "AI Agents"]
rbac_rows = [
    ["Super Admin", "Full", "Full", "Full", "Full", "Full", "Full", "Full", "Full"],
    ["DSO Admin", "Full", "Full", "Full", "Full", "Full", "Full", "Full", "Full"],
    ["Clinic Owner", "Full", "Full", "Full", "Full", "Full", "Full", "Full", "Full"],
    ["Dentist", "Full", "Full", "Full", "Read", "Read", "Read", "None", "None"],
    ["Front Desk", "Read", "Full", "None", "Read", "None", "None", "None", "None"],
    ["Insurance Coord.", "Read", "Read", "None", "Full", "Read", "Read", "None", "None"],
    ["Billing Manager", "Read", "None", "None", "Full", "Full", "Full", "None", "None"],
]
story.append(styled_table(rbac_header, rbac_rows,
                           [1.05*inch]+[0.71*inch]*8, head_bg=NAVY, zebra=LIGHT_GREY))
story.append(Spacer(1, 8))
story.append(P("<b>MFA enforcement</b> — Super Admin, DSO Admin, Clinic Owner and Dentist require a 6-digit MFA "
               "code at login (fixed demo code per user); Front Desk, Insurance Coordinator and Billing Manager "
               "bypass MFA in this configuration."))
story.append(P("<b>Enforcement mechanism</b> — <font face=\"Courier\">usePermission(module)</font> resolves the "
               "level for the current route; <font face=\"Courier\">useCanEdit(module)</font> is true only when "
               "Full, gating action buttons; <font face=\"Courier\">PermissionGuard</font> renders a full "
               "“Access Restricted” screen for None or a read-only banner for Read."))
story.append(P("<b>Per-role journeys</b>", "BodyBold"))
role_journeys = [
    "<b>Super Admin / DSO Admin</b> — cross-org oversight across every clinic via org switching; full Staff/Audit Logs access.",
    "<b>Clinic Owner</b> — single-clinic full control; primary user of CEO Copilot and Analytics.",
    "<b>Dentist</b> — Patients → Appointments → Clinical (SOAP), read-only on Claims/Billing/Analytics.",
    "<b>Front Desk</b> — scheduling/check-in focused; read-only Patients; no Clinical, Billing, Settings, AI Agents.",
    "<b>Insurance Coordinator</b> — owns Claims end-to-end; read context on Patients/Appointments/Billing/Analytics.",
    "<b>Billing Manager</b> — owns Claims and Billing; Analytics Full for revenue reporting; no Appointments/Clinical.",
]
story.append(ListFlowable([ListItem(P(x, "Bullet")) for x in role_journeys], bulletType="bullet", bulletColor=TEAL))

# ---- Section 4 Modules
heading("4. Module-by-Module Breakdown", 1, story, "s4")

modules = [
    ("Dashboard (/dashboard)",
     ["<b>Purpose:</b> Daily operational command center.",
      "<b>KPI Cards:</b> Total Revenue (MoM trend), Active Patients, Claims Pending, AI Automation Rate.",
      "<b>Charts:</b> Revenue over 7D/30D/12M (Recharts).",
      "<b>AI involvement:</b> Automation Rate KPI computed from agent task data.",
      "<b>Connected workflows:</b> Links into Patients, Claims, AI Workforce."]),
    ("Patients (/patients, /patients/[id])",
     ["<b>Purpose:</b> Clinical/demographic CRM and ledger.",
      "<b>Features:</b> Searchable list with quick actions; detail view with demographics, primary/secondary "
      "insurance (PPO/HMO, deductible, annual max, coverage %), medical history, allergies, medications, dental "
      "history, treatment plans, claims, invoices, communications log, documents, and a Journey timeline.",
      "<b>Actions:</b> Add New Patient, edit record, view ledger.",
      "<b>AI involvement:</b> Journey steps can be attributed to an AI agent.",
      "<b>Data displayed:</b> Risk score, lifetime value, outstanding balance, recall-due date, next appointment."]),
    ("Appointments (/appointments)",
     ["<b>Purpose:</b> Daily/weekly scheduling and check-in.",
      "<b>Features:</b> FullCalendar day/week view; simulated incoming-call ringtone via Web Audio API; New "
      "Appointment action.",
      "<b>Data displayed:</b> Chair, dentist, type, status, insurance-verified flag, pre-auth-required flag, "
      "estimated revenue."]),
    ("Clinical (/clinical)",
     ["<b>Purpose:</b> Charting visits and SOAP documentation.",
      "<b>KPI Cards:</b> Daily Patients, Notes Completed, AI Time Saved, Missing Notes.",
      "<b>Features:</b> New Note dialog (patient, 12 visit types, tooth number); AI SOAP Generator drafts "
      "Subjective/Objective/Assessment/Plan; session-local notes list.",
      "<b>AI involvement:</b> AI Scribe drafts SOAP content."]),
    ("Imaging (/imaging)",
     ["<b>Purpose:</b> X-ray/CBCT/intraoral photo review.",
      "<b>Features:</b> Image grid with mock AI caries-detection overlay.",
      "<b>AI involvement:</b> AI Radiology (simulated detection markers)."]),
    ("Insurance (/insurance)",
     ["<b>Purpose:</b> Eligibility verification and pre-authorization tracking.",
      "<b>KPI Cards:</b> Clean Claim Rate, Avg Days to Pay, Total Denied.",
      "<b>Features:</b> Verification status badges, coverage breakdown (preventive/basic/major/ortho %).",
      "<b>AI involvement:</b> AI Insurance performs verification/pre-auth, logged to its task log."]),
    ("Claims (/claims, /claims/[id])",
     ["<b>Purpose:</b> Insurance claim lifecycle management.",
      "<b>Data model:</b> CDT codes, totals billed/allowed/paid, patient responsibility, status (Draft→"
      "Submitted→Pending→Approved/Denied/Appealed→Paid), denial reason, aiScore (0–100), "
      "aiFlags, attachments.",
      "<b>AI involvement:</b> AI Claims prepares, submits, and appeals claims; risk scoring flags likely denials."]),
    ("Billing (/billing)",
     ["<b>Purpose:</b> Patient statements and accounts receivable.",
      "<b>KPI Cards:</b> Total Collections, AR &gt; 90 Days, Patient Balances.",
      "<b>Features:</b> Payment collection dialog, invoice generation, payment history (Cash/Check/Credit "
      "Card/ACH/CareCredit).",
      "<b>AI involvement:</b> AI Billing manages AR follow-ups and statement delivery."]),
    ("Communications (/communications)",
     ["<b>Purpose:</b> Patient outreach across SMS, Email, Voice.",
      "<b>KPI Cards:</b> Total Messages, Active Campaigns, Avg Review Rating, Total Recipients.",
      "<b>Features:</b> Two-way Inbox; New Campaign wizard (Recall, Reactivation, Birthday, Review); Send Review "
      "Request dialog (Google/Yelp); reusable templates.",
      "<b>AI involvement:</b> AI Recall drives recall/reactivation campaigns; messages can be flagged agentGenerated."]),
    ("AI Workforce (/ai-workforce, /ai-workforce/[agent])",
     ["<b>Purpose:</b> Monitor and configure the 8 autonomous agents.",
      "<b>List page:</b> 4-column agent grid (avatar, status pulse, tasks/success%/revenue, sparkline, current "
      "activity), live activity feed refreshing every 6s, Configure sheet (confidence threshold, auto-approve, "
      "notifications, working hours).",
      "<b>Detail page:</b> stat cards, task log, configuration panel, 90-day performance chart; Receptionist adds "
      "a Call Recordings section with a Call Player modal (Web Speech API TTS).",
      "<b>Connected workflows:</b> Activities populate notifications, journey steps, and the dashboard automation rate."]),
    ("Workflows (/workflows)",
     ["<b>Purpose:</b> No-code, event-driven automation.",
      "<b>Features:</b> Summary cards (Total Actions, Active/Paused/Draft); workflow cards with trigger, step "
      "count, action count, last run, Play/Pause/Edit/Duplicate/Delete; Create Workflow dialog (name, trigger, "
      "description).",
      "<b>Note:</b> trigger-based, no visual drag-and-drop builder in the current build."]),
    ("Analytics (/analytics)",
     ["<b>Purpose:</b> Owner-level financial/operational reporting.",
      "<b>Features:</b> Production vs. Collections charts filterable by 7D/30D/12M."]),
    ("CEO Copilot (/ceo-copilot)",
     ["<b>Purpose:</b> Conversational executive Q&amp;A over practice data.",
      "<b>Layout:</b> Left sidebar of prior conversations + New Conversation; right pane chat with streaming "
      "responses, typing indicator, 6 suggested questions.",
      "<b>AI involvement:</b> Responses are pre-scripted markdown referencing real KPIs with deep links to other "
      "modules — not a live LLM call in this build."]),
    ("Integrations (/integrations, /integrations/[id])",
     ["<b>Purpose:</b> Third-party connection management.",
      "<b>List page:</b> summary cards (Connected count, Avg Health Score, Total Records Synced), grid with "
      "health bar and sync frequency.",
      "<b>Detail page:</b> connection toggle, field-mapping config, sync history, API usage chart, error logs, "
      "Test Connection action."]),
    ("Staff & RBAC (/staff)",
     ["<b>Purpose:</b> HR, permission management, security auditing.",
      "<b>Features:</b> User management table; Role Matrix tab; Audit Logs tab (Time, User, Action, Module, IP, "
      "Result with color-coded Success/Denied badges)."]),
    ("Settings (/settings)",
     ["<b>Purpose:</b> Practice configuration.",
      "<b>Features:</b> Clinic details, API/integration key management, system preferences (theme, "
      "notifications)."]),
]
for title, bullets in modules:
    block = [P(title, "H2")]
    block += [P(b, "Bullet") for b in bullets]
    story.append(KeepTogether(block))

# ---- Section 5 Patient Journey
heading("5. Patient Journey Flow", 1, story, "s5")
story.append(P("<b>Lead → Appointment → Insurance → Visit → Imaging → Treatment → "
               "Claims → Billing → Recall → Revenue Insights</b>"))
pj_header = ["Stage", "User Actions", "AI Actions", "System Actions", "Status Transition"]
pj_rows = [
    ["Lead", "Staff/patient initiates contact", "AI Receptionist answers/books call", "Patient record created (PAT-xxxx)", "— → New Patient"],
    ["Appointment", "Front Desk confirms/reschedules", "AI Receptionist books/reminds", "Appointment status set", "Scheduled → Confirmed"],
    ["Insurance", "Insurance Coordinator reviews", "AI Insurance verifies eligibility/pre-auth", "eligibilityVerified flag set", "Unverified → Verified"],
    ["Visit", "Dentist checks in patient", "—", "Appointment status updates", "Confirmed → In Progress → Completed"],
    ["Imaging", "Dentist reviews images", "AI Radiology highlights caries risk", "Images attached to chart", "—"],
    ["Treatment", "Dentist documents visit, proposes plan", "AI Scribe drafts SOAP note", "Treatment plan created", "Proposed → Accepted/Declined → In Progress → Completed"],
    ["Claims", "Insurance Coordinator reviews/submits", "AI Claims preps, scores, submits, appeals", "Claim status updates, aiScore/aiFlags set", "Draft → Submitted → Pending → Approved/Denied/Appealed → Paid"],
    ["Billing", "Billing Manager collects/follows up", "AI Billing sends statements/AR follow-ups", "Invoice/payment recorded", "Outstanding → Partial → Paid (or Overdue)"],
    ["Recall", "—", "AI Recall triggers reminder campaigns", "recallDue evaluated, workflow fires", "Patient flagged due → contacted → rebooked"],
    ["Revenue Insights", "Clinic Owner asks CEO Copilot", "AI Revenue surfaces unscheduled-treatment/upsell opportunities", "Journey step logged with agent attribution", "Insight surfaced → action taken"],
]
story.append(styled_table(pj_header, pj_rows, [0.8*inch, 1.15*inch, 1.4*inch, 1.3*inch, 0.85*inch]))
story.append(Spacer(1,6))
story.append(P("Every stage transition can be written into the patient's <font face=\"Courier\">journey: "
               "JourneyStep[]</font>, recording stage, date, status, and the agent (if any) responsible — giving "
               "a full audit trail of human vs. AI actions."))

# ---- Section 6 AI Workforce
heading("6. AI Workforce Documentation", 1, story, "s6")
ai_header = ["Agent", "Purpose", "Trigger", "Outputs", "Screens", "Business Value"]
ai_rows = [
    ["AI Receptionist", "Phone-based booking & inquiries", "Inbound/outbound call event", "Appointment booked, patient record, transcript", "/ai-workforce/agent-receptionist, Appointments", "Captures overflow demand without added headcount"],
    ["AI Scribe", "Clinical documentation", "New clinical note started", "Draft SOAP note (S/O/A/P)", "Clinical, agent-scribe", "Cuts documentation time per visit"],
    ["AI Insurance", "Eligibility & pre-auth", "New appointment / plan created", "Verified eligibility, pre-auth status", "Insurance, agent-insurance", "Reduces day-of-visit coverage surprises"],
    ["AI Claims", "Claim prep, submission, appeals", "Treatment completed / claim denied", "Submitted claim, aiScore, aiFlags, appeal", "Claims, agent-claims", "Improves clean-claim rate, recovers denials"],
    ["AI Recall", "Recall/reactivation outreach", "recallDue date approaching", "SMS/Email/Voice campaign sends", "Communications, agent-recall", "Fills schedule gaps, recovers lapsed patients"],
    ["AI Billing", "AR management & statements", "Invoice overdue threshold", "Statement sent, follow-up logged", "Billing, agent-billing", "Shrinks AR > 90 days"],
    ["AI Revenue", "Opportunity identification", "Periodic scan of unscheduled treatment", "Flagged revenue opportunities", "Analytics, agent-revenue", "Surfaces unrealized production"],
    ["CEO Copilot", "Executive insight Q&A", "User question in chat", "Narrative answer + deep links", "/ceo-copilot", "Instant, conversational BI for owners"],
]
story.append(styled_table(ai_header, ai_rows, [0.85*inch, 1.0*inch, 1.0*inch, 1.05*inch, 0.9*inch, 0.7*inch], head_bg=TEAL_DARK))
story.append(Spacer(1,6))
story.append(P("All agents share: status (active/idle/paused), tasksToday, successRate, revenueToday, a 7-day "
               "sparkline, and a configurable confidence threshold + auto-approve threshold + working-hours "
               "window. Activity is simulated client-side (refreshing roughly every 6 seconds) rather than driven "
               "by a live LLM backend."))

# ---- Section 7 Integrations
heading("7. Integration Hub", 1, story, "s7")
int_header = ["Integration", "Category", "Data Exchanged", "Status"]
int_rows = [
    ["Open Dental", "Practice Management", "Patients, appointments, charts", "Connected · 92% · 4,231 rec · 15-min sync"],
    ["Dentrix", "Practice Management", "Patients, appointments, charts", "Disconnected (available, inactive)"],
    ["DEXIS", "Imaging", "Radiographs, CBCT scans", "Connected · 88% · 1,847 rec · real-time"],
    ["DentalXChange", "Claims Clearinghouse", "CDT claims, EOBs", "Connected · 95% · 2,134 rec · 5-min sync"],
    ["Weave", "Communications", "SMS, calls, reviews", "Connected · 78% · 8,921 rec · 30-min sync"],
    ["Stripe", "Payments", "Charges, payouts", "Connected · 99% · 3,402 rec · real-time"],
    ["QuickBooks", "Accounting", "Invoices, payments, ledger", "Connected · 91% · 1,203 rec · daily 6 AM"],
    ["Google Workspace*", "Productivity", "Scheduling, email", "Connected · 96% · 5,621 rec · 10-min sync"],
    ["Twilio*", "SMS/Voice", "SMS/voice events", "Connected · 94% · 12,489 rec · real-time"],
    ["SendGrid*", "Email", "Campaign sends", "Connected · 97% · 9,834 rec · real-time"],
]
story.append(styled_table(int_header, int_rows, [1.15*inch, 1.25*inch, 1.6*inch, 1.7*inch], head_bg=TEAL))
story.append(Spacer(1,4))
story.append(P("<i>*Present in seed data beyond the originally specified list — included for completeness.</i>", "Quote"))
story.append(P("<b>Screens affected:</b> /integrations list and /integrations/[id] detail (health score, sync "
               "frequency, field-mapping config, sync history, API usage chart, error log, Test Connection). "
               "<b>Workflow impact:</b> integration health/sync status feeds Dashboard data freshness and can "
               "gate workflow execution (e.g., claims workflows depend on DentalXChange being connected)."))

# ---- Section 8 Workflow Engine
heading("8. Workflow Engine", 1, story, "s8")
wf_header = ["Workflow", "Trigger", "Steps", "Status", "Actions Taken"]
wf_rows = [
    ["Missed Appointment Recovery", "No-Show", "5", "Active", "234"],
    ["New Patient Welcome Series", "New Patient", "6", "Active", "567"],
    ["Claim Denial Appeal", "Claim Denied", "4", "Active", "89"],
    ["90-Day AR Collection", "Invoice 90 Days Overdue", "5", "Active", "145"],
    ["Annual Recall Reminder", "Recall Due −30 Days", "4", "Active", "892"],
    ["Treatment Plan Follow-Up", "Plan Not Accepted (7 Days)", "3", "Paused", "234"],
    ["Birthday Campaign", "Patient Birthday −3 Days", "2", "Active", "412"],
    ["Post-Visit Review Request", "Appointment Completed", "3", "Draft", "0"],
]
story.append(styled_table(wf_header, wf_rows, [1.7*inch, 1.8*inch, 0.55*inch, 0.7*inch, 0.95*inch]))
story.append(Spacer(1,6))
story.append(P("<b>Available triggers</b> (Create Workflow dialog): Patient Recall Due, Appointment Booked, "
               "Appointment Completed, Claim Denied, Invoice Overdue, New Patient Added, Treatment Plan Created, "
               "Manual Trigger."))
story.append(P("<b>Editable builder capabilities:</b> name, description, and trigger selection at creation; "
               "status toggling (Activate/Pause), Edit, Duplicate, Delete on existing cards. There is no visual "
               "drag-and-drop step builder in the current implementation — workflows are configured as trigger + "
               "step-count metadata rather than a graph editor."))

# ---- Section 9 Live Agent Monitoring
heading("9. Live Agent Monitoring", 1, story, "s9")
lam_bullets = [
    "<b>Agent status tracking</b> — each AIAgent carries status (active/idle/paused), toggled from the workforce "
    "grid or detail page.",
    "<b>Activity feed</b> — renders the most recent activity entries (action, outcome, related patient/claim, "
    "timestamp), animated in/out; the list page keeps the 15 most recent activities, refreshing roughly every "
    "6–8 seconds.",
    "<b>Task execution</b> — simulated client-side; no real task queue or backend execution. Activities are "
    "generated from a template pool and prepended to the activity array (capped at 50).",
    "<b>Performance metrics</b> — tasksToday, successRate, revenueToday, 7-day sparkline on the grid; 90-day "
    "Tasks vs. Success-Rate line chart on the agent detail page.",
    "<b>Real-time simulations</b> — Receptionist call recordings are played back via the Web Speech API with "
    "distinct voice/pitch for AI vs. Patient lines, a progress bar, and a fabricated waveform.",
]
story.append(ListFlowable([ListItem(P(x, "Bullet")) for x in lam_bullets], bulletType="bullet", bulletColor=TEAL))

# ---- Section 10 Analytics
heading("10. Analytics & Reporting", 1, story, "s10")
story.append(P("<b>KPIs:</b> Total Revenue (+MoM), Active Patients, Claims Pending, AI Automation Rate, Clean "
               "Claim Rate, Avg Days to Pay, Total Denied, Total Collections, AR &gt; 90 Days, Patient Balances, "
               "Daily Patients, Notes Completed, AI Time Saved, Missing Notes, Total Messages, Active Campaigns, "
               "Avg Review Rating."))
story.append(P("<b>Charts:</b> Revenue trend (7D/30D/12M), Production vs. Collections (7D/30D/12M), agent 90-day "
               "Tasks/Success-Rate line chart, agent 7-day sparklines, integration API-usage 14-day chart."))
story.append(P("<b>Reports:</b> module-level KPI cards function as lightweight reports; no dedicated "
               "report-builder/export screen beyond Analytics' chart filters."))
story.append(P("<b>Revenue insights:</b> surfaced primarily via AI Revenue agent flags and CEO Copilot narrative "
               "answers. <b>Agent performance metrics:</b> tasksToday, successRate, revenueToday per agent; "
               "aggregated automation rate on Dashboard."))

# ---- Section 11 Demo Mode
heading("11. Demo Mode Flow", 1, story, "s11")
story.append(P("<font face=\"Courier\">uiStore</font> exposes <font face=\"Courier\">activeDemo</font> and "
               "<font face=\"Courier\">demoStep</font> with setter actions, indicating a guided walkthrough "
               "capability. Based on the seeded data and module order, the intended guided flow is:"))
demo_steps = [
    "<b>Login</b> — pick a seeded user (e.g., Sarah Martinez, Clinic Owner) → MFA screen shows the "
    "access-preview permission matrix before code entry.",
    "<b>Dashboard</b> — land on KPI overview; revenue/automation cards animate in.",
    "<b>Patients</b> — open a high-LTV patient (e.g., Marcus Jackson PAT-0099) to show full chart, insurance, "
    "journey timeline.",
    "<b>Appointments</b> — view the day's schedule; a simulated inbound call triggers the ringtone.",
    "<b>AI Workforce</b> — open AI Receptionist agent detail, play a call recording end-to-end.",
    "<b>Clinical</b> — start a new note, trigger the AI SOAP Generator for an Exam visit type.",
    "<b>Imaging</b> — open an X-ray showing the AI caries-detection overlay.",
    "<b>Insurance / Claims</b> — show a claim with a high aiScore flag, Submitted → Approved.",
    "<b>Billing</b> — collect a payment via the payment dialog; show AR > 90 days.",
    "<b>Communications</b> — launch a Recall campaign wizard; show the AI-generated SMS preview.",
    "<b>Workflows</b> — show the Annual Recall Reminder workflow firing (892 actions taken).",
    "<b>Analytics</b> — switch the Production vs. Collections chart between 7D/30D/12M.",
    "<b>CEO Copilot</b> — ask “Why did revenue drop this month?” and watch the streamed answer.",
    "<b>Integrations</b> — show DentalXChange/Stripe health scores and a recent sync.",
    "<b>Staff</b> — show the Role Matrix and an Audit Log entry for a denied access attempt.",
]
story.append(ListFlowable([ListItem(P(x, "Bullet")) for x in demo_steps], bulletType="1", bulletColor=TEAL))
story.append(P("Every step above maps to an existing screen/component; no step requires data outside what's "
               "already seeded."))

# ---- Section 12 Architecture diagram
heading("12. Complete Application Flow Diagram", 1, story, "s12")
diagram = """                              ┌─────────────┐
                              │   Users    │  (7 roles)
                              └─────┬──────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │        RBAC         │  authStore.permissions
                         │ (Full / Read / None) │  usePermission / PermissionGuard
                         └─────────┬─────────┘
                                    │
                                    ▼
        ┌─────────────────────────────────────────────────────────┐
        │                         Modules                            │
        │  Dashboard · Patients · Appointments · Clinical · Imaging   │
        │  Insurance · Claims · Billing · Communications · Analytics  │
        │  Staff · Settings · Integrations                            │
        └─────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
                      ┌──────────────────────┐
                      │ Patient Journey Engine   │  Patient.journey[]
                      │ Lead→Appt→Insurance→Visit│  (stage, status, agent)
                      │ →Imaging→Treatment→      │
                      │ Claims→Billing→Recall    │
                      └───────────┬───────────┘
                                    │
                                    ▼
                      ┌──────────────────────┐
                      │     Workflow Engine      │  trigger → steps → actions
                      │ (8 predefined workflows) │  Active/Paused/Draft
                      └───────────┬───────────┘
                                    │
                                    ▼
        ┌─────────────────────────────────────────────────────────┐
        │                      AI Workforce                          │
        │ Receptionist · Scribe · Insurance · Claims · Recall ·       │
        │ Billing · Revenue · CEO Copilot   (agentStore, simulated)  │
        └─────────────────────┬───────────────────────────┘
                                    │
                                    ▼
                      ┌─────────────────────┐
                      │      Integrations        │  Open Dental, Dentrix,
                      │  (health, sync, errors)  │  DEXIS, DentalXChange,
                      │                          │  Weave, Stripe, QuickBooks…
                      └───────────┬───────────┘
                                    │
                                    ▼
                      ┌──────────────────┐
                      │       Analytics           │  KPIs, charts, agent perf
                      └───────────┬─────────┘
                                    │
                                    ▼
                      ┌──────────────────┐
                      │      CEO Copilot          │  conversational rollup of
                      │  (chat over all KPIs)     │  every module above
                      └──────────────────┘"""
story.append(code_block(diagram))

# ---- Section 13 Screen Inventory
heading("13. Screen Inventory", 1, story, "s13")
screen_header = ["Screen", "Purpose", "Key Actions", "Full-Access Roles"]
screen_rows = [
    ["Login", "Authenticate", "Sign in", "All"],
    ["MFA Verification", "Second factor + preview", "Enter code", "Owner, Dentist, Admins"],
    ["Dashboard", "Practice overview", "View KPIs/charts", "All (read minimum)"],
    ["Patients (list)", "Browse patients", "Search, Add Patient", "Owner/Dentist/Admins (Full)"],
    ["Patient Detail", "Full chart view", "Edit, view ledger/journey", "Owner/Dentist/Admins"],
    ["Appointments", "Scheduling", "New Appt, check-in", "Owner/Dentist/Front Desk/Admins"],
    ["Clinical", "Charting", "New Note, AI SOAP", "Owner/Dentist/Admins"],
    ["Imaging", "Image review", "View, AI overlay", "Owner/Dentist/Admins"],
    ["Insurance", "Eligibility tracking", "Verify, view coverage", "Insurance Coord./Owner/Admins"],
    ["Claims (list)", "Claim lifecycle", "Submit, appeal", "Insurance Coord./Billing Mgr/Owner/Admins"],
    ["Claim Detail", "Single claim", "Edit, appeal, attach", "Same as above"],
    ["Billing", "AR & invoicing", "Collect payment, invoice", "Billing Mgr/Owner/Admins"],
    ["Communications", "Outreach hub", "New campaign, review req.", "Owner/Admins"],
    ["AI Workforce (list)", "Agent monitoring", "Toggle, Configure", "Owner/Admins"],
    ["Agent Detail", "Single agent", "Play call, adjust thresholds", "Owner/Admins"],
    ["Workflows", "Automation list", "Create/Edit/Toggle", "Owner/Admins"],
    ["Analytics", "Reporting", "Filter date range", "Owner/Billing Mgr/Admins"],
    ["CEO Copilot", "Executive chat", "Ask question", "Owner/Admins"],
    ["Integrations (list)", "Connection overview", "Connect/Disconnect", "Owner/Admins"],
    ["Integration Detail", "Single integration", "Test connection, mapping", "Owner/Admins"],
    ["Staff", "HR & audit", "Manage users, view logs", "Owner/Admins"],
    ["Settings", "Configuration", "Edit clinic/org/API settings", "Owner/Admins"],
]
story.append(styled_table(screen_header, screen_rows, [1.2*inch, 1.45*inch, 1.5*inch, 1.4*inch]))

# ---- Section 14 Feature Inventory
heading("14. Feature Inventory", 1, story, "s14")
feat_header = ["Feature", "Module", "AI Agent", "Workflow Dependency"]
feat_rows = [
    ["Add/edit patient chart", "Patients", "—", "New Patient Welcome Series"],
    ["Patient journey timeline", "Patients", "All (attribution)", "—"],
    ["Calendar booking", "Appointments", "AI Receptionist", "Missed Appointment Recovery"],
    ["Incoming-call ringtone simulation", "Appointments", "AI Receptionist", "—"],
    ["AI SOAP note generation", "Clinical", "AI Scribe", "—"],
    ["Caries-detection overlay", "Imaging", "AI Radiology (visual)", "—"],
    ["Eligibility verification", "Insurance", "AI Insurance", "—"],
    ["Claim risk scoring (aiScore/aiFlags)", "Claims", "AI Claims", "Claim Denial Appeal"],
    ["Payment collection / AR follow-up", "Billing", "AI Billing", "90-Day AR Collection"],
    ["Campaign wizard", "Communications", "AI Recall", "Annual Recall Reminder, Birthday Campaign"],
    ["Review request send", "Communications", "—", "Post-Visit Review Request"],
    ["Agent grid + live activity feed", "AI Workforce", "All 8 agents", "—"],
    ["Call recording playback (TTS)", "AI Workforce", "AI Receptionist", "—"],
    ["Agent confidence/auto-approve config", "AI Workforce", "All 8 agents", "—"],
    ["Create/Toggle/Duplicate workflow", "Workflows", "—", "self"],
    ["Production vs Collections chart", "Analytics", "AI Revenue (source)", "—"],
    ["Conversational business Q&A", "CEO Copilot", "CEO Copilot", "—"],
    ["Integration connect/disconnect", "Integrations", "—", "gates dependent workflows"],
    ["Role matrix view", "Staff", "—", "—"],
    ["Audit log review", "Staff", "—", "—"],
    ["Global search (Cmd+K)", "Cross-cutting", "—", "—"],
    ["Notifications center", "Cross-cutting", "All agents (source)", "—"],
]
story.append(styled_table(feat_header, feat_rows, [1.85*inch, 1.15*inch, 1.25*inch, 1.3*inch]))

# ---- Section 15 User Stories
heading("15. End-to-End User Stories", 1, story, "s15")
stories = [
    ("New patient booking",
     "A prospective patient calls the practice after hours. AI Receptionist answers, captures demographics, "
     "checks chair/dentist availability, and books a Cleaning appointment. A new Patient record (PAT-xxxx) is "
     "created with a journey stage “Lead → Appointment” attributed to agent-receptionist. Front "
     "Desk sees the new appointment the next morning and confirms it; a notification appears in the bell menu."),
    ("Emergency patient",
     "A patient calls in pain. AI Receptionist classifies it as urgent, books an Emergency-type appointment "
     "same-day, and flags the chair. Front Desk sees the booking highlighted; the dentist uses the AI SOAP "
     "Generator after the visit, then creates a treatment plan."),
    ("Insurance verification",
     "Insurance Coordinator opens Insurance for a newly booked patient. AI Insurance has already run eligibility "
     "verification, setting eligibilityVerified and populating deductible/annual-max/coverage percentages. The "
     "Coordinator confirms before the visit, avoiding a day-of surprise."),
    ("Claim submission",
     "After a completed Filling visit, AI Claims assembles CDT codes into a claim, runs a risk score, and finds "
     "an aiFlag for a missing X-ray attachment. The Insurance Coordinator attaches the image; the claim moves "
     "Draft → Submitted → Approved/Denied. If Denied, the Claim Denial Appeal workflow triggers AI "
     "Claims to draft an appeal."),
    ("Recall campaign",
     "The Annual Recall Reminder workflow fires for patients whose recallDue is 30 days out. AI Recall sends a "
     "personalized SMS/Email; if unanswered in 7 days, escalates to a phone reminder logged as agentGenerated. "
     "The Owner sees campaign performance on the agent-recall detail page (124 tasks, 76% success)."),
    ("Revenue optimization",
     "AI Revenue scans treatment plans and patient history, flags unscheduled high-value procedures and lapsed "
     "high-LTV patients. The Clinic Owner asks CEO Copilot “Where are our revenue opportunities?” and "
     "gets a markdown-formatted answer naming specific patients with deep links to act directly."),
    ("CEO asking business questions",
     "The Clinic Owner opens CEO Copilot, selects “Why did revenue drop this month?” The assistant "
     "streams a structured analysis (key numbers, likely causes such as a Delta Dental denial spike, recommended "
     "actions) with inline links back to Claims and Communications so the owner can act immediately."),
]
for title, text in stories:
    story.append(KeepTogether([P(title, "H2"), P(text, "Body")]))

# ================================================================== DOC ASSEMBLY

class FlowDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, "_bookmarkName"):
            bm = flowable._bookmarkName
            self.canv.bookmarkPage(bm)
            text = flowable.getPlainText()
            level = 0 if text.split(".")[0].strip().isdigit() and len(text.split(".")[0]) <= 2 and "." in text[:4] else 1
            self.canv.addOutlineEntry(text, bm, level=0, closed=False)


def build():
    doc = FlowDoc(OUT_PDF, pagesize=LETTER,
                  leftMargin=MARGIN, rightMargin=MARGIN,
                  topMargin=MARGIN, bottomMargin=0.9*inch,
                  title="DentalOS AI — Complete Application Flow Documentation",
                  author="DentalOS AI", subject="Product Documentation")

    cover_frame = Frame(0, 0, PAGE_W, PAGE_H, id="cover", leftPadding=0, rightPadding=0,
                         topPadding=0, bottomPadding=0)
    content_frame = Frame(MARGIN, 0.9*inch, PAGE_W - 2*MARGIN, PAGE_H - 1.7*inch, id="content")

    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=cover_page),
        PageTemplate(id="Content", frames=[content_frame], onPage=header_footer),
    ])

    full_story = [NextPageTemplate("Cover"), Spacer(0, 0)]
    # cover content is drawn via onPage; need a page break to trigger it
    full_story.append(PageBreak())
    full_story.append(NextPageTemplate("Content"))

    # TOC page
    toc_block = [Paragraph("Table of Contents", styles["TOCHeading"])]
    for level, text, bm in toc_entries:
        if level == 1:
            p = Paragraph(f'<a href="#{bm}" color="#0B2545">{text}</a>', styles["TOC1"])
            toc_block.append(p)
    full_story += toc_block
    full_story.append(PageBreak())

    full_story += story

    doc.build(full_story)
    print(f"Built: {OUT_PDF}")


if __name__ == "__main__":
    build()
