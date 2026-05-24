import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const adminNav = [
  { title: "Dashboard", href: "/admin" },
  { title: "Businesses", href: "/admin/businesses" },
  { title: "Users", href: "/admin/users" },
  { title: "Appointments", href: "/admin/appointments" },
  { title: "Media", href: "/admin/media" },
  { title: "Reviews", href: "/admin/reviews" },
  { title: "Categories", href: "/admin/categories" },
  { title: "Style Tags", href: "/admin/style-tags" },
  { title: "Marketplace", href: "/admin/marketplace" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRole.ADMIN);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar p-4">
        <div className="mb-6 px-3 text-lg font-bold tracking-tight">
          Admin Panel
        </div>
        <SidebarNav items={adminNav} />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
