import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { ldeaService } from "../../../services/ldeaService";
import { useRoles } from "../../../hooks/useRoles";
import { StatusBadge } from "../Seizures/SeizuresPage";
import { COUNTY_OPTIONS } from "../../../constants/counties"; // <--- IMPORT ADDED

// Generate years for the dropdown (Current year down to 10 years ago)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const year = String(currentYear - i);
  return { value: year, label: year };
});

// ADDED: County and Year filters
const FILTERS = [
  {
    key: "status",
    label: "All statuses",
    options: [
      { value: "detained",    label: "Detained" },
      { value: "released",    label: "Released" },
      { value: "transferred", label: "Transferred to Court" },
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
  { value: "detained",    label: "Mark detained" },
  { value: "released",    label: "Mark released" },
  { value: "transferred", label: "Mark transferred" },
];

export default function ArrestsPage() {
  const { canWrite } = useRoles();

  const columns = [
    // 1. Arrestee Info with Image and Full Name
    {
      key: "arrest",
      label: "Arrestee",
      width: "28%",
      render: (a) => {
        // Main name (First, Middle, Last)
        const mainName = [a.first_name, a.middle_name, a.last_name]
          .filter(Boolean)
          .join(" ");

        return (
          <Link to={`/arrests/${a.id}`} className="flex items-center gap-3 min-w-0 hover:text-primary">
            {/* Image Avatar */}
            {a.photo ? (
              <img
                src={a.photo}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-base-300"
              />
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-semibold text-base-content/60">
                {(a.first_name?.[0] ?? "").toUpperCase()}
                {(a.last_name?.[0] ?? "").toUpperCase()}
              </div>
            )}
            
            <div className="min-w-0">
              {/* Main Name */}
              <p className="truncate text-base font-semibold">
                {mainName || "Unknown Name"}
              </p>
              
              {/* Other Name (Alias) */}
              {a.other_name && (
                <p className="truncate text-xs italic text-base-content/70">
                  Alias: {a.other_name}
                </p>
              )}
              
              {/* Arrest Number & Date */}
              <p className="truncate text-xs text-base-content/60">
                {a.arrests_number} · {a.arrest_date}
              </p>
            </div>
          </Link>
        );
      },
    },
    
    // 2. Location
    {
      key: "location",
      label: "Location",
      width: "15%",
      render: (a) => (
        <div className="text-sm">
          <p className="font-medium">{a.county_of_arrests || "—"}</p>
          {a.district_of_arrests && (
            <p className="text-xs text-base-content/60">{a.district_of_arrests}</p>
          )}
        </div>
      ),
    },
    
    // 3. Substance
    {
      key: "substance",
      label: "Substance",
      width: "15%",
      render: (a) => (
        <div className="text-sm">
          <p className="font-medium">{a.drug_type || "—"}</p>
          {a.quantity != null && (
            <p className="text-xs text-base-content/60">
              {a.quantity} {a.unit || ""}
            </p>
          )}
        </div>
      ),
    },
    
    // 4. Officer
    {
      key: "officer",
      label: "Officer",
      width: "15%",
      render: (a) => (
        <div className="text-sm">
          <p>{a.arresting_officer || "—"}</p>
          <p className="text-xs text-base-content/60">{a.badge_number}</p>
        </div>
      ),
    },
    
    // 5. Charges
    {
      key: "charges",
      label: "Charges",
      width: "12%",
      render: (a) => (
        <span className="line-clamp-2 text-sm text-base-content/70">
          {a.charges || "—"}
        </span>
      ),
    },
    
    // 6. Status
    {
      key: "status",
      label: "Status",
      width: "10%",
      render: (a) => <StatusBadge status={a.status} />,
    },
    
    // 7. Actions
    {
      key: "actions",
      label: "Actions",
      width: "5%",
      align: "right",
      render: (a) =>
        canWrite && (
          <Link
            to={`/arrests/${a.id}/edit`}
            className="btn btn-ghost btn-xs text-primary"
          >
            <Pencil className="size-4" />
          </Link>
        ),
    },
  ];

  return (
    <ResourceIndex
      resource={ldeaService.arrests}
      title="Arrests"
      subtitle="Arrests recorded by your institution."
      columns={columns}
      filters={FILTERS} // <--- Passes the new filters to the toolbar
      newPath="/arrests/new"
      canWrite={canWrite}
      ordering="-arrest_date"
      emptyMessage="No arrests logged yet."
      selectable
      exportFilename={`Arrests-${new Date().toISOString().slice(0, 10)}.csv`}
      bulkActions={
        canWrite
          ? ({ selectedIds, clear, reload }) =>
              BULK_STATUS_ACTIONS.map((a) => ({
                label: a.label,
                onClick: async () => {
                  await ldeaService.arrests.bulk({
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