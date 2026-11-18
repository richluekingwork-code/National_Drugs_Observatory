import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { MapPin, CalendarDays, Gavel, PackageSearch, Users, FileText, Star } from "lucide-react";
import { useResource } from "../../../hooks/useResource";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { useRoles } from "../../../hooks/useRoles";
import { ldeaService } from "../../../services/ldeaService";
import { PageSpinner, PageError, ConfirmDialog } from "../seizures/SeizureDetailPage";
import { StatusBadge } from "../seizures/SeizuresPage";
import {
  Breadcrumb, HeaderActions, DetailHeader, FactStrip, Fact,
  DetailCard, DetailList, DetailRow, EmptyNote,
  formatDate, formatTime,
} from "../../../components/ldea/Detail";

export default function RaidDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = useRoles();
  const { data: raid, loading, error } = useResource(ldeaService.drugRaids, id);
  const { remove, submitting } = useResourceMutation(ldeaService.drugRaids);
  const [confirming, setConfirming] = useState(false);

  if (loading) return <PageSpinner />;
  if (error || !raid) return <PageError message={error} />;

  async function onDelete() {
    const result = await remove(raid.id);
    if (result.ok) navigate("/raids", { replace: true });
  }

  const when = [formatDate(raid.raid_date), formatTime(raid.raid_time)].filter(Boolean).join(" at ");
  const place = [raid.city, raid.county].filter(Boolean).join(", ");
  const team = raid.team_members ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumb to="/raids" parent="Drug raids" current={raid.reference_code || raid.title} mono={Boolean(raid.reference_code)} />

      <DetailHeader
        chips={
          <>
            {raid.reference_code && (
              <span className="rounded-md border border-base-300 bg-base-200/60 px-2 py-0.5 font-mono text-xs font-semibold">
                {raid.reference_code}
              </span>
            )}
            <StatusBadge status={raid.status} />
          </>
        }
        title={raid.title}
        subtitle={raid.location}
        actions={
          canWrite && (
            <HeaderActions editTo={`/raids/${raid.id}/edit`} onDelete={() => setConfirming(true)} />
          )
        }
      >
        <FactStrip>
          <Fact icon={CalendarDays} label="Date" value={when} />
          <Fact icon={MapPin} label="Area" value={place} />
          <Fact icon={Gavel} label="Arrests" value={String(raid.total_arrests ?? 0)} />
          <Fact icon={PackageSearch} label="Seizures" value={String(raid.total_seizures ?? 0)} />
        </FactStrip>
      </DetailHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailCard title="Location" icon={MapPin}>
            <DetailList>
              <DetailRow label="City" value={raid.city} />
              <DetailRow label="County" value={raid.county} />
              <DetailRow label="Full location" value={raid.location} full />
            </DetailList>
          </DetailCard>

          <DetailCard title="Description" icon={FileText}>
            {raid.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/80">{raid.description}</p>
            ) : (
              <p className="text-sm text-base-content/40">No description has been added.</p>
            )}
          </DetailCard>
        </div>

        <aside>
          <DetailCard
            title="Team"
            icon={Users}
            action={
              team.length > 0 && (
                <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs font-medium text-base-content/70">
                  {team.length}
                </span>
              )
            }
          >
            {team.length === 0 ? (
              <EmptyNote icon={Users}>No team members assigned.</EmptyNote>
            ) : (
              <ul className="-mx-2 space-y-0.5">
                {team.map((uid) => (
                  <li key={uid} className="flex items-center gap-3 rounded-lg px-2 py-2">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                    >
                      #{uid}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">User #{uid}</span>
                    {raid.lead_officer === uid && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        <Star className="size-2.5 fill-current" aria-hidden="true" />
                        Lead
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </DetailCard>
        </aside>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Delete this raid?"
          body="The record will be marked deleted. It will remain in the audit log."
          confirmLabel="Delete"
          submitting={submitting}
          onCancel={() => setConfirming(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}