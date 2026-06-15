import { cn } from "@/lib/utils";

type StatusType =
  | "Scheduled" | "Confirmed" | "In Progress" | "Completed" | "Cancelled" | "No Show"
  | "Draft" | "Submitted" | "Pending" | "Approved" | "Denied" | "Appealed" | "Paid"
  | "Active" | "Inactive" | "On Leave"
  | "Outstanding" | "Partial" | "Overdue"
  | "Low" | "Medium" | "High"
  | "connected" | "disconnected" | "error"
  | string;

const STATUS_STYLES: Record<string, string> = {
  // Appointment
  Scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "In Progress": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  "No Show": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  // Claims
  Draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Denied: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Appealed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  // Staff
  Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Inactive: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  "On Leave": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  // Invoice
  Outstanding: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Partial: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  Overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Risk
  Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Integration
  connected: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  disconnected: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: "sm" | "default";
}

export function StatusBadge({ status, className, size = "default" }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium capitalize",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs",
        styles,
        className
      )}
    >
      {status}
    </span>
  );
}
