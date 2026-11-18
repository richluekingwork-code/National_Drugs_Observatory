import { useState, useCallback, useMemo } from "react";
import { Plus, Search, UserCheck, UserX } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import CreateUserDialog from "../../components/admin/CreateUserDialog";
import ConfirmDialog from "../../components/admin/ConfirmDialog"
import { adminService } from "../../services/adminService";
import { useAuth } from "../../contexts/AuthContext";
import { useRoles } from "../../hooks/useRoles";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";
import { formatRole } from "../../components/admin/ui";

function membershipsFor(user, scopeId) {
  const ms = Array.isArray(user?.memberships) ? user.memberships : [];
  if (scopeId == null) return ms;
  return ms.filter((m) => m.institution?.id === scopeId);
}
function fullNameOf(user) {
  return (
    [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    "this user"
  );
}

export default function UsersAdminPage({
  onChanged,
  institutionId,
  allowAdminRole = false,
  defaultInstitutionCode,
}) {
  const { currentInstitutionId, user: me } = useAuth();
  const { isSuperuser, canManageUsers } = useRoles();
  const scopeId = institutionId !== undefined ? institutionId : currentInstitutionId;
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetcher = useCallback(
    ({ page, search }) =>
      adminService.listUsers({ page, search, institutionId: scopeId }),
    [scopeId],
  );

  const {
    page, setPage, search, setSearch,
    data, loading, error, reload,
  } = usePaginatedResource(fetcher);

  const users = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }, [data]);

  const refreshAfterChange = useCallback(() => {
    reload();
    onChanged?.();
  }, [reload, onChanged]);

  const columns = useMemo(() => {
    const base = [
      {
        key: "username",
        label: "User",
        render: (user) => (
        <div className="min-w-0">
            <p className="truncate font-medium">
            {[user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") ||
                user.username ||
                "Unknown user"}
            </p>
            <p className="truncate text-xs text-base-content/60">
            {user.email || "—"}
            </p>
        </div>
        ),
      },
      {
        key: "institution",
        label: "Institution",
        render: (user) => {
          const ms = membershipsFor(user, scopeId);
          if (ms.length === 0) {
            return <span className="text-base-content/40">—</span>;
          }
          const first = ms[0].institution;
          const primary = first?.name || first?.code || "—";
          const extra = ms.length - 1;
          return (
            <div className="min-w-0">
              <p className="truncate text-sm">{primary}</p>
              {extra > 0 && (
                <p className="text-xs text-base-content/60">+{extra} more</p>
              )}
            </div>
          );
        },
      },
      {
        key: "role",
        label: "Role",
        render: (user) => {
          const ms = membershipsFor(user, scopeId);
          if (ms.length === 0) {
            return <span className="badge badge-ghost badge-sm">unassigned</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {ms.map((m, i) => (
                <span key={m.id ?? i} className="badge badge-outline badge-sm">
                  {formatRole(m.role)}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        key: "is_active",
        label: "Status",
        render: (user) =>
          user.is_active ? (
            <span className="badge badge-success badge-sm">Active</span>
          ) : (
            <span className="badge badge-ghost badge-sm">Inactive</span>
          ),
      },
    ];

    // Global account activation is a superuser action.
    // Institution admins can create users but cannot toggle login status.
    if (isSuperuser || canManageUsers) {
      base.push({
        key: "actions",
        label: "Actions",
        render: (user) => (
          <RowActions
            user={user}
            isSelf={me?.id === user.id}
            canTouch={isSuperuser || !user.is_superuser}
            onChanged={refreshAfterChange}
          />
        ),
      });
    }

    return base;
  }, [isSuperuser, canManageUsers, me?.id, refreshAfterChange, scopeId]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            Accounts and access assignments across your institution.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm normal-case"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4" aria-hidden="true" />
          New user
        </button>
      </header>

      <label className="relative block max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by username or email"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="input input-bordered h-10 w-full pl-9 text-sm"
          aria-label="Search users"
        />
      </label>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        error={error}
        page={page}
        onPageChange={setPage}
        pageSize={20}
        emptyMessage="No users in this institution yet."
      />

      {dialogOpen && (
        <CreateUserDialog
          allowAdminRole={allowAdminRole}
          defaultInstitutionCode={defaultInstitutionCode}
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            setDialogOpen(false);
            if (page !== 1) setPage(1);
            else reload();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}

function RowActions({ user, isSelf, canTouch, onChanged }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  // Institution admins can't act on superusers
  if (!canTouch) return <span className="text-base-content/40">—</span>;

  const name = fullNameOf(user);
  const next = !user.is_active;
  const verb = next ? "reactivate" : "deactivate";
  const blockSelf = isSelf && user.is_active;

  function close() {
    if (busy) return;
    setConfirming(false);
    setActionError("");
  }

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await adminService.setUserActive(user.id, next);
      setConfirming(false);
      await onChanged?.();
    } catch (err) {
      const body = err?.response?.data;
      const msg =
        body?.detail ||
        (body && Object.values(body).flat().find((v) => typeof v === "string")) ||
        "Unable to update this user's status.";
      setActionError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={blockSelf}
        title={blockSelf ? "You can't deactivate your own account" : undefined}
        className={
          "btn btn-ghost btn-xs normal-case " +
          (user.is_active ? "text-error" : "text-success")
        }
        aria-label={user.is_active ? `Deactivate ${name}` : `Reactivate ${name}`}
      >
        {user.is_active ? (
          <>
            <UserX className="size-3.5" aria-hidden="true" />
            Deactivate
          </>
        ) : (
          <>
            <UserCheck className="size-3.5" aria-hidden="true" />
            Reactivate
          </>
        )}
      </button>

      {confirming && (
        <ConfirmDialog
          title={next ? "Reactivate user?" : "Deactivate user?"}
          tone={next ? "success" : "error"}
          confirmLabel={next ? "Reactivate" : "Deactivate"}
          busy={busy}
          error={actionError}
          onConfirm={confirm}
          onClose={close}
        >
          Are you sure you want to {verb}{" "}
          <span className="font-semibold text-base-content">{name}</span>?{" "}
          {next
            ? "They will be able to sign in again."
            : "They will no longer be able to sign in."}
        </ConfirmDialog>
      )}
    </>
  );
}