import type { Metadata } from "next";
import { requireAdminMfa } from "@/lib/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobots,
};

const adminNav = [
  { title: "Kontrol Paneli", href: "/admin" },
  { title: "Moderasyon", href: "/admin/moderation" },
  { title: "İşletmeler", href: "/admin/businesses" },
  { title: "Kullanıcılar", href: "/admin/users" },
  { title: "Randevular", href: "/admin/appointments" },
  { title: "Kampanyalar", href: "/admin/campaigns" },
  { title: "Medya", href: "/admin/media" },
  { title: "Yorumlar", href: "/admin/reviews" },
  { title: "Kategoriler", href: "/admin/categories" },
  { title: "Stil Etiketleri", href: "/admin/style-tags" },
  { title: "Gönderiler", href: "/admin/posts" },
  { title: "Marketplace", href: "/admin/marketplace" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminMfa();

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar p-4">
        <div className="mb-6 px-3 text-lg font-bold tracking-tight">
          Admin Panel
        </div>
        <SidebarNav
          items={adminNav}
          mobileTitle="Admin Paneli"
          mobileLabel="Admin menüsü"
        />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
