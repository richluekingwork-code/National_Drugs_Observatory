import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { ldeaService } from "../../../services/ldeaService";
import { useRoles } from "../../../hooks/useRoles";

const FILTERS = [
  {
    key: "status",
    label: "All statuses",
    options: [
      { value: "stored",            label: "Stored" },
      { value: "used_for_analysis", label: "Analysis" },
      { value: "transferred",       label: "Transferred" },
      { value: "destroyed",         label: "Destroyed" },
    ],
  },
];

const BULK_STATUS_ACTIONS = [
  { value: "stored",            label: "Mark stored" },
  { value: "used_for_analysis", label: "Mark analysis" },
  { value: "transferred",       label: "Mark transferred" },
  { value: "destroyed",         label: "Mark destroyed" },
];

export default function SeizuresPage() {
  const { canWrite } = useRoles();

  const columns = [
    {
      key: "seizure",
      label: "Seizure",
      width: "30%",
      render: (s) => (
        <Link
          to={`/seizures/${s.id}`}
          className="flex items-center gap-3 min-w-0 hover:text-primary"
        >
          {s.photo ? (
            <img
              src={s.photo}
              alt=""
              className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-base-300"
            />
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-base-200 text-xs text-base-content/50">
              —
            </div>
          )}
          
          <div className="min-w-0">
            {/* THIS WILL NOW SHOW THE ACTUAL DRUG NAME */}
            <p className="truncate font-medium">
              {s.drug_type || "—"}
            </p>
            <p className="truncate text-xs text-base-content/60">
              {s.seizure_date} · {s.seized_by || "—"}
            </p>
          </div>
        </Link>
      ),
    },
    {
      key: "location",
      label: "Location",
      width: "20%",
      render: (s) => (
        <div className="text-sm">
          <p>{s.county || "—"}</p>
          {s.district && <p className="text-xs text-base-content/60">{s.district}</p>}
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      width: "15%",
      render: (s) =>
        s.quantity != null ? `${s.quantity} ${s.unit || ""}`.trim() : "—",
    },
    {
      key: "created_at",
      label: "Logged",
      width: "15%",
      render: (s) => new Date(s.created_at).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      width: "10%",
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      width: "10%",
      align: "right",
      render: (s) =>
        canWrite && (
          <Link
            to={`/seizures/${s.id}/edit`}
            className="btn btn-ghost btn-xs gap-1 normal-case text-primary"
          >
            <Pencil className="size-3.5" /> Edit
          </Link>
        ),
    },
  ];

  return (
     <ResourceIndex
      resource={ldeaService.seizures}
      title="Seizures"
      subtitle="Every recorded seizure in your institution."
      columns={columns}
      filters={FILTERS}
      newPath="/seizures/new"
      canWrite={canWrite}
      ordering="-seizure_date"
      emptyMessage="No seizures logged yet."
      selectable
      exportFilename={`seizures-${new Date().toISOString().slice(0, 10)}.csv`}
      bulkActions={
        canWrite
          ? ({ selectedIds, clear, reload }) =>
              BULK_STATUS_ACTIONS.map((a) => ({
                label: a.label,
                onClick: async () => {
                  await ldeaService.seizures.bulk({
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
  );
}

export function StatusBadge({ status }) {
  const map = {
    stored: "badge-info",
    used_for_analysis: "badge-warning",
    transferred: "badge-success",
    destroyed: "badge-error", // Red color
    
    detained: "badge-warning",
    released: "badge-ghost",
    pending: "badge-warning",
    investigation: "badge-info",
    closed: "badge-success",
    planned: "badge-ghost",
    ongoing: "badge-info",
    completed: "badge-success",
    cancelled: "badge-error",
  };

  const label = status?.replace(/_/g, " ") || "—";

  return (
    <span className={`badge badge-sm capitalize ${map[status] ?? "badge-ghost"}`}>
      {label}
    </span>
  );
}