import { Link } from "react-router-dom";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { ldeaService } from "../../../services/ldeaService";
import { useRoles } from "../../../hooks/useRoles";
import { COUNTY_OPTIONS } from "../../../constants/counties"; // Make sure this path matches your project

const DEPENDENCY_BADGE = {
  low: "badge-success",
  moderate: "badge-warning",
  high: "badge-error",
};

export default function VictimHistoriesPage() {
  const { canWrite } = useRoles();

  // Generate years for the dropdown (Current year down to 10 years ago)
  const currentYear = new Date().getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
    const year = String(currentYear - i);
    return { value: year, label: year };
  });

  // Define the filters to pass to ResourceIndex
  const filters = [
    {
      key: "incident_county",
      label: "County",
      options: COUNTY_OPTIONS,
    },
    {
      key: "year",
      label: "Year",
      options: YEAR_OPTIONS,
    },
  ];

  const columns = [
    // ---------------- Victim (photo + name + id) ----------------
    {
      key: "victim",
      label: "Victim",
      render: (v) => (
        <Link to={`/victim-histories/${v.id}`} className="flex min-w-0 items-center gap-3 hover:text-primary">
          {v.photo ? (
            <img
              src={v.photo}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-base-300"
            />
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-semibold text-base-content/60">
              {(v.first_name?.[0] ?? "").toUpperCase()}
              {(v.last_name?.[0] ?? "").toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">
              {v.first_name} {v.last_name}
            </p>
            <p className="truncate text-xs text-base-content/60">
              {v.person_id?.slice(0, 8) ?? "—"}
            </p>
          </div>
        </Link>
      ),
    },

    // ---------------- Personal ----------------
    {
      key: "personal",
      label: "Personal",
      render: (v) => (
        <div className="text-xs leading-tight">
          <p>
            <span className="capitalize">{v.gender || "—"}</span>
            {v.age != null && (
              <span className="text-base-content/60"> · {v.age} yrs</span>
            )}
          </p>
          <p className="capitalize text-base-content/60">
            {v.marital_status || "—"}
          </p>
          <p className="text-base-content/60">{v.nationality || "—"}</p>
        </div>
      ),
    },

    // ---------------- Incident ----------------
    {
      key: "incident",
      label: "Incident",
      render: (v) => (
        <div className="text-sm leading-tight">
          <p className="font-medium">
            {v.incident_date || "—"}
            {v.incident_time && (
              <span className="text-base-content/60">
                {" · "}
                {v.incident_time.slice(0, 5)}
              </span>
            )}
          </p>
          {v.incident_county && (
            <p className="text-xs text-base-content/60">{v.incident_county}</p>
          )}
          {v.incident_location && (
            <p className="max-w-[180px] truncate text-xs text-base-content/60">
              {v.incident_location}
            </p>
          )}
        </div>
      ),
    },

    // ---------------- Substance ----------------
    {
      key: "substance",
      label: "Substance",
      render: (v) => (
        <div className="text-sm leading-tight">
          <p className="font-medium">{v.type_of_drug_used || "—"}</p>
          <p className="text-xs text-base-content/60">
            {v.primary_substance_user || "—"}
          </p>
          <p className="text-xs capitalize text-base-content/60">
            {v.frequency_of_use || "—"}
          </p>
          <p className="text-xs capitalize text-base-content/60">
            {v.method_of_use || "—"}
          </p>
        </div>
      ),
    },

    // ---------------- Substance use ----------------
    {
      key: "substance_use",
      label: "Substance use",
      render: (v) => (
        <div className="text-xs leading-tight">
          <p>
            <span className="text-base-content/60">Age first used:</span>{" "}
            <span className="font-medium">{v.age_first_used ?? "—"}</span>
          </p>
          <p>
            <span className="text-base-content/60">Years:</span>{" "}
            <span className="font-medium">
              {v.duration_of_addiction_years ?? "—"}
            </span>
          </p>
          <p>
            <span className="text-base-content/60">Last used:</span>{" "}
            <span className="font-medium">{v.last_used_date || "—"}</span>
          </p>
          <p className="mt-1">
            <span
              className={`badge badge-sm ${
                DEPENDENCY_BADGE[v.dependency_level] ?? "badge-ghost"
              }`}
            >
              {v.dependency_level || "Unknown"}
            </span>
          </p>
        </div>
      ),
    },

    // ---------------- Health ----------------
    {
      key: "health",
      label: "Health",
      render: (v) => (
        <div className="flex flex-col gap-1 text-xs">
          <span
            className={`badge badge-xs ${
              v.overdose_history ? "badge-error" : "badge-ghost"
            }`}
            title={
              v.overdose_history && v.overdose_count
                ? `${v.overdose_count} overdose(s)`
                : ""
            }
          >
            Overdose{v.overdose_history && v.overdose_count ? ` ×${v.overdose_count}` : ""}
          </span>
          <span
            className={`badge badge-xs ${
              v.mental_health_issues ? "badge-warning" : "badge-ghost"
            }`}
          >
            Mental health
          </span>
          <span
            className={`badge badge-xs ${
              v.rehab_history ? "badge-info" : "badge-ghost"
            }`}
          >
            Rehab
          </span>
        </div>
      ),
    },

    // ---------------- Actions ----------------
    {
      key: "actions",
      label: "Actions",
      render: (v) =>
        canWrite && (
          <Link
            to={`/victim-histories/${v.id}/edit`}
            className="btn btn-ghost btn-xs normal-case text-primary"
          >
            Edit
          </Link>
        ),
    },
  ];

  return (
    <ResourceIndex
      resource={ldeaService.victimHistories}
      title="Victim History"
      subtitle="Substance-use and health background records."
      columns={columns}
      filters={filters}        // <--- ADDED FILTERS HERE
      newPath="/victim-histories/new"
      newLabel="Add Victim History"
      canWrite={canWrite}
      ordering="-created_at"
      emptyMessage="No victim histories recorded yet."
      selectable
      exportFilename={`Victim-Histories-${new Date().toISOString().slice(0, 10)}.csv`}
    />
  );
}