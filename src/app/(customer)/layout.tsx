import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { AccountMobileNav } from "@/components/account/account-mobile-nav";
import { AccountSidebarNav } from "@/components/account/account-sidebar-nav";

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
        <div className="md:hidden mb-4 flex items-center gap-2">
          <AccountMobileNav />
          <span className="text-sm font-medium text-muted-foreground">Hesabım</span>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="hidden md:block w-56 shrink-0">
            <AccountSidebarNav />
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}
