import { Link, useParams } from "react-router-dom";
import { useResource } from "../../../hooks/useResource";
import { mohService } from "../../../services/mohService";
import { useRoles } from "../../../hooks/useRoles";
import { DetailHeader, Section, Row, PanelSpinner, PanelError } from "../../../components/mog/MOGDetail";

const SERVICE_FLAGS = [
  ["detoxification_services", "Detoxification"],
  ["inpatient_services", "Inpatient"],
  ["outpatient_services", "Outpatient"],
  ["counseling_services", "Counseling"],
  ["family_therapy", "Family therapy"],
  ["group_therapy", "Group therapy"],
  ["medication_assisted_treatment", "MAT"],
  ["mental_health_services", "Mental health"],
  ["vocational_training", "Vocational training"],
  ["aftercare_services", "Aftercare"],
];

export default function FacilityDetailPage() {
  const { id } = useParams();
  const { canWrite } = useRoles();
  const { data: f, loading, error } = useResource(mohService.facilities, id);
  if (loading) return <PanelSpinner />;
  if (error || !f) return <PanelError message={error} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <DetailHeader
        back="/moh/facilities"
        title={f.facility_name}
        subtitle={`${f.facility_code} · ${f.county}`}
        badge={<span className="badge badge-outline badge-sm">{f.facility_type}</span>}
        actions={canWrite && <Link to={`/moh/facilities/${f.id}/edit`} className="btn btn-outline btn-sm normal-case">Edit</Link>}
      />

      <Section title="Profile">
        <Row label="Type" value={f.facility_type} />
        <Row label="Ownership" value={f.ownership_type} />
        <Row label="Operational status" value={f.operational_status} />
        <Row label="Opening hours" value={f.opening_hours} />
        <Row label="Accepts referrals" value={f.accepts_referrals} />
        <Row label="Emergency services" value={f.emergency_services_available} />
      </Section>

      <Section title="Location">
        <Row label="County" value={f.county} />
        <Row label="District" value={f.district} />
        <Row label="City / town" value={f.city_town} />
        <Row label="Address" value={f.physical_address} full />
      </Section>

      <Section title="Contact">
        <Row label="Contact person" value={f.contact_person} />
        <Row label="Phone" value={f.phone_number} />
        <Row label="Alternate phone" value={f.alternate_phone} />
        <Row label="Email" value={f.email} />
        <Row label="Website" value={f.website} />
      </Section>

      <Section title="Licensing">
        <Row label="Licensed" value={f.licensed} />
        <Row label="License number" value={f.license_number} />
        <Row label="Issued" value={f.license_issue_date} />
        <Row label="Expires" value={f.license_expiry_date} />
      </Section>

      <Section title="Capacity">
        <Row label="Total beds" value={f.total_beds} />
        <Row label="Male beds" value={f.male_beds} />
        <Row label="Female beds" value={f.female_beds} />
        <Row label="Adolescent beds" value={f.adolescent_beds} />
        <Row label="Current occupancy" value={f.current_occupancy} />
      </Section>

      <Section title="Services">
        {SERVICE_FLAGS.map(([key, label]) => (
          <Row key={key} label={label} value={f[key]} />
        ))}
      </Section>

      <Section title="Staffing">
        <Row label="Medical doctors" value={f.medical_doctors} />
        <Row label="Psychiatrists" value={f.psychiatrists} />
        <Row label="Psychologists" value={f.psychologists} />
        <Row label="Nurses" value={f.nurses} />
        <Row label="Counselors" value={f.counselors} />
        <Row label="Social workers" value={f.social_workers} />
        <Row label="Peer support workers" value={f.peer_support_workers} />
      </Section>

      <Section title="Reporting">
        <Row label="Year" value={f.reporting_year} />
        <Row label="Quarter" value={f.reporting_quarter} />
        <Row label="Remarks" value={f.remarks} full />
      </Section>
    </div>
  );
}