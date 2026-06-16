# DentalOS AI Platform Overview

Welcome to the comprehensive documentation for the **DentalOS AI Platform**. This document details the complete end-to-end workflow, individual features, Role-Based Access Control (RBAC), and Key Performance Indicators (KPIs) available in the system.

---

## 1. Role-Based Access Control (RBAC)

The platform is designed with strict, modular Role-Based Access Control (RBAC) enforced at both the UI (navigation/buttons) and routing layers. Access levels include **Full** (view and edit), **Read** (view only), and **None** (hidden entirely).

### Default Roles & Access Matrix

| Role | Patients | Appointments | Clinical | Claims | Billing | Reports (Analytics) | Settings | AI Agents |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Clinic Owner** | Full | Full | Full | Full | Full | Full | Full | Full |
| **Dentist** | Full | Full | Full | Read | Read | Read | None | None |
| **Front Desk** | Read | Full | None | Read | None | None | None | None |
| **Insurance Coord.** | Read | Read | None | Full | Read | Read | None | None |
| **Billing Manager** | Read | None | None | Full | Full | Full | None | None |
| **DSO / Super Admin**| Full | Full | Full | Full | Full | Full | Full | Full |

> **MFA Enforcement:** High-privilege roles (e.g., Clinic Owner, Dentist, Admins) require 6-digit MFA verification upon login. Lower-privilege roles (e.g., Front Desk, Billing) bypass MFA in this configuration.

---

## 2. Global Workflow & Navigation

### Authentication Flow
1. **Login Page**: Users enter their email and password.
2. **MFA Gate**: If `mfaEnabled` is true for the user's role, they are redirected to `/login/mfa`.
3. **Access Preview**: On the MFA page, users see a complete matrix of exactly what modules they will have access to (Full, View, or None) before entering their code.

### Sidebar Navigation
The sidebar dynamically hides or shows modules based on the `authStore` permissions. It highlights the active route and includes a **Global Search (Cmd+K)** that is universally accessible.

### Notifications Menu
The top-right bell icon shows real-time alerts categorized by severity (Alert, Warning, Success, Info). Examples include AR 90+ Day Alerts, AI Recall Campaign statuses, and Claims at Risk.

---

## 3. Module Workflows & Features

### Dashboard (`/dashboard`)
*   **Workflow**: Acts as the daily operational command center.
*   **KPI Cards**: 
    *   **Total Revenue**: Total collected (e.g., $124.5k) with MoM trend.
    *   **Active Patients**: Number of active charts.
    *   **Claims Pending**: Total claims awaiting approval/payment.
    *   **AI Automation Rate**: Percentage of tasks handled autonomously by AI.
*   **Charts**: Revenue over 7D/30D/12M.

### Appointments (`/appointments`)
*   **Workflow**: Managing the daily schedule, patient check-ins, and booking.
*   **Features**:
    *   Calendar view of the day/week.
    *   **Web Audio Ringtone**: The platform plays a synthesized browser ringtone when an incoming call (or AI simulated call) triggers.
    *   Action Button: **New Appointment**.

### Clinical (`/clinical`)
*   **Workflow**: Charting patient visits, writing SOAP notes, and reviewing treatment history.
*   **KPI Cards**: Daily Patients, Notes Completed, AI Time Saved, Missing Notes.
*   **Features**:
    *   **New Note Dialog**: Select a patient, choose from 12 visit types (e.g., Exam, Filling, Root Canal), specify tooth number.
    *   **AI SOAP Generator**: Automatically drafts Subjective, Objective, Assessment, and Plan fields based on the selected visit type.
    *   **In-Page State**: Notes are saved locally to the session and displayed in an expandable "Notes Added This Session" view.

### Patients (`/patients`)
*   **Workflow**: CRM for clinical demographics, treatment plans, and ledger.
*   **Features**:
    *   List of all patients with Quick Actions.
    *   Patient Detail View: Demographics, Insurance (PPO/HMO), Appointment History.
    *   Action Button: **Add New Patient**.

### Imaging (`/imaging`)
*   **Workflow**: Reviewing X-rays, CBCT scans, and intraoral photos.
*   **Features**: Image grid with mock AI Caries Detection highlighting potential cavities.

### Insurance & Claims (`/insurance`, `/claims`)
*   **Workflow**: Tracking the lifecycle of insurance billing.
*   **KPI Cards**: Clean Claim Rate, Avg Days to Pay, Total Denied.
*   **Features**:
    *   Status tracking (Submitted, Approved, Denied).
    *   Insurance verification badges.

### Billing (`/billing`)
*   **Workflow**: Patient statements and Accounts Receivable (AR).
*   **KPI Cards**: Total Collections, AR > 90 Days, Patient Balances.
*   **Features**: Payment collection dialog, invoice generation.

### Communications (`/communications`)
*   **Workflow**: Managing patient outreach, recalls, and reviews via SMS, Email, and Voice.
*   **KPI Cards**: Total Messages, Active Campaigns, Avg Review Rating, Total Recipients.
*   **Features**:
    *   **Inbox**: Real-time chat interface displaying 2-way SMS/Email threads.
    *   **New Campaign**: Step-by-step wizard to create campaigns (Recall, Reactivation, Birthday, Review). Supports Email (with subjects), SMS (with char limits), and **Voice Scripts**.
    *   **Send Review Request**: Dialog to select a patient and send a Google/Yelp review link via Email/SMS.
    *   **Templates**: Pre-written templates for Email, SMS, and Voice.

### Analytics (`/analytics`)
*   **Workflow**: Practice owner reporting and financial health analysis.
*   **Features**: Production vs. Collection charts dynamically filtered by 7D, 30D, and 12M ranges.

### AI Workforce (`/ai-workforce`)
*   **Workflow**: Monitoring and managing autonomous AI agents (Receptionist, Biller, Recall).
*   **Features**:
    *   **Live Call Player**: A modal that plays synthesized AI vs. Patient call recordings using the **Browser's Web Speech API (TTS)**. Includes a static waveform, mute, pause, and an active transcript line highlighter.
    *   **Task Log**: Real-time feed of what the AI has accomplished (e.g., "Booked appointment", "Verified Delta Dental").
    *   **90-Day History Chart**: Visualizing AI success rates and task volume over time.

### Staff & Audit Logs (`/staff`)
*   **Workflow**: HR, permission management, and security auditing.
*   **Features**:
    *   User Management table.
    *   **Role Matrix Tab**: Visual overview of which roles have which permissions.
    *   **Audit Logs Tab**: A security table logging Time, User, Action, Module, IP Address, and Result (Success/Denied). Color-coded badges for easy tracking of unauthorized access attempts.

### Settings (`/settings`)
*   **Workflow**: Practice configuration.
*   **Features**: Clinic details, API integration management, and system preferences.

---

## 4. UI/UX Paradigm
*   **Glassmorphism & Gradients**: Subtle background blur and gradient headers to create a premium, state-of-the-art feel.
*   **Micro-animations**: Framer Motion is used for floating elements, status indicators, and modal transitions.
*   **Data Density**: Tables and forms use compact layouts, Lucide icons for visual parsing, and color-coded status badges (`Success`, `Warning`, `Info`, `Draft`).
*   **Responsive**: The sidebar collapses into a hamburger menu on smaller screens, and grid layouts dynamically stack.
