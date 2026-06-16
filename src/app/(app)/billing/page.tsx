"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useBillingStore } from "@/stores/billingStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PdfReport } from "@/lib/pdf";
import { toast } from "sonner";
import type { Invoice } from "@/types";
import { useCanEdit } from "@/hooks/usePermission";

const AR_DATA = [
  { range: "Current", amount: 48200 },
  { range: "30 Days", amount: 31400 },
  { range: "60 Days", amount: 22800 },
  { range: "90+ Days", amount: 34200 },
];

export default function BillingPage() {
  const { invoices, recordPayment } = useBillingStore();
  const canEdit = useCanEdit("Billing");
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [payForm, setPayForm] = useState({ amount: "", method: "Credit Card", date: new Date().toISOString().slice(0, 10), notes: "" });

  const now = new Date().getTime();
  const total = invoices.reduce((s, inv) => s + inv.balance, 0);
  const by30 = invoices.filter((inv) => {
    const days = (now - new Date(inv.dueDate).getTime()) / 86400000;
    return days > 0 && days <= 30;
  }).reduce((s, inv) => s + inv.balance, 0);
  const by60 = invoices.filter((inv) => {
    const days = (now - new Date(inv.dueDate).getTime()) / 86400000;
    return days > 30 && days <= 60;
  }).reduce((s, inv) => s + inv.balance, 0);
  const by90 = invoices.filter((inv) => {
    const days = (now - new Date(inv.dueDate).getTime()) / 86400000;
    return days > 60;
  }).reduce((s, inv) => s + inv.balance, 0);
  const collectRate = invoices.length > 0
    ? ((invoices.filter((inv) => inv.status === "Paid").length / invoices.length) * 100).toFixed(0)
    : "0";

  const filtered = statusFilter === "All" ? invoices : invoices.filter((inv) => inv.status === statusFilter);

  const handlePayment = () => {
    if (!selectedInv || !payForm.amount) return;
    recordPayment(selectedInv.id, {
      id: `PAY-${Date.now()}`,
      date: payForm.date,
      amount: parseFloat(payForm.amount),
      method: payForm.method as Invoice["paymentHistory"][0]["method"],
      notes: payForm.notes,
    });
    setSelectedInv(null);
    setPayForm({ amount: "", method: "Credit Card", date: new Date().toISOString().slice(0, 10), notes: "" });
  };

  const exportInvoicePdf = (inv: Invoice) => {
    const report = new PdfReport(
      `Invoice ${inv.id} — ${inv.patientName}`,
      `Invoice Date ${formatDate(inv.date)} · Due ${formatDate(inv.dueDate)}`
    );

    report.sectionTitle("Invoice Summary");
    report.keyValueRows([
      ["Invoice ID", inv.id],
      ["Patient", inv.patientName],
      ["Invoice Date", formatDate(inv.date)],
      ["Due Date", formatDate(inv.dueDate)],
      ["Status", inv.status],
      ["Total Billed", formatCurrency(inv.totalBilled)],
      ["Insurance Paid", formatCurrency(inv.insurancePaid)],
      ["Patient Paid", formatCurrency(inv.patientPaid)],
      ["Balance Due", formatCurrency(inv.balance)],
    ]);

    report.sectionTitle("Procedures");
    if (inv.procedures.length > 0) {
      report.table(
        ["Code", "Description", "Tooth", "Fee"],
        inv.procedures.map((p) => [p.code, p.description, p.tooth ?? "—", formatCurrency(p.fee)]),
        [60, 280, 60, 100]
      );
    } else {
      report.paragraph("No procedures listed on this invoice.");
    }

    report.sectionTitle("Payment History");
    if (inv.paymentHistory.length > 0) {
      report.table(
        ["Date", "Method", "Amount", "Notes"],
        inv.paymentHistory.map((ph) => [formatDate(ph.date), ph.method, formatCurrency(ph.amount), ph.notes || "—"])
      );
    } else {
      report.paragraph("No payments recorded yet.");
    }

    report.save(`invoice-${inv.id}.pdf`);
    toast.success(`Invoice ${inv.id} exported to PDF`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Billing &amp; AR Management</h2>
          <p className="text-sm text-muted-foreground">{invoices.length} total invoices</p>
        </div>
        {canEdit && <Button variant="outline" size="sm" onClick={() => {
          const rows = [["ID","Patient","Date","Billed","Ins Paid","Balance","Status"],...invoices.map((i) => [i.id,i.patientName,i.date,i.totalBilled,i.insurancePaid,i.balance,i.status])];
          const csv = rows.map((r) => r.join(",")).join("\n");
          const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download = "billing-export.csv"; a.click();
          toast.success("Billing data exported to CSV");
        }}><Download className="size-4" /> Export</Button>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">Total Outstanding</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(total)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">30-Day AR</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{formatCurrency(by30)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">60-Day AR</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(by60)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">90+ Day AR</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(by90)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase">Collections Rate</p>
          <p className="text-xl font-bold text-green-600 mt-1">{collectRate}%</p>
        </CardContent></Card>
      </div>

      {/* AR Aging Chart */}
      <Card>
        <CardHeader><CardTitle>AR Aging Breakdown</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={AR_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 12 }} width={70} />
              <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), "AR Balance"]} />
              <Bar dataKey="amount" fill="#4F46E5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
            >
              {["All", "Paid", "Partial", "Outstanding", "Overdue"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Patient</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium">Billed</th>
                <th className="text-right px-4 py-3 font-medium">Ins. Paid</th>
                <th className="text-right px-4 py-3 font-medium">Patient Owes</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{inv.id}</td>
                  <td className="px-4 py-3 font-medium">{inv.patientName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(inv.totalBilled)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(inv.insurancePaid)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${inv.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(inv.balance)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="xs" variant="outline" onClick={() => setSelectedInv(inv)}>
                        {inv.balance > 0 && canEdit ? "Record Payment" : "View"}
                      </Button>
                      <Button size="xs" variant="outline" title="Export invoice as PDF" onClick={() => exportInvoicePdf(inv)}>
                        <FileText className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Detail Sheet */}
      <Sheet open={!!selectedInv} onOpenChange={(open) => !open && setSelectedInv(null)}>
        <SheetContent side="right" className="w-[420px]">
          <SheetHeader>
            <div className="flex items-center justify-between gap-2">
              <SheetTitle>Invoice {selectedInv?.id}</SheetTitle>
              {selectedInv && (
                <Button size="xs" variant="outline" onClick={() => exportInvoicePdf(selectedInv)}>
                  <Download className="size-3.5" /> PDF
                </Button>
              )}
            </div>
          </SheetHeader>
          {selectedInv && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{selectedInv.patientName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(selectedInv.date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span>{formatDate(selectedInv.dueDate)}</span></div>
                <div className="flex justify-between font-semibold"><span>Balance</span><span className="text-red-600">{formatCurrency(selectedInv.balance)}</span></div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Procedures</p>
                {selectedInv.procedures.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-border/50 pb-1 mb-1">
                    <span className="text-muted-foreground">{p.code} — {p.description}</span>
                    <span>{formatCurrency(p.fee)}</span>
                  </div>
                ))}
              </div>

              {selectedInv.paymentHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Payment History</p>
                  {selectedInv.paymentHistory.map((ph) => (
                    <div key={ph.id} className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>{formatDate(ph.date)} · {ph.method}</span>
                      <span className="text-green-600">+{formatCurrency(ph.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedInv.balance > 0 && canEdit && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-semibold">Record Payment</p>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={payForm.amount}
                    onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm"
                  />
                  <select
                    value={payForm.method}
                    onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm"
                  >
                    {["Cash", "Check", "Credit Card", "ACH", "CareCredit"].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input
                    type="date"
                    value={payForm.date}
                    onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm"
                  />
                  <input
                    placeholder="Notes (optional)"
                    value={payForm.notes}
                    onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm"
                  />
                  <Button className="w-full" onClick={handlePayment}>Record Payment</Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
