import { Link } from "react-router-dom";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { mohService } from "../../../services/mohService";
import { useRoles } from "../../../hooks/useRoles";

const FILTERS = [
  { key: "status", label: "All statuses", options: [
    { value: "active",    label: "Active" },
    { value: "inactive",  label: "Inactive" },
    { value: "suspended", label: "Suspended" },
    { value: "closed",    label: "Closed" },
  ]},
];

const STATUS_BADGE = {
  active:    "badge-success",
  inactive:  "badge-ghost",
  suspended: "badge-warning",
  closed:    "badge-error",
};

export default function FacilitiesPage() {
  const { canWrite } = useRoles();
  const columns = [
    { key: "facility", label: "Facility", render: (f) => (
      <Link to={`/moh/facilities/${f.id}`} className="block min-w-0 hover:text-primary">
        <p className="truncate font-medium">{f.facility_name}</p>
        <p className="truncate text-xs text-base-content/60">
          {f.facility_code} · {f.facility_type}
        </p>
      </Link>
    )},
    { key: "county", label: "County", render: (f) => f.county },
    { key: "ownership_type", label: "Ownership", render: (f) => f.ownership_type },
    { key: "capacity", label: "Beds", render: (f) => (
      <span className="tabular-nums">
        {f.current_occupancy} / {f.total_beds}
      </span>
    )},
    { key: "status", label: "Status", render: (f) => (
      <span className={`badge badge-sm ${STATUS_BADGE[f.operational_status] ?? "badge-ghost"}`}>
        {f.operational_status}
      </span>
    )},
  ];

  return (
    <ResourceIndex
      resource={mohService.facilities}
      title="Treatment facilities"
      subtitle="Licensed and unlicensed treatment facilities in the network."
      columns={columns}
      filters={FILTERS}
      newPath="/moh/facilities/new"
      canWrite={canWrite}
      ordering="facility_name"
      selectable
      exportFilename={`moh-facilities-${new Date().toISOString().slice(0, 10)}.csv`}
      emptyMessage="No treatment facilities recorded yet."
    />
  );
}