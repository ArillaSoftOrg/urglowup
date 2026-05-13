import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const accountNav = [
  { title: "Overview", href: "/account" },
  { title: "Profile", href: "/account/profile" },
  { title: "Appointments", href: "/account/appointments" },
  { title: "Favorites", href: "/account/favorites" },
  { title: "Reviews", href: "/account/reviews" },
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
