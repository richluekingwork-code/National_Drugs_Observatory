import { Link, useParams } from "react-router-dom";
import { useResource } from "../../../hooks/useResource";
import { mohService } from "../../../services/mohService";
import { useRoles } from "../../../hooks/useRoles";
import { DetailHeader, Section, Row, PanelSpinner, PanelError } from "../../../components/mog/MOGDetail";

export default function PreventionDetailPage() {
  const { id } = useParams();
  const { canWrite } = useRoles();
  const { data: p, loading, error } = useResource(mohService.prevention, id);
  if (loading) return <PanelSpinner />;
  if (error || !p) return <PanelError message={error} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <DetailHeader
        back="/moh/prevention"
        title={p.institution_name}
        subtitle={`${p.date} · ${p.county}${p.district ? ` · ${p.district}` : ""}`}
        actions={canWrite && <Link to={`/moh/prevention/${p.id}/edit`} className="btn btn-outline btn-sm normal-case">Edit</Link>}
      />

      <Section title="Institution">
        <Row label="Address" value={p.address} full />
      </Section>

      <Section title="Activities">
        <Row label="SUD awareness" value={p.sud_awareness} />
        <Row label="Communities" value={p.sud_communities} full />
        <Row label="School health club" value={p.school_health_club} />
        <Row label="Schools" value={p.school_names} full />
        <Row label="Media campaign" value={p.media_campaign} />
        <Row label="Media details" value={p.media_details} full />
        <Row label="Harm reduction" value={p.harm_reduction} />
        <Row label="Harm reduction details" value={p.harm_reduction_details} full />
        <Row label="Radio talk show" value={p.radio_talk_show} />
        <Row label="Radio details" value={p.radio_details} full />
      </Section>
    </div>
  );
}