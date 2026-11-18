// frontend/src/components/moys/MYSReceiptForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const REASON_CHOICES = [
  { value: "substance_use", label: "Substance Use" },
  { value: "vulnerability", label: "Vulnerability" },
  { value: "street_involvement", label: "Street Involvement" },
  { value: "conflict_with_law", label: "Conflict with the Law" },
  { value: "unemployment", label: "Unemployment" },
  { value: "school_dropout", label: "School Dropout" },
  { value: "family_related", label: "Family Related" },
  { value: "other", label: "Other" },
];

const DISPOSITION_CHOICES = [
  { value: "accepted", label: "Accepted for MYS Intervention" },
  { value: "referred", label: "Referred to Another Institution" },
  { value: "returned", label: "Returned for Additional Information" },
  { value: "pending", label: "Pending Assessment" },
  { value: "other", label: "Other" },
];

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const Input = ({ label, type = "text", value, onChange, required }) => (
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
    />
  </label>
);

const Select = ({ label, value, onChange, options, required }) => (
  <label className="block">
    <span className="text-xs font-medium text-base-content/70">
      {label} {required && <span className="text-error">*</span>}
    </span>
    <select
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none bg-base-100"
      value={value || ""}
      onChange={onChange}
      required={required}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

const Textarea = ({ label, value, onChange, rows = 2, required }) => (
  <label className="block col-span-1 md:col-span-3">
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

export default function MYSReceiptForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    referral_id: initial?.referral_id || "",
    beneficiary_ID: initial?.beneficiary_ID || "",
    date_received: initial?.date_received || new Date().toISOString().split("T")[0],
    referring_institution: initial?.referring_institution || "",
    referring_officer: initial?.referring_officer || "",
    reason_for_referral: initial?.reason_for_referral || "",
    
    background_information_provided: initial?.background_information_provided || "no",
    supporting_documents_provided: initial?.supporting_documents_provided || "no",
    previous_service_received: initial?.previous_service_received || "no",
    previous_institution_facility: initial?.previous_institution_facility || "",
    
    disposition: initial?.disposition || "",
    receiving_referral_institution: initial?.receiving_referral_institution || "",
    reason_for_disposition: initial?.reason_for_disposition || "",
    disposition_date: initial?.disposition_date || new Date().toISOString().split("T")[0],
    responsible_mys_officer: initial?.responsible_mys_officer || "",
    other_disposition_details: initial?.other_disposition_details || "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          fd.append(key, form[key]);
        }
      });

      // FIX: Append the numeric person ID properly for ManyToMany relations
      if (!isEditing && initial?.person_id) {
        fd.append("persons", initial.person_id);
      }

      if (isEditing) {
        await moysService.receipts.update(initial.id, fd);
      } else {
        await moysService.receipts.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : ex.message;
      setErr(msg || "Failed to save receipt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      {/* A. Referral Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Referral Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Referral ID" value={form.referral_id} onChange={(e) => set("referral_id", e.target.value)} required />
          <Input label="Beneficiary ID" value={form.beneficiary_ID} onChange={(e) => set("beneficiary_ID", e.target.value)} required />
          <Input label="Date Received" type="date" value={form.date_received} onChange={(e) => set("date_received", e.target.value)} required />
          
          <Input label="Referring Institution" value={form.referring_institution} onChange={(e) => set("referring_institution", e.target.value)} required />
          <Input label="Referring Officer" value={form.referring_officer} onChange={(e) => set("referring_officer", e.target.value)} required />
          <Select label="Reason for Referral" value={form.reason_for_referral} onChange={(e) => set("reason_for_referral", e.target.value)} options={REASON_CHOICES} required />
        </div>
      </section>

      {/* B. Received Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Information Received</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Background Info Provided?" value={form.background_information_provided} onChange={(e) => set("background_information_provided", e.target.value)} options={YES_NO} />
          <Select label="Supporting Docs Provided?" value={form.supporting_documents_provided} onChange={(e) => set("supporting_documents_provided", e.target.value)} options={YES_NO} />
          <Select label="Previous Service Received?" value={form.previous_service_received} onChange={(e) => set("previous_service_received", e.target.value)} options={YES_NO} />
          <Input label="Previous Institution/Facility" value={form.previous_institution_facility} onChange={(e) => set("previous_institution_facility", e.target.value)} />
        </div>
      </section>

      {/* C. Disposition */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. MYS Disposition</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Disposition" value={form.disposition} onChange={(e) => set("disposition", e.target.value)} options={DISPOSITION_CHOICES} required />
          <Input label="Disposition Date" type="date" value={form.disposition_date} onChange={(e) => set("disposition_date", e.target.value)} required />
          <Input label="Responsible MYS Officer" value={form.responsible_mys_officer} onChange={(e) => set("responsible_mys_officer", e.target.value)} required />
          
          {/* Conditional: Receiving Institution (Only if referred) */}
          {form.disposition === "referred" && (
            <Input label="Receiving Referral Institution" value={form.receiving_referral_institution} onChange={(e) => set("receiving_referral_institution", e.target.value)} required />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Reason for Disposition" value={form.reason_for_disposition} onChange={(e) => set("reason_for_disposition", e.target.value)} rows={3} required />
          
          {/* Conditional: Other Details (Only if other) */}
          {form.disposition === "other" && (
            <Textarea label="Other Disposition Details" value={form.other_disposition_details} onChange={(e) => set("other_disposition_details", e.target.value)} rows={2} required />
          )}
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Receipt"}
        </button>
      </div>
    </form>
  );
}