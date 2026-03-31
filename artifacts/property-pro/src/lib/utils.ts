import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'resolved':
    case 'occupied':
    case 'success':
      return 'bg-success/20 text-success border-success/30';
    case 'pending':
    case 'in_progress':
    case 'maintenance':
    case 'warning':
      return 'bg-warning/20 text-warning border-warning/30';
    case 'failed':
    case 'cancelled':
    case 'terminated':
    case 'error':
      return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'vacant':
    case 'info':
    default:
      return 'bg-primary/20 text-primary border-primary/30';
  }
}
