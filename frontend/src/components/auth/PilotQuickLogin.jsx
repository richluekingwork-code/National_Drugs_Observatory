import { useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * PILOT ONLY — click-to-login panel.
 *
 * Lists the seeded pilot accounts so testers can sign in as anyone with one
 * click. Every account shares the same password (see core/management/commands/
 * seed_pilot.py). Remove this component (and its use in LoginPage) before going
 * to production, or hide it by setting VITE_PILOT_LOGIN="false" at build time.
 */

const PILOT_PASSWORD = "Pilot@2026";

const ROLE_LABELS = {
  institution_admin: "Institution Admin",
  department_head: "Department Head",
  data_officer: "Data Officer",
  superuser: "Platform Superuser",
};

const GROUPS = [
  {
    label: "Platform",
    accounts: [{ username: "admin", role: "superuser" }],
  },
  {
    label: "Ministry of Justice (MOJ)",
    accounts: [
      { username: "moj_institution_admin", role: "institution_admin" },
      { username: "moj_department_head", role: "department_head" },
      { username: "moj_data_officer", role: "data_officer" },
    ],
  },
  {
    label: "Liberia Drug Enforcement Agency (LDEA)",
    accounts: [
      { username: "ldea_institution_admin", role: "institution_admin" },
      { username: "ldea_department_head", role: "department_head" },
      { username: "ldea_data_officer", role: "data_officer" },
    ],
  },
  {
    label: "Ministry of Health (MOH)",
    accounts: [
      { username: "moh_institution_admin", role: "institution_admin" },
      { username: "moh_department_head", role: "department_head" },
      { username: "moh_data_officer", role: "data_officer" },
    ],
  },
  {
    label: "Ministry of Gender (MOG)",
    accounts: [
      { username: "mog_institution_admin", role: "institution_admin" },
      { username: "mog_department_head", role: "department_head" },
      { username: "mog_data_officer", role: "data_officer" },
      { username: "mog_child_tracking_admin", role: "institution_admin" },
      { username: "mog_child_tracking_head", role: "department_head" },
      { username: "mog_child_tracking_officer", role: "data_officer" },
    ],
  },
  {
    label: "Ministry of Youth & Sports (MOYS)",
    accounts: [
      { username: "moys_institution_admin", role: "institution_admin" },
      { username: "moys_department_head", role: "department_head" },
      { username: "moys_data_officer", role: "data_officer" },
    ],
  },
];

export default function PilotQuickLogin({ onSuccess }) {
  const { login } = useAuth();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function signInAs(username) {
    if (busy) return;
    setError(null);
    setBusy(username);
    try {
      await login({ identifier: username, password: PILOT_PASSWORD });
      onSuccess?.();
    } catch (err) {
      setError(err?.message ?? `Could not sign in as ${username}.`);
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 border-t border-base-content/10 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Pilot test accounts
        </span>
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning-content">
          Click to sign in
        </span>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-xs text-error">
          {error}
        </p>
      )}

      <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 text-[11px] font-medium text-base-content/50">
              {group.label}
            </p>
            <div className="flex flex-col gap-1.5">
              {group.accounts.map(({ username, role }) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => signInAs(username)}
                  disabled={busy !== null}
                  className="flex items-center justify-between gap-2 rounded-[--radius-field] border border-base-content/10 bg-base-200/40 px-3 py-2 text-left text-xs transition-colors hover:bg-base-200 disabled:opacity-60"
                >
                  <span className="flex items-center gap-2 truncate">
                    {busy === username ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                    ) : (
                      <UserRound className="size-3.5 shrink-0 text-base-content/50" aria-hidden="true" />
                    )}
                    <span className="truncate font-medium">{username}</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-base-content/50">
                    {ROLE_LABELS[role] ?? role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] text-base-content/40">
        Shared password: <span className="font-mono">{PILOT_PASSWORD}</span>
      </p>
    </div>
  );
}
