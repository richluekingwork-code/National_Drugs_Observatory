import { useCallback } from "react";
import {
  ShieldCheck,
  Monitor,
  Smartphone,
  Search,
  RefreshCw,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";

// Translates raw user agent into readable device info
function parseDevice(uaString) {
  if (!uaString) return { text: "Unknown", isMobile: false };
  const ua = uaString.toLowerCase();

  let browser = "Browser";
  if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";

  let os = "Unknown OS";
  if (ua.includes("win")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("like mac") && ua.includes("mobile")) os = "iOS";

  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  return { text: `${browser} on ${os}`, isMobile };
}

const ACTION_BADGES = {
  login: "badge-success",
  logout: "badge-ghost",
  login_failed: "badge-error",
};

export default function AuditLogPage() {
  const fetcher = useCallback(
    ({ page, search }) => adminService.listAuditLogs({ page, search }),
    [],
  );

  const { page, setPage, search, setSearch, data, loading, error, reload } =
    usePaginatedResource(fetcher);
  const rows = data?.results ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Security Audit Log
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            System-wide tracking of who logged in, from where, and on what
            device.
          </p>
        </div>
        <button
          onClick={reload}
          className="btn btn-ghost btn-sm normal-case gap-2"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />{" "}
          Refresh
        </button>
      </header>

      <label className="relative block max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
        <input
          type="search"
          placeholder="Search by user, IP, or device..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input input-bordered h-10 w-full pl-9 text-sm"
        />
      </label>

      {error && (
        <div className="alert alert-error">
          <span>
            Failed to load logs. Make sure you are logged in as a Superuser.
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-base-300 bg-base-200/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-base-content/60">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-base-content/60">
                  Action
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-base-content/60">
                  IP Address
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-base-content/60">
                  Device
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-base-content/60">
                  Location
                </th>{" "}
                {/* <-- NEW COLUMN */}
                <th className="px-5 py-3 text-left text-xs font-semibold text-base-content/60">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300/70">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <span className="loading loading-spinner" />
                  </td>
                </tr> // <-- colSpan 6
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-base-content/50"
                  >
                    No activity logs found.
                  </td>
                </tr> // <-- colSpan 6
              )}
              {!loading &&
                rows.map((log) => {
                  const device = parseDevice(log.device_info);
                  const date = new Date(log.timestamp);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-base-200/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-base-content">
                          {log.full_name || log.username || "Unknown User"}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {log.username || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`badge badge-sm ${ACTION_BADGES[log.action] ?? "badge-ghost"}`}
                        >
                          {log.action.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-base-content/80">
                        {log.ip_address || "Unknown"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 text-xs text-base-content/80">
                          {device.isMobile ? (
                            <Smartphone className="size-3.5" />
                          ) : (
                            <Monitor className="size-3.5" />
                          )}
                          {device.text}
                        </div>
                      </td>

                      {/* NEW LOCATION COLUMN */}
                      <td className="px-5 py-3.5 text-xs text-base-content/80">
                        {log.location || "—"}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-base-content/60">
                        <p>{date.toLocaleDateString()}</p>
                        <p>{date.toLocaleTimeString()}</p>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center border-t border-base-300 bg-base-200/30 px-5 py-3">
          <button
            disabled={!data?.previous || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn btn-sm btn-outline"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-base-content/70">
            Page {page}
          </span>
          <button
            disabled={!data?.next || loading}
            onClick={() => setPage((p) => p + 1)}
            className="btn btn-sm btn-outline"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
