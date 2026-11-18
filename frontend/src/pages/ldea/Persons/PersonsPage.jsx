import { Link } from "react-router-dom";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { ldeaService } from "../../../services/ldeaService";
import { useRoles } from "../../../hooks/useRoles";

const COUNTY_OPTIONS = [
  { value: "Bomi",             label: "Bomi" },
  { value: "Bong",             label: "Bong" },
  { value: "Gbarpolu",         label: "Gbarpolu" },
  { value: "Grand Bassa",      label: "Grand Bassa" },
  { value: "Grand Cape Mount", label: "Grand Cape Mount" },
  { value: "Grand Gedeh",      label: "Grand Gedeh" },
  { value: "Grand Kru",        label: "Grand Kru" },
  { value: "Lofa",             label: "Lofa" },
  { value: "Margibi",          label: "Margibi" },
  { value: "Maryland",         label: "Maryland" },
  { value: "Montserrado",      label: "Montserrado" },
  { value: "Nimba",            label: "Nimba" },
  { value: "Rivercess",        label: "Rivercess" },
  { value: "River Gee",        label: "River Gee" },
  { value: "Sinoe",            label: "Sinoe" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const year = currentYear - i;
  return { value: year.toString(), label: year.toString() };
});

const FILTERS = [
  {
    key: "role",
    label: "All roles",
    options: [
      { value: "suspect", label: "Suspect" },
      { value: "victim",  label: "Victim" },
      { value: "witness", label: "Witness" },
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

const ROLE_BADGE = {
  suspect: "badge-warning",
  victim:  "badge-info",
  witness: "badge-ghost",
};

export default function PersonsPage() {
  const { canWrite } = useRoles();

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (p) => (
        <Link
          to={`/persons/${p.id}`}
          className="flex items-center gap-3 hover:text-primary"
        >
          {p.photo ? (
            <img
              src={p.photo}
              alt=""
              className="size-9 rounded-full border border-base-300 object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-base-200 text-xs font-medium text-base-content/60"
            >
              {initials(p)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {[p.first_name, p.last_name].filter(Boolean).join(" ")}
            </span>
            <span className="block truncate text-xs text-base-content/60">
              {p.person_id?.slice(0, 8) ?? "—"}
            </span>
          </span>
        </Link>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (p) => (
        <span className={`badge badge-sm ${ROLE_BADGE[p.role] ?? "badge-ghost"}`}>
          {p.role}
        </span>
      ),
    },
    { key: "gender",  label: "Gender",  render: (p) => p.gender || "—" },
    { key: "age",     label: "Age",     render: (p) => p.age || "—" },
    { key: "county",  label: "County",  render: (p) => p.county || "—" },
    {
      key: "created_at",
      label: "Registered",
      render: (p) => new Date(p.created_at).toLocaleDateString(),
    },
    { key: "county", label: "County", render: (s) => s.county, csv: (s) => s.county },
    
    // Action column at the VERY END
    {
      key: "actions",
      label: "Actions",
      render: (p) => {
        if (!canWrite) return null;

        if (p.role === "suspect") {
          if (!p.has_arrests) {
            return (
              <Link
                to={`/arrests/new?person_id=${p.id}`}
                className="btn btn-outline btn-xs rounded-md text-error hover:bg-error hover:text-error-content normal-case"
              >
                Add Arrest History
              </Link>
            );
          }
          return <span className="text-xs text-base-content/40 italic">Arrest on file</span>;
        }

        if (p.role === "victim") {
          if (!p.has_victim_history) {
            return (
              <Link
                to={`/victim-histories/new?person_id=${p.id}`}
                className="btn btn-outline btn-xs rounded-md text-warning hover:bg-warning hover:text-warning-content normal-case"
              >
                Add Victim History
              </Link>
            );
          }
          return <span className="text-xs text-base-content/40 italic">History on file</span>;
        }

        return null;
      },
    },
  ];

  return (
    <ResourceIndex
      resource={ldeaService.persons}
      title="Persons"
      subtitle="Every individual in your institution's records."
      columns={columns}
      filters={FILTERS}
      newPath="/persons/new"
      canWrite={canWrite}
      ordering="-created_at"
      emptyMessage="No persons registered yet."
      selectable
      exportFilename={`Persons-${new Date().toISOString().slice(0, 10)}.csv`}
    />
  );
}

function initials(p) {
  return [p.first_name, p.last_name]
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .toUpperCase() || "?";
}