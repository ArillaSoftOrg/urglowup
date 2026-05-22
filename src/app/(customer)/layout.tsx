import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const accountNav = [
  { title: "Genel Bakış", href: "/account" },
  { title: "Profil", href: "/account/profile" },
  { title: "Randevularım", href: "/account/appointments" },
  { title: "Favorilerim", href: "/account/favorites" },
  { title: "Yorumlarım", href: "/account/reviews" },
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <Navbar />
      <div className="container mx-auto flex-1 px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-56 shrink-0">
            <SidebarNav items={accountNav} />
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}
