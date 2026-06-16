"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Stethoscope, Calendar, TrendingUp, ChevronRight, CalendarOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDoctorsStore } from "@/stores/doctorsStore";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";
import type { Doctor, DoctorStatus } from "@/types";

const STATUS_DOT: Record<DoctorStatus, string> = {
  Available: "bg-green-500",
  Busy: "bg-yellow-500",
  "On Leave": "bg-amber-500",
  "In Surgery": "bg-purple-500",
  "Off Duty": "bg-gray-400",
};

export default function DoctorAvailabilityPage() {
  const router = useRouter();
  const { doctors } = useDoctorsStore();
  const user = useAuthStore((s) => s.user);
  const isDentist = user?.role === "Dentist";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [clinicFilter, setClinicFilter] = useState("All");

  const clinics = useMemo(
    () => Array.from(new Set(doctors.flatMap((d) => d.clinicNames))).sort(),
    [doctors]
  );
  const specialties = useMemo(
    () => Array.from(new Set(doctors.flatMap((d) => d.specialties))).sort(),
    [doctors]
  );

  const visibleDoctors = useMemo(() => {
    if (!isDentist) return doctors;
    // Dentist role: view own schedule only
    return doctors.filter((d) => d.firstName === user?.firstName && d.lastName === user?.lastName);
  }, [doctors, isDentist, user]);

  const filtered = visibleDoctors.filter((d) => {
    const name = `${d.firstName} ${d.lastName}`.toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      d.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    const matchSpecialty = specialtyFilter === "All" || d.specialties.includes(specialtyFilter);
    const matchClinic = clinicFilter === "All" || d.clinicNames.includes(clinicFilter);
    return matchSearch && matchStatus && matchSpecialty && matchClinic;
  });

  const availableNow = doctors.filter((d) => d.status === "Available").length;
  const onLeave = doctors.filter((d) => d.status === "On Leave").length;
  const avgUtilization = doctors.length
    ? Math.round(doctors.reduce((s, d) => s + d.utilizationRate, 0) / doctors.length)
    : 0;
  const scheduleFull = doctors.filter((d) => d.slotsAvailableToday === 0 && d.status !== "On Leave" && d.status !== "Off Duty").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Stethoscope className="size-5 text-primary" /> Doctor Availability
          </h2>
          <p className="text-sm text-muted-foreground">
            {isDentist ? "Your schedule and availability" : `${doctors.length} doctors across all clinics`}
          </p>
        </div>
      </div>

      {!isDentist && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Doctors" value={doctors.length} icon={<Stethoscope className="size-4" />} />
          <KPICard title="Available Now" value={availableNow} description={`${doctors.length - availableNow} unavailable`} icon={<Calendar className="size-4" />} />
          <KPICard title="On Leave" value={onLeave} icon={<CalendarOff className="size-4" />} />
          <KPICard title="Avg Utilization" value={avgUtilization} suffix="%" trend={avgUtilization >= 75 ? 3 : -2} icon={<TrendingUp className="size-4" />} />
        </div>
      )}

      {!isDentist && scheduleFull > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 px-4 py-2.5 text-sm text-orange-700 dark:text-orange-400">
          <CalendarOff className="size-4 shrink-0" />
          <span><strong>{scheduleFull}</strong> doctor{scheduleFull > 1 ? "s" : ""} fully booked today — consider opening additional slots or redistributing appointments.</span>
        </div>
      )}

      {!isDentist && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctor or specialty..." className="pl-8 h-8" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="All">All Status</option>
            {(["Available", "Busy", "On Leave", "In Surgery", "Off Duty"] as DoctorStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} className="h-8 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="All">All Specialties</option>
            {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={clinicFilter} onChange={(e) => setClinicFilter(e.target.value)} className="h-8 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="All">All Clinics</option>
            {clinics.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <DoctorCard key={d.id} doctor={d} onClick={() => router.push(`/doctor-availability/${d.id}`)} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No doctors match the current filters.</p>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor, onClick }: { doctor: Doctor; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <img src={doctor.photo} alt={`${doctor.firstName} ${doctor.lastName}`} className="size-12 rounded-full bg-muted" />
            <span className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card ${STATUS_DOT[doctor.status]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm truncate">Dr. {doctor.firstName} {doctor.lastName}</p>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground truncate">{doctor.specialties[0]}{doctor.specialties.length > 1 ? ` +${doctor.specialties.length - 1}` : ""}</p>
            <div className="mt-1"><StatusBadge status={doctor.status} size="sm" /></div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 truncate">{doctor.clinicNames.join(" · ")}</p>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div>
            <p className="text-sm font-bold">{doctor.utilizationRate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Utilization</p>
          </div>
          <div>
            <p className="text-sm font-bold">{doctor.appointmentsToday}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Appts Today</p>
          </div>
          <div>
            <p className="text-sm font-bold text-green-600">{formatCurrency(doctor.revenueGenerated)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Revenue MTD</p>
          </div>
        </div>

        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-1.5 rounded-full ${doctor.utilizationRate >= 80 ? "bg-green-500" : doctor.utilizationRate >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${doctor.utilizationRate}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
