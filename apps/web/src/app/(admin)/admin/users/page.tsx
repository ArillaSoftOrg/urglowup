import { getAdminUsers } from "@/lib/queries/admin";
import { UserTable } from "@/components/admin/user-table";
import type { UserRole } from "@/generated/prisma/enums";
import type { LifecycleSegment } from "@/lib/admin/user-lifecycle";

export const metadata = { title: "Admin - Users" };

interface AdminUsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;

  const search = typeof params.search === "string" ? params.search : undefined;
  const roleFilter = typeof params.role === "string" ? (params.role as UserRole) : undefined;
  const lifecycle = typeof params.lifecycle === "string" ? (params.lifecycle as LifecycleSegment) : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 50;

  const result = await getAdminUsers({
    search,
    roleFilter,
    lifecycle,
    page,
    pageSize,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts, lifecycle, and engagement.
        </p>
      </div>

      <UserTable
        users={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
      />
    </div>
  );
}
