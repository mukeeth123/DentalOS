export type RoleType =
  | "Super Admin"
  | "DSO Admin"
  | "Clinic Owner"
  | "Dentist"
  | "Front Desk"
  | "Insurance Coordinator"
  | "Billing Manager";

export type Gender = "Male" | "Female" | "Other";
export type RiskScore = "Low" | "Medium" | "High";
export type AppointmentType =
  | "Cleaning"
  | "Exam"
  | "Filling"
  | "Root Canal"
  | "Crown"
  | "Extraction"
  | "Implant"
  | "Orthodontic"
  | "Emergency";
export type AppointmentStatus =
  | "Scheduled"
  | "Confirmed"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "No Show";
export type ClaimStatus =
  | "Draft"
  | "Submitted"
  | "Pending"
  | "Approved"
  | "Denied"
  | "Appealed"
  | "Paid";
export type StaffStatus = "Active" | "Inactive" | "On Leave";
export type InvoiceStatus = "Paid" | "Partial" | "Outstanding" | "Overdue";
export type Theme = "light" | "dark" | "system";

export interface InsurancePolicy {
  insurerId: string;
  insurerName: string;
  memberId: string;
  groupNumber: string;
  effectiveDate: string;
  terminationDate?: string;
  copay: number;
  deductible: number;
  deductibleMet: number;
  annualMax: number;
  annualUsed: number;
  coveragePreventive: number;
  coverageBasic: number;
  coverageMajor: number;
  coverageOrthodontic: number;
  eligibilityVerified: boolean;
  lastVerifiedDate: string;
}

export interface MedicalCondition {
  condition: string;
  diagnosedDate: string;
  notes?: string;
}

export interface DentalRecord {
  date: string;
  procedure: string;
  tooth?: string;
  dentistId: string;
  notes?: string;
}

export interface CDTCode {
  code: string;
  description: string;
  tooth?: string;
  fee: number;
}

export interface TreatmentPlan {
  id: string;
  date: string;
  dentistId: string;
  procedures: CDTCode[];
  totalCost: number;
  insuranceEstimate: number;
  patientEstimate: number;
  status: "Proposed" | "Accepted" | "Declined" | "In Progress" | "Completed";
  acceptedDate?: string;
}

export interface JourneyStep {
  id: string;
  stage: string;
  date: string;
  status: "completed" | "in_progress" | "pending";
  agentId?: string;
  agentName?: string;
  notes?: string;
}

export interface CommunicationEntry {
  id: string;
  channel: "SMS" | "Email" | "Voice";
  direction: "inbound" | "outbound";
  timestamp: string;
  preview: string;
  fullContent?: string;
  agentGenerated?: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Patient {
  id: string;
  photo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string;
  address: Address;
  insurancePrimary: InsurancePolicy;
  insuranceSecondary?: InsurancePolicy;
  medicalHistory: MedicalCondition[];
  allergies: string[];
  medications: string[];
  dentalHistory: DentalRecord[];
  treatmentPlans: TreatmentPlan[];
  claims: string[];
  invoices: string[];
  communications: CommunicationEntry[];
  documents: Document[];
  journey: JourneyStep[];
  recallDue: string;
  lastVisit: string;
  nextAppointment?: string;
  riskScore: RiskScore;
  lifetimeValue: number;
  outstandingBalance: number;
  clinic: string;
  assignedDentist: string;
  tags: string[];
  createdAt: string;
  notes: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  dentistId: string;
  dentistName: string;
  clinicId: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  chair: string;
  notes: string;
  insuranceVerified: boolean;
  preAuthRequired: boolean;
  estimatedRevenue: number;
  createdBy: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  patientId: string;
  patientName: string;
  insurerId: string;
  insurerName: string;
  clinicId: string;
  procedureCodes: CDTCode[];
  totalBilled: number;
  totalAllowed: number;
  totalPaid: number;
  patientResponsibility: number;
  status: ClaimStatus;
  submittedDate?: string;
  processedDate?: string;
  denialReason?: string;
  aiScore: number;
  aiFlags: string[];
  attachments: string[];
  notes: string;
}

export interface WeeklySchedule {
  monday: { start: string; end: string; active: boolean };
  tuesday: { start: string; end: string; active: boolean };
  wednesday: { start: string; end: string; active: boolean };
  thursday: { start: string; end: string; active: boolean };
  friday: { start: string; end: string; active: boolean };
  saturday: { start: string; end: string; active: boolean };
  sunday: { start: string; end: string; active: boolean };
}

export interface Staff {
  id: string;
  photo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: RoleType;
  clinicIds: string[];
  specialties?: string[];
  npiNumber?: string;
  licenseNumber?: string;
  schedule: WeeklySchedule;
  status: StaffStatus;
  hireDate: string;
  lastLogin: string;
  permissions: string[];
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  clinicId: string;
  date: string;
  procedures: CDTCode[];
  totalBilled: number;
  insurancePaid: number;
  patientPaid: number;
  balance: number;
  status: InvoiceStatus;
  dueDate: string;
  paymentHistory: PaymentEntry[];
  notes?: string;
}

export interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
  method: "Cash" | "Check" | "Credit Card" | "ACH" | "CareCredit";
  notes?: string;
}

export interface Organization {
  id: string;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoIcon: string;
  specialty: string[];
  clinics: Clinic[];
  totalStaff: number;
  totalPatients: number;
}

export interface Clinic {
  id: string;
  name: string;
  address: Address;
  phone: string;
  orgId: string;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  status: "active" | "idle" | "paused";
  tasksToday: number;
  successRate: number;
  revenueToday: number;
  sparklineData: number[];
  currentActivity?: string;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  timestamp: string;
  outcome?: string;
  patientId?: string;
  claimId?: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  healthScore: number;
  lastSync: string;
  syncFrequency: string;
  recordsSynced: number;
  uptime: number;
  apiVersion: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  stepsCount: number;
  status: "Active" | "Draft" | "Paused";
  lastRun?: string;
  actionsCount: number;
  description: string;
}
