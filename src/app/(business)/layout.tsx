import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const businessNav = [
  { title: "Dashboard", href: "/business/dashboard" },
  { title: "Appointments", href: "/business/appointments" },
  { title: "Services", href: "/business/services" },
  { title: "Media", href: "/business/media" },
  { title: "Profile", href: "/business/profile" },
  { title: "Working Hours", href: "/business/hours" },
  { title: "Reviews", href: "/business/reviews" },
  { title: "Customers", href: "/business/customers" },
  { title: "Public Link", href: "/business/public-link" },
  { title: "Integrations", href: "/business/integrations" },
  { title: "Settings", href: "/business/settings" },
];

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRole.BUSINESS_OWNER);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar p-4">
        <div className="mb-6 px-3 text-lg font-bold tracking-tight">
          UrGlowUp
        </div>
        <SidebarNav items={businessNav} />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
