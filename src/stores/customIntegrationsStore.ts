import { create } from "zustand";
import { persist } from "zustand/middleware";
import ciData from "@/mock/custom-integrations.json";

export interface FieldMapping {
  dentalOsField: string;
  externalField: string;
  type: string;
  synced: boolean;
}

export interface SyncLog {
  time: string;
  records: number;
  duration: string;
  status: "success" | "error";
}

export interface ErrorLog {
  time: string;
  code: string;
  message: string;
  resolved: boolean;
}

export type AuthType = "API Key" | "Bearer Token" | "OAuth 2.0" | "Basic Auth";
export type CICategory =
  | "CRM Systems"
  | "ERP Systems"
  | "HR Systems"
  | "Accounting Platforms"
  | "Marketing Platforms"
  | "Insurance Platforms"
  | "Custom AI Services"
  | "Internal Enterprise Systems";

export interface CustomIntegration {
  id: string;
  name: string;
  category: CICategory | string;
  description: string;
  status: "connected" | "disconnected";
  healthScore: number;
  baseUrl: string;
  authType: AuthType;
  webhookUrl: string;
  syncFrequency: string;
  lastSync: string | null;
  recordsSynced: number;
  uptime: number;
  apiVersion: string;
  totalApiCalls: number;
  successRate: number;
  failedSyncs: number;
  avgResponseMs: number;
  dataVolumeMB: number;
  fieldMappings: FieldMapping[];
  webhookEvents: string[];
  workflowTriggers: string[];
  syncLogs: SyncLog[];
  errorLogs: ErrorLog[];
}

interface CIStore {
  integrations: CustomIntegration[];
  addIntegration: (ci: CustomIntegration) => void;
  updateStatus: (id: string, status: "connected" | "disconnected") => void;
  updateIntegration: (id: string, patch: Partial<CustomIntegration>) => void;
  deleteIntegration: (id: string) => void;
  appendSyncLog: (id: string, log: SyncLog) => void;
}

export const useCustomIntegrationsStore = create<CIStore>()(
  persist(
    (set) => ({
      integrations: ciData as CustomIntegration[],
      addIntegration: (ci) => set((s) => ({ integrations: [...s.integrations, ci] })),
      updateStatus: (id, status) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id
              ? { ...i, status, lastSync: status === "connected" ? new Date().toISOString() : i.lastSync }
              : i
          ),
        })),
      updateIntegration: (id, patch) =>
        set((s) => ({ integrations: s.integrations.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      deleteIntegration: (id) =>
        set((s) => ({ integrations: s.integrations.filter((i) => i.id !== id) })),
      appendSyncLog: (id, log) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, syncLogs: [log, ...i.syncLogs].slice(0, 50) } : i
          ),
        })),
    }),
    { name: "dental-custom-integrations" }
  )
);
