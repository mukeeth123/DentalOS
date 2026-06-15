"use client";

import { useState } from "react";
import { CheckCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePatientsStore } from "@/stores/patientsStore";

const INSURERS = [
  { name: "Delta Dental", claims: 58, approvalRate: 82, avgDaysToPay: 18, activePatients: 234 },
  { name: "Aetna", claims: 42, approvalRate: 91, avgDaysToPay: 14, activePatients: 189 },
  { name: "United Healthcare", claims: 31, approvalRate: 88, avgDaysToPay: 22, activePatients: 156 },
  { name: "Cigna", claims: 24, approvalRate: 94, avgDaysToPay: 16, activePatients: 134 },
  { name: "BlueCross", claims: 19, approvalRate: 87, avgDaysToPay: 20, activePatients: 98 },
  { name: "MetLife", claims: 12, approvalRate: 90, avgDaysToPay: 17, activePatients: 56 },
];

export default function InsurancePage() {
  const { patients } = usePatientsStore();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const verifiedCount = patients.filter((p) => p.insurancePrimary.eligibilityVerified).length;
  const pendingCount = patients.filter((p) => !p.insurancePrimary.eligibilityVerified).length;
  const avgCoverage = Math.round(patients.reduce((s, p) => s + p.insurancePrimary.coveragePreventive, 0) / patients.length);

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setVerified(true); }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Insurance Management</h2>
          <p className="text-sm text-muted-foreground">Eligibility verification &amp; insurer performance</p>
        </div>
        <Button onClick={handleVerify} disabled={verifying}>
          <RefreshCw className={`size-4 ${verifying ? "animate-spin" : ""}`} />
          {verifying ? "Verifying..." : "Run Verification"}
        </Button>
      </div>

      {verified && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle className="size-4" />
          Eligibility verification complete — 31 patients verified, 3 issues flagged
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">31</p>
          <p className="text-xs text-muted-foreground mt-1">Verifications Today</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending Verification</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{avgCoverage}%</p>
          <p className="text-xs text-muted-foreground mt-1">Avg Coverage Rate</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-red-600">12</p>
          <p className="text-xs text-muted-foreground mt-1">Claims at Risk</p>
        </CardContent></Card>
      </div>

      {/* Insurer Performance Table */}
      <Card>
        <CardHeader><CardTitle>Insurer Performance</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Insurer</th>
              <th className="text-right px-4 py-3 font-medium">Claims Submitted</th>
              <th className="text-left px-4 py-3 font-medium">Approval Rate</th>
              <th className="text-right px-4 py-3 font-medium">Avg Days to Pay</th>
              <th className="text-right px-4 py-3 font-medium">Active Patients</th>
            </tr></thead>
            <tbody>
              {INSURERS.map((ins, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{ins.name}</td>
                  <td className="px-4 py-3 text-right">{ins.claims}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-24 bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${ins.approvalRate >= 90 ? "bg-green-500" : ins.approvalRate >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${ins.approvalRate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${ins.approvalRate >= 90 ? "text-green-600" : ins.approvalRate >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                        {ins.approvalRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{ins.avgDaysToPay} days</td>
                  <td className="px-4 py-3 text-right">{ins.activePatients}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Patients Pending Verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Patients Needing Verification</CardTitle>
            <span className="text-xs text-muted-foreground">{pendingCount} total</span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Patient</th>
              <th className="text-left px-4 py-3 font-medium">Insurer</th>
              <th className="text-left px-4 py-3 font-medium">Next Appointment</th>
              <th className="text-right px-4 py-3 font-medium">Action</th>
            </tr></thead>
            <tbody>
              {patients.filter((p) => !p.insurancePrimary.eligibilityVerified).slice(0, 10).map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium">{p.firstName} {p.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.insurancePrimary.insurerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.nextAppointment ? new Date(p.nextAppointment).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="xs">Verify Now</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
