// src/components/worker/types.ts
export interface Shift {
  id: number;
  platform: string;
  shift_date: string;
  hours_worked: number;
  gross_earned: number;
  platform_deductions: number;
  net_received: number;
  verification_status: string;
}

export interface Summary {
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_hours: number;
  total_shifts: number;
  avg_hourly_rate: number;
}

export interface PlatformBreakdown {
  platform: string;
  shifts: number;
  total_hours: number;
  total_net: number;
  avg_hourly_rate: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  city: string;
}