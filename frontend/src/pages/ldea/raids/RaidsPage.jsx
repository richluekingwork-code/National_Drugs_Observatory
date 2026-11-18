import { useState } from "react";
import { Link } from "react-router-dom";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { ldeaService } from "../../../services/ldeaService";
import { useRoles } from "../../../hooks/useRoles";
import { X } from "lucide-react";
import { COUNTY_OPTIONS } from "../../../constants/counties";

export default function RaidsPage() {
  const { canWrite } = useRoles();
  const [selectedRaid, setSelectedRaid] = useState(null);

  // Generate years for the dropdown (Current year down to 10 years ago)
  const currentYear = new Date().getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
    const year = String(currentYear - i);
    return { value: year, label: year };
  });

  const FILTERS = [
    {
      key: "status",
      label: "All statuses",
      options: [
        { value: "planned",   label: "Planned" },
        { value: "ongoing",   label: "Ongoing" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "county",
      label: "All counties",
      options: COUNTY_OPTIONS,
    },
    {
      key: "year",
      label: "All years",
      options: YEAR_OPTIONS,
    },
  ];

  const BULK_STATUS_ACTIONS = [
    { value: "planned",   label: "Mark planned" },
    { value: "ongoing",   label: "Mark ongoing" },
    { value: "completed", label: "Mark completed" },
    { value: "cancelled", label: "Mark cancelled" },
  ];

  const columns = [
    {
      key: "raid",
      label: "Raid",
      width: "30%",
      render: (r) => (
        <div className="min-w-0 py-1">
          {/* Reduced title size */}
          <p className="truncate text-sm font-semibold">{r.title}</p>
          <p className="truncate text-xs text-base-content/60">
            {r.reference_code}
          </p>
          <p className="text-xs text-base-content/70 mt-1">
            {r.raid_date} {r.raid_time ? `· ${r.raid_time.slice(0, 5)}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      width: "25%",
      render: (r) => (
        <div className="text-xs leading-tight space-y-0.5 py-1">
          {/* Reduced County and City sizes */}
          <p className="text-sm font-medium">{r.county || "—"}</p>
          <p className="text-xs text-base-content/80">{r.city || "—"}</p>
          <p className="truncate text-xs text-base-content/60" title={r.location}>
            {r.location || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "details",
      label: "Raid Action",
      width: "30%",
      render: (r) => (
        <div className="text-xs leading-relaxed py-1">
          <p className="mb-1">
            <span className="text-base-content/60">Lead Officer:</span> {r.lead_officer || "—"}
          </p>
          <p>
            <span className="text-base-content/60">Arrests:</span> {r.total_arrests} 
            <span className="mx-2 text-base-content/30">|</span>
            <span className="text-base-content/60">Seizures:</span> {r.total_seizures}
          </p>
          <p className="mt-2">
            <span
              className={`badge badge-sm capitalize font-medium ${
                r.status === "completed"
                  ? "badge-success"
                  : r.status === "ongoing"
                  ? "badge-warning"
                  : r.status === "cancelled"
                  ? "badge-error"
                  : "badge-ghost"
              }`}
            >
              {r.status}
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "15%",
      align: "right",
      render: (r) =>
        canWrite && (
          <Link
            to={`/raids/${r.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="btn btn-ghost btn-xs normal-case text-primary"
          >
            Edit
          </Link>
        ),
    },
  ];

  return (
    <>
      <ResourceIndex
        resource={ldeaService.drugRaids}
        title="Drug raids"
        subtitle="Coordinated operations across your institution."
        columns={columns}
        filters={FILTERS}
        newPath="/raids/new"
        newLabel="Log raid"
        canWrite={canWrite}
        ordering="-raid_date"
        emptyMessage="No raids planned yet."
        selectable
        exportFilename={`Drug-Raids-${new Date().toISOString().slice(0, 10)}.csv`}
        onRowClick={(r) => setSelectedRaid(r)}
        bulkActions={
          canWrite
            ? ({ selectedIds, clear, reload }) =>
                BULK_STATUS_ACTIONS.map((a) => ({
                  label: a.label,
                  onClick: async () => {
                    await ldeaService.drugRaids.bulk({
                      action: "set_status",
                      ids: [...selectedIds],
                      status: a.value,
                    });
                    clear();
                    reload();
                  },
                }))
            : null
        }
      />

      {selectedRaid && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-base-content/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedRaid(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl bg-base-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
              <div>
                {/* Reduced Modal Title size */}
                <h2 className="text-lg font-semibold">{selectedRaid.title}</h2>
                <p className="text-xs text-base-content/60">{selectedRaid.reference_code}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRaid(null)}
                className="grid size-8 place-items-center rounded-full hover:bg-base-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
                  Team Members
                </h3>
                {/* Reduced Modal text size */}
                <p className="mt-1 text-sm">
                  {selectedRaid.team_members || "None assigned."}
                </p>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
                  Description
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-base-content/80">
                  {selectedRaid.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-base-300 bg-base-200/50 px-5 py-3">
              <button
                type="button"
                onClick={() => setSelectedRaid(null)}
                className="btn btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}