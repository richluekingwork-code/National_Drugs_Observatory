import { Link } from "react-router-dom";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { mohService } from "../../../services/mohService";
import { useRoles } from "../../../hooks/useRoles";

export default function PreventionPage() {
  const { canWrite } = useRoles();
  const columns = [
    { key: "institution", label: "Institution", render: (p) => (
      <Link to={`/moh/prevention/${p.id}`} className="block min-w-0 hover:text-primary">
        <p className="truncate font-medium">{p.institution_name}</p>
        <p className="truncate text-xs text-base-content/60">{p.county} · {p.date}</p>
      </Link>
    )},
    { key: "activities", label: "Activities", render: (p) => {
      const list = [];
      if (p.sud_awareness)      list.push("SUD awareness");
      if (p.school_health_club) list.push("School clubs");
      if (p.media_campaign)     list.push("Media");
      if (p.harm_reduction)     list.push("Harm reduction");
      if (p.radio_talk_show)    list.push("Radio");
      return list.length === 0
        ? <span className="text-base-content/50">—</span>
        : <div className="flex flex-wrap gap-1">{list.map((a) => <span key={a} className="badge badge-ghost badge-sm">{a}</span>)}</div>;
    }},
    { key: "district", label: "District", render: (p) => p.district || "—" },
  ];

  return (
    <ResourceIndex
      resource={mohService.prevention}
      title="Prevention"
      subtitle="Community prevention activities reported by institutions."
      columns={columns}
      newPath="/moh/prevention/new"
      canWrite={canWrite}
      ordering="-date"
      selectable
      exportFilename={`moh-prevention-${new Date().toISOString().slice(0, 10)}.csv`}
      emptyMessage="No prevention reports yet."
    />
  );
}