import { Link, useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { ldeaService } from "../../../services/ldeaService";
import { useRoles } from "../../../hooks/useRoles";
import { StatusBadge } from "../Seizures/SeizuresPage";
import { COUNTY_OPTIONS } from "../../../constants/counties"; // <--- ADDED

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
      { value: "pending",       label: "Pending at MOJ" },
      { value: "investigation", label: "Under investigation" },
      { value: "closed",        label: "Closed" },
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
  { value: "pending",       label: "Mark pending" },
  { value: "investigation", label: "Mark investigation" },
  { value: "closed",        label: "Mark closed" },
];

function formatDate(v) {
  if (!v) return null;
  const [y, m, d] = String(v).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return v;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

// Helper to grab only the first 3 words of the title
function getShortTitle(title) {
  if (!title) return "Untitled Case";
  const words = title.trim().split(/\s+/);
  if (words.length <= 3) return title;
  return words.slice(0, 3).join(" ") + "...";
}

export default function CasesPage() {
  const { canWrite } = useRoles();
  const navigate = useNavigate();

  const columns = [
    // 1. Case Info (Title on top, Case Number on bottom)
    {
      key: "case",
      label: "Case",
      width: "35%",
      render: (c) => (
        <Link
          to={`/cases/${c.id}`}
          onClick={(e) => e.stopPropagation()}
          className="group block min-w-0"
        >
          <p 
            className="truncate text-base font-semibold group-hover:text-primary"
            title={c.title}
          >
            {getShortTitle(c.title)}
          </p>
          <p className="mt-1 truncate font-mono text-xs text-base-content/60">
            {c.case_number}
          </p>
        </Link>
      ),
    },
    // 2. Charges & Substance
    {
      key: "details",
      label: "Charges / Substance",
      width: "30%",
      render: (c) => (
        <div className="text-sm leading-tight">
          <p className="truncate font-medium" title={c.charge}>{c.charge || "—"}</p>
          {c.substance && (
            <p className="truncate text-xs text-base-content/60" title={c.substance}>
              {c.substance}
            </p>
          )}
        </div>
      ),
    },
    // 3. Filed Date & County
    {
      key: "filing_date",
      label: "Filed / County",
      width: "15%",
      render: (c) => (
        <div className="text-sm leading-tight">
          <p className="font-medium">{formatDate(c.filing_date) || "—"}</p>
          {c.county && (
            <p className="text-xs text-base-content/60 mt-0.5">{c.county}</p>
          )}
        </div>
      ),
    },
    // 4. Status (Moved next to Actions)
    { 
      key: "status", 
      label: "Status", 
      width: "10%", 
      render: (c) => <StatusBadge status={c.status} /> 
    },
    // 5. Actions
    {
      key: "actions",
      label: "",
      width: "10%",
      align: "right",
      render: (c) =>
        canWrite && (
          <Link
            to={`/cases/${c.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="btn btn-ghost btn-xs text-primary"
            title="Edit case"
          >
            <Pencil className="size-4" />
          </Link>
        ),
    },
  ];

  return (
    <ResourceIndex
      resource={ldeaService.cases}
      title="Cases"
      subtitle="Case files, charges, and the people involved."
      columns={columns}
      filters={FILTERS} // <--- Passes the new County and Year filters
      newPath="/cases/new"
      newLabel="New case"
      canWrite={canWrite}
      ordering="-filing_date"
      emptyMessage="No cases have been filed yet."
      onRowClick={(c) => navigate(`/cases/${c.id}`)}
      selectable
      exportFilename={`Cases-${new Date().toISOString().slice(0, 10)}.csv`}
      bulkActions={
        canWrite
          ? ({ selectedIds, clear, reload }) =>
              BULK_STATUS_ACTIONS.map((a) => ({
                label: a.label,
                onClick: async () => {
                  await ldeaService.cases.bulk({
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