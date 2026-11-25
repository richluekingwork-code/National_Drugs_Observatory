// src/components/admin/EditMemberShipDialog.jsx
import {useEffect, useId, useRef, useState} from "react";
import {Loader2, X, ShieldAlert, MapPin, Check} from "lucide-react";
import {adminService} from "../../services/adminService";
import {accountService} from "../../services/accountService";
import {useRoles} from "../../hooks/useRoles";
import {LIBERIA_COUNTIES} from "../../constants/counties";
import {COUNTIES} from "../../constants/mogCounties";

const EDITABLE_ROLES = [
    {value: "department_head", label: "Department Head"},
    {value: "data_officer", label: "Data Officer"},
];

// "River Cess", "river_cess" and "Rivercess" all compare equal
const norm = (value) =>
    String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function normalizeCounties(counties) {
    if (!Array.isArray(counties)) return [];

    return [
        ...new Set(
            counties.filter(
                (county) =>
                    typeof county === "string" && county.trim().length > 0
            )
        ),
    ].sort();
}

export default function EditMembershipDialog({
    membership,
    onClose,
    onSaved,
}) {
    const {isSuperuser, canManageUsers} = useRoles();

    // Safely grab the existing profile data (it might be nested under user.profile or profile)
    const existingProfile = membership.user?.profile || membership.profile || {};

    const [role, setRole] = useState(membership.role);
    const [isActive, setIsActive] = useState(membership.is_active);
    const [formCounties, setFormCounties] = useState(() =>
        normalizeCounties(membership.counties)
    );

    // Work details state
    const [jobTitle, setJobTitle] = useState(existingProfile.job_title ?? "");
    const [department, setDepartment] = useState(existingProfile.department ?? "");
    const [employeeNumber, setEmployeeNumber] = useState(existingProfile.employee_number ?? "");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const ref = useRef(null);
    const titleId = useId();

    const isTargetAdmin = membership.role === "institution_admin";

    const canEditTarget = isSuperuser || (canManageUsers && !isTargetAdmin);
    const canEditCountyScope = canEditTarget;

    const selectedCounties = normalizeCounties(formCounties);
    const originalCounties = normalizeCounties(membership.counties);

    const countiesChanged =
        JSON.stringify(selectedCounties) !== JSON.stringify(originalCounties);

    const isSelected = (county) =>
        selectedCounties.some((c) => norm(c) === norm(county));

    const allCountiesSelected = LIBERIA_COUNTIES.every(isSelected);

    useEffect(() => {
        ref.current?.querySelector("select, button")?.focus();

        const onKey = (event) => {
            if (event.key === "Escape" && !submitting) {
                onClose();
            }
        };

        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, submitting]);

    function toggleCounty(county) {
        setFormCounties((previous) =>
            previous.some((c) => norm(c) === norm(county))
                ? previous.filter((item) => norm(item) !== norm(county))
                : [...previous, county]
        );
    }

    function selectAllCounties() {
        setFormCounties(allCountiesSelected ? [] : [...LIBERIA_COUNTIES]);
    }

    async function onSubmit(event) {
        event.preventDefault();

        if (submitting || !canEditTarget) return;

        setSubmitting(true);
        setError(null);

        try {
            // 1. Build Membership Payload
            const membershipPayload = {};

            if (role !== membership.role) {
                membershipPayload.role = role;
            }

            if (isActive !== membership.is_active) {
                membershipPayload.is_active = isActive;
            }

            if (countiesChanged && canEditCountyScope) {
                membershipPayload.counties = selectedCounties;
            }

            // 2. Build Profile Payload (only include fields that actually changed)
            const profilePayload = {};

            if (jobTitle !== (existingProfile.job_title ?? "")) {
                profilePayload.job_title = jobTitle;
            }
            if (department !== (existingProfile.department ?? "")) {
                profilePayload.department = department;
            }
            if (employeeNumber !== (existingProfile.employee_number ?? "")) {
                profilePayload.employee_number = employeeNumber;
            }

            // If nothing changed, just close
            if (Object.keys(membershipPayload).length === 0 && Object.keys(profilePayload).length === 0) {
                onClose();
                return;
            }

            // 3. Fire off both API requests concurrently
            const promises = [];

            if (Object.keys(membershipPayload).length > 0) {
                promises.push(adminService.updateMembership(membership.id, membershipPayload));
            }

            if (Object.keys(profilePayload).length > 0 && membership.user_id) {
                promises.push(accountService.updateProfile(membership.user_id, profilePayload));
            }

            await Promise.all(promises);
            onSaved?.();
        } catch (err) {
            const body = err?.response?.data;

            const msg =
                (body && (body.non_field_errors?.[0] || body.detail)) ||
                (body &&
                    Object.values(body)
                        .flat()
                        .find((value) => typeof value === "string")) ||
                "Could not update membership or profile.";

            setError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={(event) => {
                if (event.target === event.currentTarget && !submitting) {
                    onClose();
                }
            }}
        >
            <div
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-2xl"
            >
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between border-b border-base-300 px-5 py-4">
                    <div>
                        <h2
                            id={titleId}
                            className="text-base font-semibold text-base-content"
                        >
                            Edit membership
                        </h2>

                        <p className="mt-1 text-xs text-base-content/60">
                            {membership.username}
                            {" · "}
                            {membership.institution?.name ??
                                membership.institution?.code ??
                                "Institution"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label="Close dialog"
                    >
                        <X className="size-4" aria-hidden="true"/>
                    </button>
                </header>

                {/* Form */}
                <form onSubmit={onSubmit} className="flex min-h-0 flex-col">
                    <div className="space-y-5 overflow-y-auto p-5">
                        {!canEditTarget && (
                            <div className="flex items-start gap-2 rounded-field border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs text-warning-content">
                                <ShieldAlert
                                    className="mt-0.5 size-4 shrink-0"
                                    aria-hidden="true"
                                />
                                <p>
                                    Only a system superuser can modify an
                                    institution administrator membership.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div
                                role="alert"
                                className="rounded-field border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error"
                            >
                                {error}
                            </div>
                        )}

                        {/* Work Details */}
                        <fieldset className="space-y-3 rounded-xl border border-base-300 p-4">
                            <legend className="text-sm font-semibold text-base-content">
                                Work details
                            </legend>
                            <p className="mt-1 text-xs leading-relaxed text-base-content/60">
                                Update the user's job title, department, and employee number.
                            </p>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <label className="form-control w-full">
                                    <span className="label pb-1.5">
                                        <span className="label-text text-xs font-medium text-base-content/80">
                                            Job title
                                        </span>
                                    </span>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        disabled={!canEditTarget || submitting}
                                        placeholder="e.g. Nurse"
                                        className="input input-bordered h-10 w-full text-sm"
                                    />
                                </label>

                                <label className="form-control w-full">
                                    <span className="label pb-1.5">
                                        <span className="label-text text-xs font-medium text-base-content/80">
                                            Department
                                        </span>
                                    </span>
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        disabled={!canEditTarget || submitting}
                                        placeholder="e.g. Pediatrics"
                                        className="input input-bordered h-10 w-full text-sm"
                                    />
                                </label>

                                <label className="form-control w-full">
                                    <span className="label pb-1.5">
                                        <span className="label-text text-xs font-medium text-base-content/80">
                                            Employee number
                                        </span>
                                    </span>
                                    <input
                                        type="text"
                                        value={employeeNumber}
                                        onChange={(e) => setEmployeeNumber(e.target.value)}
                                        disabled={!canEditTarget || submitting}
                                        placeholder="e.g. EMP-001"
                                        className="input input-bordered h-10 w-full text-sm"
                                    />
                                </label>
                            </div>
                        </fieldset>

                        {/* Role */}
                        <label className="form-control w-full">
                            <span className="label pb-1.5">
                                <span className="label-text text-sm font-medium text-base-content/80">
                                    Role
                                </span>
                            </span>

                            <select
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                disabled={!canEditTarget || submitting}
                                className="select select-bordered h-10 w-full text-sm"
                            >
                                {isTargetAdmin && (
                                    <option value="institution_admin">
                                        Institution Administrator
                                    </option>
                                )}

                                {EDITABLE_ROLES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* Active status */}
                        <label className="mt-6 flex items-center gap-2.5">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(event) => setIsActive(event.target.checked)}
                                disabled={!canEditTarget || submitting}
                                className="checkbox checkbox-sm checkbox-primary"
                            />
                            <span className="text-sm font-medium text-base-content">
                                Active membership
                            </span>
                        </label>

                        {/* County scope */}
                        <fieldset className="mt-4 space-y-3 rounded-xl border border-base-300 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <legend className="text-sm font-semibold text-base-content">
                                        County scope
                                    </legend>
                                    <p className="mt-1 text-xs leading-relaxed text-base-content/60">
                                        Choose the counties this user is allowed
                                        to access within the institution.
                                    </p>
                                </div>

                                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                                    <MapPin className="size-4" aria-hidden="true"/>
                                </div>
                            </div>

                            {/* Scope summary */}
                            <div className="flex items-center justify-between gap-3 rounded-lg bg-base-200/70 px-3 py-2">
                                <div>
                                    <p className="text-xs font-semibold text-base-content">
                                        {selectedCounties.length === 0
                                            ? "All counties"
                                            : `${selectedCounties.length} of ${LIBERIA_COUNTIES.length} selected`}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-base-content/60">
                                        {selectedCounties.length === 0
                                            ? "Institution-wide geographic scope"
                                            : "Restricted geographic scope"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={selectAllCounties}
                                    disabled={!canEditCountyScope || submitting}
                                    className="btn btn-ghost btn-xs shrink-0 normal-case text-primary"
                                >
                                    {allCountiesSelected ? "Clear selection" : "Select all"}
                                </button>
                            </div>

                            {/* County options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:grid-cols-3">
                                {LIBERIA_COUNTIES.map((county) => {
                                    const selected = isSelected(county);

                                    return (
                                        <button
                                            key={county}
                                            type="button"
                                            onClick={() => toggleCounty(county)}
                                            disabled={!canEditCountyScope || submitting}
                                            aria-pressed={selected}
                                            className={[
                                                "flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
                                                selected
                                                    ? "border-primary/40 bg-primary/10 text-primary"
                                                    : "border-base-300 bg-base-100 text-base-content/75 hover:border-primary/40 hover:bg-base-200/60",
                                                !canEditCountyScope || submitting
                                                    ? "cursor-not-allowed opacity-60"
                                                    : "",
                                            ].join(" ")}
                                        >
                                            <span
                                                className={[
                                                    "grid size-4 shrink-0 place-items-center rounded border",
                                                    selected
                                                        ? "border-primary bg-primary text-primary-content"
                                                        : "border-base-content/25",
                                                ].join(" ")}
                                                aria-hidden="true"
                                            >
                                                {selected && <Check className="size-3"/>}
                                            </span>

                                            <span className="min-w-0 break-words">{county}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="text-[11px] leading-relaxed text-base-content/55">
                                An empty selection means access to all counties
                                in this institution. Select specific counties to
                                restrict geographic access.
                            </p>

                            {!canEditCountyScope && (
                                <p className="text-xs text-warning-content">
                                    Only a system superuser can change an
                                    administrator's county scope.
                                </p>
                            )}
                        </fieldset>
                    </div>

                    {/* Footer */}
                    <footer className="flex shrink-0 justify-end gap-2 border-t border-base-300 bg-base-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="btn btn-ghost btn-sm normal-case"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting || !canEditTarget}
                            className="btn btn-primary btn-sm min-w-28 normal-case"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" aria-hidden="true"/>
                                    Saving…
                                </>
                            ) : (
                                "Save changes"
                            )}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}