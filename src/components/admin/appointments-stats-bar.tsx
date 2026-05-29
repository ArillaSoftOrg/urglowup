import { getAdminAppointmentStats } from "@/lib/queries/admin";

export async function AppointmentsStatsBar() {
  const stats = await getAdminAppointmentStats();

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-5">
      <div className="flex flex-col gap-1">
        <div className="text-sm text-slate-600">Pending</div>
        <div className="text-2xl font-semibold text-slate-900">{stats.pending}</div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm text-slate-600">Stuck (6h+)</div>
        <div className="text-2xl font-semibold text-orange-600">{stats.stuck6h}</div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm text-slate-600">Stuck (24h+)</div>
        <div className="text-2xl font-semibold text-red-600">{stats.stuck24h}</div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm text-slate-600">Confirmed</div>
        <div className="text-2xl font-semibold text-slate-900">{stats.confirmed}</div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-sm text-slate-600">No-show Rate (7d)</div>
        <div className="text-2xl font-semibold text-slate-900">{stats.noShowRate7d}%</div>
      </div>
    </div>
  );
}
