import { getAdminBusinessMetrics } from "@/lib/queries/admin";

export async function BusinessAppointmentMetrics() {
  const metrics = await getAdminBusinessMetrics();

  if (metrics.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-slate-600">No businesses with recent appointments.</p>
      </div>
    );
  }

  function getRiskBorder(metric: (typeof metrics)[0]): string {
    if (metric.rejectionRate > 30 || metric.noShowRate > 20 || metric.avgResponseHours > 24) {
      return "border-l-4 border-l-red-500";
    }
    if (metric.avgResponseHours > 6) {
      return "border-l-4 border-l-orange-500";
    }
    return "border-l-4 border-l-slate-200";
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Business</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-900">Pending</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-900">Confirmed</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-900">Rejected</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-900">Acceptance Rate</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-900">Rejection Rate</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-900">Avg Response Time</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-900">No-show Rate</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.businessId} className={`border-b border-slate-100 hover:bg-slate-50 ${getRiskBorder(metric)}`}>
              <td className="px-4 py-3">
                <a
                  href={`/b/${metric.businessSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  {metric.businessName}
                </a>
              </td>

              <td className="px-4 py-3 text-center">
                {metric.pending > 0 && (
                  <span className="inline-block rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                    {metric.pending}
                  </span>
                )}
              </td>

              <td className="px-4 py-3 text-center font-medium text-slate-900">{metric.confirmed}</td>

              <td className="px-4 py-3 text-center font-medium text-slate-900">{metric.rejected}</td>

              <td className="px-4 py-3 text-center">
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  metric.acceptanceRate >= 70
                    ? "bg-green-100 text-green-800"
                    : metric.acceptanceRate >= 50
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}>
                  {metric.acceptanceRate}%
                </span>
              </td>

              <td className="px-4 py-3 text-center">
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  metric.rejectionRate > 30
                    ? "bg-red-100 text-red-800"
                    : metric.rejectionRate > 15
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }`}>
                  {metric.rejectionRate}%
                </span>
              </td>

              <td className="px-4 py-3 text-center">
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  metric.avgResponseHours > 24
                    ? "bg-red-100 text-red-800"
                    : metric.avgResponseHours > 6
                      ? "bg-orange-100 text-orange-800"
                      : "bg-green-100 text-green-800"
                }`}>
                  {metric.avgResponseHours}h
                </span>
              </td>

              <td className="px-4 py-3 text-center">
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  metric.noShowRate > 20
                    ? "bg-red-100 text-red-800"
                    : metric.noShowRate > 10
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }`}>
                  {metric.noShowRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
