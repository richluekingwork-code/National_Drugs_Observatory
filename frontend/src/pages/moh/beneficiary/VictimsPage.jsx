import { Link } from "react-router-dom";
import { Plus, Check } from "lucide-react"; 
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { mohService } from "../../../services/mohService";
import { COUNTY_OPTIONS } from "../../../constants/counties";

const DEPENDENCY_BADGE = {
  low: "badge-success",
  moderate: "badge-warning",
  high: "badge-error",
};

export default function MOHBeneficiaryPage() {
  const currentYear = new Date().getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
    const year = String(currentYear - i);
    return { value: year, label: year };
  });

  const FILTERS = [
    { key: "county_resident", label: "Resident County", options: COUNTY_OPTIONS },
    { key: "gender", label: "Gender", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
    { key: "year", label: "Year", options: YEAR_OPTIONS },
  ];

  const columns = [
    {
      key: "victim",
      label: "Beneficiary",
      width: "35%",
      render: (v) => {
        const targetUrl = v.latest_demand_reduction_id 
          ? `/moh/demand-reductions/${v.latest_demand_reduction_id}` 
          : `/moh/beneficiaries/${v.id}`;

        return (
          <Link 
            to={targetUrl} 
            className="flex items-center gap-3 min-w-0 hover:text-primary transition-colors"
            title={v.latest_demand_reduction_id ? "View Demand Reduction" : "View Beneficiary Profile"}
          >
            {v.photo ? (
              <img src={v.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-base-300"/>
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-semibold text-base-content/60">
                {(v.first_name?.[0] ?? "").toUpperCase()}
                {(v.last_name?.[0] ?? "").toUpperCase()}
              </div>
            )}
            
            <div className="min-w-0 flex flex-col">
              <p className="truncate text-base font-semibold">
                {v.first_name} {v.last_name}
              </p>
              
              {/* ADDED: Incident Date under the name */}
              <p className="truncate text-xs text-base-content/70 font-medium">
                Incident: {v.incident_date ? new Date(v.incident_date).toLocaleDateString() : "—"}
              </p>
              
              {/* Moved ID below the date */}
              <p className="truncate text-[11px] font-mono text-base-content/40">
                ID: {v.person_id?.slice(0, 8) ?? "—"}
              </p>
            </div>
          </Link>
        );
      },
    },
    {
      key: "personal",
      label: "Details",
      width: "20%",
      render: (v) => (
        <div className="text-sm leading-tight">
          <p className="capitalize">{v.gender || "—"} {v.age != null ? `· ${v.age} yrs` : ""}</p>
          <p className="text-xs text-base-content/60">{v.county_resident || "—"}</p>
        </div>
      ),
    },
    {
      key: "substance",
      label: "Substance Use",
      width: "15%",
      render: (v) => (
        <div className="text-sm leading-tight">
          <p className="font-medium truncate">{v.primary_substance_user || "—"}</p>
          <p className="text-xs text-base-content/60 truncate">{v.frequency_of_use || "—"}</p>
        </div>
      ),
    },
    {
      key: "dependency",
      label: "Dependency",
      width: "10%",
      render: (v) => (
        <span className={`badge badge-sm capitalize ${DEPENDENCY_BADGE[v.dependency_level] ?? "badge-ghost"}`}>
          {v.dependency_level || "Unknown"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      width: "20%",
      align: "right",
      render: (v) => {
        const hasDemandReduction = !!v.latest_demand_reduction_id;

        if (hasDemandReduction) {
          return (
            <button
              disabled
              className="btn btn-xs gap-1 normal-case btn-disabled bg-base-200 text-base-content/40 border-base-300"
              title="This beneficiary already has a demand reduction record"
            >
              <Check className="size-3.5" /> Already Added
            </button>
          );
        }

        return (
          <Link
            to={`/moh/demand-reductions/new?person_id=${v.id}`}
            className="btn btn-primary btn-xs gap-1 normal-case"
          >
            <Plus className="size-3.5" /> Add to Demand Reduction
          </Link>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* CUSTOM HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MoH Beneficiaries</h1>
          <p className="text-sm text-base-content/60">List of beneficiaries registered by the LDEA.</p>
        </div>
        
        <Link to="/moh/beneficiaries/new" className="btn btn-primary btn-sm gap-1.5 shadow-sm">
          <Plus className="size-4" /> Add Beneficiary
        </Link>
      </div>

      {/* TABLE */}
      <ResourceIndex
        resource={mohService.victims}
        title="" 
        subtitle="" 
        showCount={false}
        hideCount={true}
        columns={columns}
        filters={FILTERS}
        ordering="-id"
        emptyMessage="No Beneficiaries recorded yet."
        selectable={false}
        exportFilename={`MOH-LDEA-Beneficiaries-${new Date().toISOString().slice(0, 10)}.csv`}
      />
    </div>
  );
}