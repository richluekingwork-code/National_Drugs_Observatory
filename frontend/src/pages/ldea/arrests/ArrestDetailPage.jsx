import { Link, useParams } from "react-router-dom";
import {
  CalendarDays, MapPin, Scale, FlaskConical, BadgeCheck, FileText,
  Gavel, UserRound, Briefcase, Phone, Hash
} from "lucide-react";
import { useResource } from "../../../hooks/useResource";
import { useRoles } from "../../../hooks/useRoles";
import { ldeaService } from "../../../services/ldeaService";
import { PageSpinner, PageError } from "../Seizures/SeizureDetailPage";
import { StatusBadge } from "../Seizures/SeizuresPage";
import {
  Breadcrumb, HeaderActions, DetailHeader, FactStrip, Fact,
  DetailCard, DetailList, DetailRow,
  formatDate, formatTime,
} from "../../../components/ldea/Detail";

export default function ArrestDetailPage() {
  const { id } = useParams();
  const { canWrite } = useRoles();
  const { data: arrest, loading, error } = useResource(ldeaService.arrests, id);

  if (loading) return <PageSpinner />;
  if (error || !arrest) return <PageError message={error} />;

  // Build full name and alias
  const mainName = [arrest.first_name, arrest.middle_name, arrest.last_name].filter(Boolean).join(" ");
  const alias = arrest.other_name ? `(${arrest.other_name})` : "";
  const fullTitle = `${mainName} ${alias}`.trim();
  const when = [formatDate(arrest.arrest_date), formatTime(arrest.arrest_time)].filter(Boolean).join(" at ");

  const initials = `${(arrest.first_name?.[0] ?? "").toUpperCase()}${(arrest.last_name?.[0] ?? "").toUpperCase()}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumb to="/arrests" parent="Arrests" current={mainName} />

      <DetailHeader
        chips={<StatusBadge status={arrest.status} />}
        title={fullTitle}
        subtitle={arrest.arrests_number ? `Ref: ${arrest.arrests_number}` : null}
        actions={canWrite && <HeaderActions editTo={`/arrests/${arrest.id}/edit`} />}
      >
        <FactStrip>
          <Fact icon={CalendarDays} label="Arrested on" value={when} />
          <Fact icon={FlaskConical} label="Drug type" value={arrest.drug_type} />
          <Fact icon={Scale} label="Quantity" value={arrest.quantity != null ? `${arrest.quantity} ${arrest.unit || ""}` : null} />
          <Fact icon={MapPin} label="Arrest County" value={arrest.county_of_arrests} />
        </FactStrip>
      </DetailHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ================= MAIN COLUMN (LEFT) ================= */}
        <div className="space-y-6 lg:col-span-2">
          <DetailCard title="Charges" icon={Gavel}>
            {arrest.charges ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/80">{arrest.charges}</p>
            ) : (
              <p className="text-sm text-base-content/40">No charges recorded.</p>
            )}
          </DetailCard>

          <DetailCard title="Arrest Location" icon={MapPin}>
            <DetailList>
              <DetailRow label="County" value={arrest.county_of_arrests} />
              <DetailRow label="District" value={arrest.district_of_arrests} />
              <DetailRow label="Description" value={arrest.location_of_arrests} full />
            </DetailList>
          </DetailCard>

          <DetailCard title="Substance" icon={FlaskConical}>
            <DetailList>
              <DetailRow label="Drug type" value={arrest.drug_type} />
              <DetailRow label="Quantity" value={arrest.quantity != null ? String(arrest.quantity) : null} />
              <DetailRow label="Unit" value={arrest.unit} />
            </DetailList>
          </DetailCard>

          {arrest.remarks && (
            <DetailCard title="Remarks" icon={FileText}>
              <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/80">{arrest.remarks}</p>
            </DetailCard>
          )}
        </div>

        {/* ================= SIDEBAR COLUMN (RIGHT) ================= */}
        <aside className="space-y-6">
          
          {/* Personal Info with Photo */}
          <DetailCard title="Arrested Person" icon={UserRound}>
            <div className="flex items-center gap-4 mb-5 border-b border-base-200 pb-4">
              {arrest.photo ? (
                <img
                  src={arrest.photo}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-base-200 text-lg font-semibold text-base-content/60">
                  {initials || "?"}
                </div>
              )}
              <div>
                <p className="font-semibold text-base-content">{mainName}</p>
                {arrest.other_name && (
                  <p className="text-xs text-base-content/60 italic">Alias: {arrest.other_name}</p>
                )}
              </div>
            </div>

            <DetailList>
              <DetailRow label="Gender" value={arrest.gender} />
              <DetailRow label="Date of Birth" value={formatDate(arrest.date_of_birth)} />
              <DetailRow label="Nationality" value={arrest.nationality} />
              <DetailRow label="Marital Status" value={arrest.marital_status} />
            </DetailList>
          </DetailCard>

          {/* Contact & Background */}
          <DetailCard title="Contact & Background" icon={Phone}>
            <DetailList>
              <DetailRow label="Phone" value={arrest.phone_number} />
              <DetailRow label="Email" value={arrest.email} />
              <DetailRow label="Residence County" value={arrest.county} />
              <DetailRow label="Residence District" value={arrest.district} />
              <DetailRow label="Address" value={arrest.address} />
              <DetailRow label="Prof. Status" value={arrest.professional_status} />
              <DetailRow label="Education" value={arrest.educational_level} />
            </DetailList>
          </DetailCard>

          {/* Officer Info */}
          <DetailCard title="Arresting Officer" icon={BadgeCheck}>
            <DetailList>
              <DetailRow label="Officer" value={arrest.arresting_officer} />
              <DetailRow label="Badge number" value={arrest.badge_number} mono />
            </DetailList>
          </DetailCard>

        </aside>
      </div>
    </div>
  );
}