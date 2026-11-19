import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, FlaskConical, MapPin, CalendarDays, Scale, Image as ImageIcon, BadgeCheck, FileText } from "lucide-react";
import { useResource } from "../../../hooks/useResource";
import { useResourceMutation } from "../../../hooks/useResourceMutation";
import { useRoles } from "../../../hooks/useRoles";
import { ldeaService } from "../../../services/ldeaService";
import { StatusBadge } from "./SeizuresPage";
import {
  Breadcrumb, HeaderActions, DetailHeader, FactStrip, Fact,
  DetailCard, DetailList, DetailRow,
  formatDate, formatTime,
} from "../../../components/ldea/Detail";

export default function SeizureDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = useRoles();
  const { data: seizure, loading, error } = useResource(ldeaService.seizures, id);
  const { remove, submitting } = useResourceMutation(ldeaService.seizures);
  const [confirming, setConfirming] = useState(false);

  if (loading) return <PageSpinner />;
  if (error || !seizure) return <PageError message={error} />;

  async function onDelete() {
    const result = await remove(seizure.id);
    if (result.ok) navigate("/seizures", { replace: true });
  }

  const drug = seizure.drug_type || "Unknown drug";
  const when = [formatDate(seizure.seizure_date), formatTime(seizure.seizure_time)].filter(Boolean).join(" at ");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumb to="/seizures" parent="Seizures" current={drug} />

      <DetailHeader
        chips={<StatusBadge status={seizure.status} />}
        title={drug}
        subtitle={seizure.seized_by ? `Seized by ${seizure.seized_by}` : null}
        actions={
          canWrite && (
            <HeaderActions editTo={`/seizures/${seizure.id}/edit`} onDelete={() => setConfirming(true)} />
          )
        }
      >
        <FactStrip>
          <Fact icon={Scale} label="Quantity" value={seizure.quantity != null ? String(seizure.quantity) : null} />
          <Fact icon={Scale} label="Unit" value={seizure.unit} />
          <Fact icon={CalendarDays} label="Seized on" value={when} />
          <Fact icon={MapPin} label="County" value={seizure.county} />
        </FactStrip>
      </DetailHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Area (2/3 width) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* FIXED: Seizure Details and Location are now side-by-side on the same row */}
          <div className="grid gap-6 md:grid-cols-2">
            <DetailCard title="Seizure details" icon={FlaskConical}>
              <DetailList>
                <DetailRow label="Drug type" value={seizure.drug_type} />
                <DetailRow label="Quantity" value={seizure.quantity != null ? String(seizure.quantity) : null} />
                <DetailRow label="Unit" value={seizure.unit} />
                <DetailRow label="Date" value={formatDate(seizure.seizure_date)} />
                <DetailRow label="Time" value={formatTime(seizure.seizure_time)} />
              </DetailList>
            </DetailCard>

            <DetailCard title="Location" icon={MapPin}>
              <DetailList>
                <DetailRow label="County" value={seizure.county} />
                <DetailRow label="District" value={seizure.district} />
                <DetailRow label="Description" value={seizure.location_description} full />
              </DetailList>
            </DetailCard>
          </div>

          {seizure.remarks && (
            <DetailCard title="Remarks" icon={FileText}>
              <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/80">{seizure.remarks}</p>
            </DetailCard>
          )}
        </div>

        {/* Sidebar Area (1/3 width) */}
        <aside className="space-y-6">
          {seizure.photo && (
            <DetailCard title="Photo" icon={ImageIcon}>
              <a href={seizure.photo} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-base-300">
                <img src={seizure.photo} alt={`Seized ${drug}`} className="max-h-80 w-full object-cover transition-transform hover:scale-[1.02]" />
              </a>
            </DetailCard>
          )}

          <DetailCard title="Seizing officer" icon={BadgeCheck}>
            <DetailList>
              <DetailRow label="Officer" value={seizure.seized_by} />
              <DetailRow label="Badge number" value={seizure.badge_number} mono />
            </DetailList>
          </DetailCard>
        </aside>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Delete this seizure?"
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

/* ------------------------------------------------------------------ */
/* Shared page states (imported by other detail pages)                 */
/* ------------------------------------------------------------------ */

export function PageSpinner() {
  return (
    <div className="grid place-items-center py-24">
      <span className="loading loading-spinner loading-md text-primary" aria-label="Loading" />
    </div>
  );
}

export function PageError({ message }) {
  return (
    <div role="alert" className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
      <span className="grid size-11 place-items-center rounded-full bg-error/10 text-error">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold">Couldn't load this record</p>
        <p className="mt-1 text-sm text-base-content/60">{message ?? "Something went wrong."}</p>
      </div>
      <button type="button" onClick={() => window.history.back()} className="btn btn-outline btn-sm rounded-lg">
        Go back
      </button>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, submitting, onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !submitting && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, submitting]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && !submitting && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl"
      >
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-error/10 text-error">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="confirm-title" className="text-base font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm text-base-content/70">{body}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn btn-ghost btn-sm rounded-lg" disabled={submitting}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-error btn-sm rounded-lg" disabled={submitting}>
            {submitting && <span className="loading loading-spinner loading-xs" />}
            {submitting ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}