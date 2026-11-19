import { Bike, Compass, Clock3, LayoutDashboard, ListChecks, MessageSquare, Package, Settings2, ShieldCheck, ShoppingBag, UserRound, Users } from "lucide-react";
import type { ElementType } from "react";
import type { Role } from "../types";

export type WorkspaceSection = { id: string; label: string; title: string; description: string; icon: ElementType };
const navigation: Record<Role, { label: string; sections: WorkspaceSection[] }> = {
  customer: { label: "Student workspace", sections: [
    { id: "marketplace", label: "Browse", title: "Campus marketplace", description: "", icon: Compass },
    { id: "orders", label: "My orders", title: "My orders", description: "", icon: Package },
    { id: "profile", label: "Profile", title: "Your profile", description: "", icon: UserRound },
  ] },
  store: { label: "Entrepreneur workspace", sections: [
    { id: "orders", label: "Orders", title: "Shop orders", description: "Stay on top of incoming orders and get the next delivery ready.", icon: ListChecks },
    { id: "products", label: "Products", title: "Product catalog", description: "Keep your catalog fresh, your prices clear, and your customers in the loop.", icon: ShoppingBag },
    { id: "settings", label: "Shop settings", title: "Shop settings", description: "Update your storefront and let the campus know when you are open.", icon: Settings2 },
  ] },
  courier: { label: "Courier workspace", sections: [
    { id: "jobs", label: "Find jobs", title: "Available jobs", description: "Find a campus request, accept a delivery, and keep things moving.", icon: Bike },
    { id: "deliveries", label: "My deliveries", title: "My deliveries", description: "Your assigned deliveries, pickup details, and customer conversations.", icon: Package },
    { id: "history", label: "History", title: "Delivery history", description: "Look back at your completed deliveries and the work behind your earnings.", icon: Clock3 },
  ] },
  admin: { label: "Admin workspace", sections: [
    { id: "overview", label: "Overview", title: "Campus overview", description: "A clear view of your community, its businesses, and today’s deliveries.", icon: LayoutDashboard },
    { id: "orders", label: "Orders", title: "All orders", description: "Follow every request from the first order to the final handoff.", icon: Package },
    { id: "approvals", label: "Approvals", title: "Seller and courier approvals", description: "Review entrepreneur shops and couriers joining the community.", icon: ShieldCheck },
    { id: "reports", label: "Issues", title: "Reported issues", description: "Review reported issues and keep the service working for everyone.", icon: MessageSquare },
    { id: "people", label: "People", title: "Campus accounts", description: "Manage the students, entrepreneurs, and couriers in your community.", icon: Users },
  ] },
};

export function getWorkspaceNavigation(role: Role) { return navigation[role]; }
export function resolveWorkspaceSection(role: Role, section: string) {
  return navigation[role].sections.some((item) => item.id === section) ? section : navigation[role].sections[0].id;
}
