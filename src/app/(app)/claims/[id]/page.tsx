"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClaimsStore } from "@/stores/claimsStore";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_ORDER = ["Draft", "Submitted", "Pending", "Approved", "Paid"];

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { claims, updateStatus } = useClaimsStore();
  const claim = claims.find((c) => c.id === id);

  if (!claim) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">Claim not found</p>
      <Button onClick={() => router.push("/claims")} variant="outline"><ArrowLeft className="size-4" /> Back</Button>
    </div>
  );

  const currentStatusIdx = STATUS_ORDER.indexOf(claim.status === "Appealed" ? "Submitted" : claim.status);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/claims")}>
        <ArrowLeft className="size-4" /> Back to Claims
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold font-mono">{claim.id}</h1>
                <StatusBadge status={claim.status} />
                {claim.status === "Denied" && <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">⚠ Denied</span>}
              </div>
              <p className="font-semibold text-lg">{claim.patientName}</p>
              <p className="text-sm text-muted-foreground">{claim.insurerName}</p>
              {claim.submittedDate && <p className="text-xs text-muted-foreground mt-1">Submitted: {formatDate(claim.submittedDate)}</p>}
              {claim.processedDate && <p className="text-xs text-muted-foreground">Processed: {formatDate(claim.processedDate)}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Billed</p>
                <p className="text-2xl font-bold">{formatCurrency(claim.totalBilled)}</p>
              </div>
              <div className="flex gap-2">
                {claim.status === "Denied" && (
                  <Button size="sm" onClick={() => updateStatus(claim.id, "Appealed")}>Appeal Claim</Button>
                )}
                {claim.status === "Pending" && (
                  <Button size="sm" onClick={() => updateStatus(claim.id, "Approved")}>Mark Approved</Button>
                )}
                {claim.status === "Approved" && (
                  <Button size="sm" onClick={() => updateStatus(claim.id, "Paid")}>Mark Paid</Button>
                )}
                {claim.status === "Draft" && (
                  <Button size="sm" onClick={() => updateStatus(claim.id, "Submitted")}>Submit Claim</Button>
                )}
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="mt-6">
            <div className="flex items-center">
              {STATUS_ORDER.map((s, i) => {
                const active = i <= currentStatusIdx;
                const current = i === currentStatusIdx;
                return (
                  <div key={s} className="flex-1 flex items-center">
                    <div className={`flex flex-col items-center gap-1 flex-shrink-0`}>
                      <div className={`size-6 rounded-full border-2 flex items-center justify-center text-xs
                        ${active ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}
                        ${current ? "ring-2 ring-primary/30" : ""}`}>
                        {active ? <CheckCircle className="size-3" /> : <Clock className="size-3" />}
                      </div>
                      <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
                    </div>
                    {i < STATUS_ORDER.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${active && i < currentStatusIdx ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Procedures Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Procedure Codes</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2">CDT Code</th>
                  <th className="text-left pb-2">Description</th>
                  <th className="text-left pb-2">Tooth</th>
                  <th className="text-right pb-2">Fee</th>
                </tr></thead>
                <tbody>
                  {claim.procedureCodes.map((proc, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 font-mono text-xs">{proc.code}</td>
                      <td className="py-2">{proc.description}</td>
                      <td className="py-2 text-muted-foreground">{proc.tooth ?? "—"}</td>
                      <td className="py-2 text-right">{formatCurrency(proc.fee)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold border-t border-border">
                    <td colSpan={3} className="pt-2">Total Billed</td>
                    <td className="pt-2 text-right">{formatCurrency(claim.totalBilled)}</td>
                  </tr>
                  <tr className="text-muted-foreground text-xs">
                    <td colSpan={3} className="pt-1">Allowed</td>
                    <td className="pt-1 text-right">{formatCurrency(claim.totalAllowed)}</td>
                  </tr>
                  <tr className="text-muted-foreground text-xs">
                    <td colSpan={3} className="pt-1">Paid</td>
                    <td className="pt-1 text-right text-green-600">{formatCurrency(claim.totalPaid)}</td>
                  </tr>
                  <tr className="text-xs">
                    <td colSpan={3} className="pt-1">Patient Responsibility</td>
                    <td className={`pt-1 text-right ${claim.patientResponsibility > 0 ? "text-orange-600" : "text-muted-foreground"}`}>{formatCurrency(claim.patientResponsibility)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Denial reason */}
          {claim.denialReason && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><XCircle className="size-4" /> Denial Reason</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{claim.denialReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {claim.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{claim.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* AI Analysis */}
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                🤖 AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Approval Probability</span>
                  <span className={`font-bold ${claim.aiScore >= 80 ? "text-green-600" : claim.aiScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                    {claim.aiScore}%
                  </span>
                </div>
                <Progress value={claim.aiScore} className="h-3" />
              </div>

              {claim.aiFlags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Risk Flags</p>
                  <div className="space-y-1">
                    {claim.aiFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg px-2 py-1.5">
                        <AlertTriangle className="size-3 text-yellow-600 mt-0.5 shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">AI Suggestions</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3 text-green-600 mt-0.5 shrink-0" />
                    <span>Verify patient eligibility before resubmission</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3 text-green-600 mt-0.5 shrink-0" />
                    <span>Attach clinical notes for procedure justification</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3 text-green-600 mt-0.5 shrink-0" />
                    <span>Include X-rays if missing from original submission</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
            <CardContent>
              {claim.attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attachments</p>
              ) : (
                <div className="space-y-1">
                  {claim.attachments.map((att, i) => (
                    <div key={i} className="text-xs flex items-center gap-2 rounded bg-muted px-2 py-1.5">
                      <span>📎</span> {att}
                    </div>
                  ))}
                </div>
              )}
              <Button size="xs" variant="outline" className="mt-2 w-full">+ Add Attachment</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
