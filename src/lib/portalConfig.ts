import type { Role } from "../types";

export type PortalConfig = {
  role: Role;
  label: string;
  path: string;
  audience: string;
  title: string;
  subtitle: string;
  primaryAction: string;
};

export const roleOrder: Role[] = ["customer", "courier", "store", "admin"];

export const portalConfigs: PortalConfig[] = [
  {
    role: "customer",
    label: "Student Portal",
    path: "/student",
    audience: "Students, faculty, and staff",
    title: "Order around campus without leaving your building",
    subtitle: "Food, printing, errands, and student marketplace requests in one clear flow.",
    primaryAction: "Request delivery"
  },
  {
    role: "courier",
    label: "Courier Portal",
    path: "/courier",
    audience: "Verified delivery partners",
    title: "Accept campus jobs and update delivery progress",
    subtitle: "A focused rider workspace for availability, active jobs, route details, and earnings.",
    primaryAction: "View available jobs"
  },
  {
    role: "store",
    label: "Entrepreneur Portal",
    path: "/entrepreneur",
    audience: "Campus stores and student sellers",
    title: "Manage orders, products, and sales from one counter",
    subtitle: "A practical view for order preparation, marketplace visibility, and daily revenue.",
    primaryAction: "Manage queue"
  },
  {
    role: "admin",
    label: "Admin Portal",
    path: "/admin",
    audience: "BukSU management",
    title: "Monitor deliveries, users, couriers, stores, and fees",
    subtitle: "A command dashboard for approvals, service quality, financials, and active orders.",
    primaryAction: "Open operations"
  }
];

export function getPortalConfig(role: Role): PortalConfig {
  return portalConfigs.find((portal) => portal.role === role) ?? portalConfigs[0];
}
