import { getAdminUsers } from "@/lib/queries/admin";
import { UserTable } from "@/components/admin/user-table";

export const metadata = { title: "Admin - Users" };

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts and roles.
        </p>
      </div>

      <UserTable users={users} />
    </div>
  );
}
