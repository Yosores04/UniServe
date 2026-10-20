import { Bike, Clock3, LayoutDashboard, ListChecks, MessageSquare, Package, Settings2, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import type { ElementType } from "react";
import type { Role } from "../types";

export type WorkspaceSection = { id: string; label: string; title: string; description: string; icon: ElementType };
const navigation: Record<Role, { label: string; sections: WorkspaceSection[] }> = {
  customer: { label: "Student workspace", sections: [
    { id: "marketplace", label: "Marketplace", title: "A little closer to campus.", description: "Discover student businesses, everyday essentials, and campus services.", icon: ShoppingBag },
    { id: "orders", label: "My orders", title: "Your orders, all together.", description: "Follow your deliveries, message your courier, and revisit past favorites.", icon: Package },
  ] },
  store: { label: "Entrepreneur workspace", sections: [
    { id: "orders", label: "Orders", title: "Your shop, at a glance.", description: "Stay on top of incoming orders and get the next delivery ready.", icon: ListChecks },
    { id: "products", label: "Products", title: "Make something worth finding.", description: "Keep your catalog fresh, your prices clear, and your customers in the loop.", icon: ShoppingBag },
    { id: "settings", label: "Shop settings", title: "The details behind your shop.", description: "Update your storefront and let the campus know when you are open.", icon: Settings2 },
  ] },
  courier: { label: "Courier workspace", sections: [
    { id: "jobs", label: "Job board", title: "Your next stop starts here.", description: "Find a campus request, accept a delivery, and keep things moving.", icon: Bike },
    { id: "deliveries", label: "My deliveries", title: "On your way.", description: "Your assigned deliveries, pickup details, and customer conversations.", icon: Package },
    { id: "history", label: "History", title: "Every delivery adds up.", description: "Look back at your completed deliveries and the work behind your earnings.", icon: Clock3 },
  ] },
  admin: { label: "Admin workspace", sections: [
    { id: "overview", label: "Overview", title: "A campus in motion.", description: "A clear view of your community, its businesses, and today’s deliveries.", icon: LayoutDashboard },
    { id: "orders", label: "Orders", title: "Keep campus moving.", description: "Follow every request from the first order to the final handoff.", icon: Package },
    { id: "approvals", label: "Approvals", title: "Meet the next campus partners.", description: "Review entrepreneur shops and couriers joining the community.", icon: ShieldCheck },
    { id: "reports", label: "Reports", title: "A little help goes a long way.", description: "Review reported issues and keep the service working for everyone.", icon: MessageSquare },
    { id: "people", label: "People", title: "The people behind UniServe.", description: "Manage the students, entrepreneurs, and couriers in your community.", icon: Users },
  ] },
};

export function getWorkspaceNavigation(role: Role) { return navigation[role]; }
export function resolveWorkspaceSection(role: Role, section: string) {
  return navigation[role].sections.some((item) => item.id === section) ? section : navigation[role].sections[0].id;
}
