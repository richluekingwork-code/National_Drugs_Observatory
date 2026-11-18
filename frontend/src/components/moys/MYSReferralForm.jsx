// frontend/src/components/moys/MYSReferralForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const SOURCE_CHOICES = [
  { value: "family", label: "Family" },
  { value: "community", label: "Community" },
  { value: "moh", label: "MOH - Ministry of Health" },
  { value: "moj", label: "MOJ - Ministry of Justice" },
  { value: "mgcsp", label: "MGCSP" },
  { value: "police", label: "Police" },
  { value: "ngo_cso", label: "NGO / CSO" },
  { value: "other", label: "Other" },
];

const REASON_CHOICES = [
  { value: "substance_use", label: "Substance-use concern" },
  { value: "vulnerability", label: "Vulnerability" },
  { value: "street_involvement", label: "Street involvement" },
  { value: "conflict_with_law", label: "Conflict with the law" },
  { value: "unemployment", label: "Unemployment" },
  { value: "school_dropout", label: "School dropout" },
  { value: "family_related", label: "Family-related concern" },
  { value: "other", label: "Other" },
];

const ACTION_CHOICES = [
  { value: "referral_received", label: "Referral received" },
  { value: "referral_made", label: "Referral made" },
  { value: "follow_up_required", label: "Follow-up required" },
];

const STATUS_CHOICES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
];

// Coerce whatever the API gives us into a proper array of strings.
function normalizeReasons(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    if (!raw.trim()) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      // comma-separated fallback
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

const Input = ({ label, type = "text", value, onChange, required, placeholder }) => (
  <label className="block">
    <span className="text-xs font-medium text-base-content/70">
      {label} {required && <span className="text-error">*</span>}
    </span>
    <input
      type={type}
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none"
      value={value || ""}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
    />
  </label>
);

const Select = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="text-xs font-medium text-base-content/70">{label}</span>
    <select
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none bg-base-100"
      value={value || ""}
      onChange={onChange}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

const Textarea = ({ label, value, onChange, rows = 2, required }) => (
  <label className="block col-span-1 md:col-span-2">
    <span className="text-xs font-medium text-base-content/70">
      {label} {required && <span className="text-error">*</span>}
    </span>
    <textarea
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none"
      rows={rows}
      value={value || ""}
      onChange={onChange}
      required={required}
    />
  </label>
);

export default function MYSReferralForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    referral_id: initial?.referral_id || "",
    date_of_referral: initial?.date_of_referral || new Date().toISOString().split("T")[0],
    referral_source: initial?.referral_source || "",
    referring_institution_person: initial?.referring_institution_person || "",
    referring_contact: initial?.referring_contact || "",
    reason_for_referral: initial?.reason_for_referral || "",
    immediate_concern_identified: initial?.immediate_concern_identified || "",
    reasons_for_referral: normalizeReasons(initial?.reasons_for_referral),
    other_reason_details: initial?.other_reason_details || "",
    action_taken: initial?.action_taken || "",
    referred_to: initial?.referred_to || "",
    date_referred: initial?.date_referred || "",
    mys_officer: initial?.mys_officer || "",
    officer_signature: initial?.officer_signature || "",
    signature_reference: initial?.signature_reference || "",
    referral_status: initial?.referral_status || "pending",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleReason = (val) => {
    setForm((f) => {
      const reasons = f.reasons_for_referral.includes(val)
        ? f.reasons_for_referral.filter((r) => r !== val)
        : [...f.reasons_for_referral, val];
      return { ...f, reasons_for_referral: reasons };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      // Build FormData for BOTH create and edit
      const fd = new FormData();

      // 1. Regular fields (skip empty so PATCH only touches provided values)
      Object.keys(form).forEach((key) => {
        if (key === "reasons_for_referral") return;
        const v = form[key];
        if (v !== null && v !== undefined && v !== "") {
          fd.append(key, v);
        }
      });

      // 2. Reasons array — sent as a JSON string, backend parser handles it
      fd.append("reasons_for_referral", JSON.stringify(form.reasons_for_referral || []));

      // 3. Link the person ONLY on create (PATCH must not reassign FK)
      if (!isEditing && initial?.person_id) {
        fd.append("persons", initial.person_id);
      }

      // 4. Create vs Update
      if (isEditing) {
        // moysService.referrals.update now correctly preserves FormData
        await moysService.referrals.update(initial.id, fd);
      } else {
        await moysService.referrals.create(fd);
      }

      onSaved?.();
    } catch (ex) {
      const data = ex?.response?.data;
      const msg =
        typeof data === "string"
          ? data
          : data?.detail
          ? data.detail
          : data
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : ex.message;
      setErr(msg || "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && (
        <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">
          {err}
        </div>
      )}

      {/* ================= REFERRAL DETAILS ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">
          Referral Details {isEditing && <span className="text-xs font-normal text-base-content/50">· Editing</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Referral ID" value={form.referral_id} onChange={(e) => set("referral_id", e.target.value)} placeholder="e.g. REF-2026-001" />
          <Input label="Date of Referral" type="date" value={form.date_of_referral} onChange={(e) => set("date_of_referral", e.target.value)} required />
          <Select label="Referral Source" value={form.referral_source} onChange={(e) => set("referral_source", e.target.value)} options={SOURCE_CHOICES} />

          <Input label="Referring Person/Institution" value={form.referring_institution_person} onChange={(e) => set("referring_institution_person", e.target.value)} required />
          <Input label="Referring Contact" value={form.referring_contact} onChange={(e) => set("referring_contact", e.target.value)} />
          <Select label="Referral Status" value={form.referral_status} onChange={(e) => set("referral_status", e.target.value)} options={STATUS_CHOICES} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Primary Reason (Detailed)" value={form.reason_for_referral} onChange={(e) => set("reason_for_referral", e.target.value)} required rows={3} />
          <Textarea label="Immediate Concern Identified" value={form.immediate_concern_identified} onChange={(e) => set("immediate_concern_identified", e.target.value)} rows={2} />

          {form.reasons_for_referral.includes("other") && (
            <Textarea label="Other Reason Details" value={form.other_reason_details} onChange={(e) => set("other_reason_details", e.target.value)} rows={2} />
          )}
        </div>
      </section>

      {/* ================= REASONS ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Reason for Referral</h3>
        <div className="mt-4">
          <p className="text-xs font-medium text-base-content/70 mb-2">Select applicable categories:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-base-200/50 p-4 rounded-lg border border-base-300">
            {REASON_CHOICES.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={form.reasons_for_referral.includes(r.value)}
                  onChange={() => toggleReason(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ACTION & OFFICER ================= */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">MYS Action & Officer</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Action Taken" value={form.action_taken} onChange={(e) => set("action_taken", e.target.value)} options={ACTION_CHOICES} />
          <Input label="Referred To" value={form.referred_to} onChange={(e) => set("referred_to", e.target.value)} />
          <Input label="Date Referred" type="date" value={form.date_referred} onChange={(e) => set("date_referred", e.target.value)} />
          <Input label="MYS Officer Name" value={form.mys_officer} onChange={(e) => set("mys_officer", e.target.value)} required />
          <Input label="Officer Signature" value={form.officer_signature} onChange={(e) => set("officer_signature", e.target.value)} />

          <Input
            label="Signature Reference"
            value={form.signature_reference}
            onChange={(e) => set("signature_reference", e.target.value)}
            required
            placeholder="e.g. Signed physically or digital ref ID"
          />
        </div>
      </section>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Save Referral"}
        </button>
      </div>
    </form>
  );
}