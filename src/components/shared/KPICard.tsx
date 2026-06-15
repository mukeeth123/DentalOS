"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  animate?: boolean;
  format?: "number" | "currency" | "percent" | "string";
}

function useCountUp(target: number, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || typeof target !== "number") return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, enabled]);
  return count;
}

export function KPICard({
  title,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendLabel,
  description,
  icon,
  className,
  animate = true,
  format = "number",
}: KPICardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
  const animated = useCountUp(numericValue, 1200, animate && typeof value === "number");

  const displayValue =
    typeof value === "string"
      ? value
      : format === "currency"
      ? `$${animated.toLocaleString()}`
      : format === "percent"
      ? `${animated}%`
      : animated.toLocaleString();

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("", className)}
    >
      <Card className="h-full">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {icon && <div className="text-primary/70 shrink-0">{icon}</div>}
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {prefix}{displayValue}{suffix}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-1.5 py-0.5",
                  trendPositive && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  trendNegative && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  trend === 0 && "bg-muted text-muted-foreground"
                )}
              >
                {trendPositive ? <TrendingUp className="size-3" /> : trendNegative ? <TrendingDown className="size-3" /> : null}
                {trendPositive ? "+" : ""}{trend}%
              </span>
            )}
            {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
          </div>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
