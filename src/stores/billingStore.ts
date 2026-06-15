import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Invoice, PaymentEntry } from "@/types";
import invoicesData from "@/mock/invoices.json";

interface BillingStore {
  invoices: Invoice[];
  recordPayment: (invoiceId: string, payment: PaymentEntry) => void;
}

export const useBillingStore = create<BillingStore>()(
  persist(
    (set) => ({
      invoices: invoicesData as Invoice[],
      recordPayment: (invoiceId, payment) =>
        set((s) => ({
          invoices: s.invoices.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            const newPaid = inv.patientPaid + payment.amount;
            const newBalance = inv.balance - payment.amount;
            const status = newBalance <= 0 ? "Paid" : "Partial";
            return { ...inv, patientPaid: newPaid, balance: Math.max(0, newBalance), status: status as Invoice["status"], paymentHistory: [...inv.paymentHistory, payment] };
          }),
        })),
    }),
    { name: "dental-billing" }
  )
);
