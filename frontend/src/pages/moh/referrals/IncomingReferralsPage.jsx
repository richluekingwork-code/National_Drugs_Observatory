import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Inbox, Loader2 } from "lucide-react";
import { mohService } from "../../../services/mohService";

export default function IncomingReferralsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [declineReason, setDeclineReason] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mohService.referrals.incoming({ page: 1 });
      setRows(data.results ?? []);
    } catch {
      setError("Could not load incoming referrals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Helper to read the LogInVictims from the 'persons' array
  function getVictimNames(r) {
    // If the backend sends the 'persons' array
    if (r.persons && Array.isArray(r.persons)) {
      if (r.persons.length === 0) return "Unknown Victim";
      return r.persons.map((v) => `${v.first_name || ""} ${v.last_name || ""}`.trim()).join(", ");
    }
    // Fallback if backend sends 'patient_names'
    if (r.patient_names && Array.isArray(r.patient_names)) {
      return r.patient_names.map((p) => p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim()).join(", ");
    }
    return "Unknown Victim";
  }

  async function handleAccept(id) {
    setBusyId(id);
    try {
      await mohService.referrals.accept(id);
      await reload();
    } catch (err) {
      setError(err?.response?.data?.referral?.[0] ?? err?.response?.data?.detail ?? "Could not accept the referral.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(id) {
    setBusyId(id);
    try {
      await mohService.referrals.decline(id, declineReason);
      setDecliningId(null);
      setDeclineReason("");
      await reload();
    } catch (err) {
      setError(err?.response?.data?.referral?.[0] ?? "Could not decline the referral.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        {/* CHANGED THE TEXT HERE */}
        <h1 className="text-xl font-semibold tracking-tight">
          LDEA Incoming Referrals
        </h1>
        <p className="mt-0.5 text-sm text-base-content/60">
          LogInVictims referred from LDEA waiting for your facilities to accept or decline.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-[--radius-field] border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid place-items-center py-16">
          <span className="loading loading-spinner loading-md text-primary" aria-label="Loading" />
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="rounded-[--radius-box] border border-base-300 bg-base-100 p-8 text-center">
          <Inbox className="mx-auto mb-3 size-8 text-base-content/30" aria-hidden="true" />
          <p className="text-sm text-base-content/60">
            No pending LDEA referrals. You're all caught up.
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <ul className="divide-y divide-base-300 rounded-[--radius-box] border border-base-300 bg-base-100">
          {rows.map((r) => (
            <li key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-base">
                    {getVictimNames(r)}
                  </p>
                  <p className="mt-0.5 text-xs text-base-content/60">
                    From {r.referring_institution || "LDEA"}
                    {r.county && ` · ${r.county}`}
                    {r.referred_at && ` · ${new Date(r.referred_at).toLocaleDateString()}`}
                  </p>
                  <p className="mt-1 text-xs text-base-content/70">
                    Receiving: <span className="font-medium">{r.receiving_facility_name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(r.id)}
                    disabled={busyId === r.id}
                    className="btn btn-primary btn-sm normal-case"
                  >
                    {busyId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecliningId(r.id)}
                    disabled={busyId === r.id}
                    className="btn btn-ghost btn-sm normal-case text-error"
                  >
                    <X className="size-4" />
                    Decline
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}