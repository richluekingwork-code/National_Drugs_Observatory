import { Link } from "react-router-dom";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { mohService } from "../../../services/mohService";
import { useRoles } from "../../../hooks/useRoles";

const FILTERS = [{
  key: "status", label: "All admissions",
  options: [
    { value: "admitted",   label: "Admitted" },
    { value: "waitlisted", label: "Waitlisted" },
    { value: "referred",   label: "Referred" },
    { value: "declined",   label: "Declined" },
    { value: "completed",  label: "Completed" },
  ],
}];

const STATUS_BADGE = {
  admitted:   "badge-info",
  waitlisted: "badge-warning",
  referred:   "badge-ghost",
  declined:   "badge-error",
  completed:  "badge-success",
};

export default function DemandReductionsPage() {
  const { canWrite } = useRoles();
  const columns = [
    { key: "persons", label: "Persons", render: (r) => (
      <Link to={`/moh/demand-reductions/${r.id}`} className="block min-w-0 hover:text-primary">
        <p className="truncate font-medium">
          {r.persons?.length
            ? r.persons.map((p) => `${p.first_name} ${p.last_name}`).join(", ")
            : `Record #${r.id}`}
        </p>
        <p className="truncate text-xs text-base-content/60">
          {r.treatment_facility || r.type_of_treatment || "—"}
        </p>
      </Link>
    )},
    { key: "type_of_treatment", label: "Treatment", render: (r) => r.type_of_treatment || "—" },
    { key: "county", label: "County", render: (r) => r.county || "—" },
    { key: "admission_status", label: "Status", render: (r) => (
      <span className={`badge badge-sm ${STATUS_BADGE[r.admission_status] ?? "badge-ghost"}`}>
        {r.admission_status || "—"}
      </span>
    )},
    { key: "created_at", label: "Logged", render: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <ResourceIndex
      resource={mohService.demandReductions}
      title="Demand reduction"
      subtitle="Treatment, referral, and harm-reduction interventions."
      columns={columns}
      filters={FILTERS}
      newPath="/moh/demand-reductions/new"
      canWrite={canWrite}
      ordering="-created_at"
      selectable
      exportFilename={`moh-demand-reductions-${new Date().toISOString().slice(0, 10)}.csv`}
      emptyMessage="No demand reduction records yet."
    />
  );
}