// frontend/src/components/moys/MYSServiceProviderForm.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { moysService } from "../../services/moysService";

const ORG_TYPE_CHOICES = [
  { value: "government", label: "Government" },
  { value: "ngo", label: "Non-Governmental Organization (NGO)" },
  { value: "private", label: "Private Organization" },
  { value: "community_based", label: "Community-Based Organization (CBO)" },
  { value: "faith_based", label: "Faith-Based Organization" },
  { value: "international", label: "International Organization" },
  { value: "other", label: "Other" },
];

const SERVICE_CATEGORY_CHOICES = [
  { value: "rehabilitation", label: "Rehabilitation" },
  { value: "tvet", label: "TVET" },
  { value: "employment", label: "Employment" },
  { value: "apprenticeship", label: "Apprenticeship" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "sports", label: "Sports" },
  { value: "psychosocial_support", label: "Psychosocial Support" },
  { value: "mentorship", label: "Mentorship" },
  { value: "education", label: "Education" },
  { value: "family_support", label: "Family Support" },
  { value: "community_support", label: "Community Support" },
  { value: "other", label: "Other" },
];

const TARGET_POPULATION_CHOICES = [
  { value: "youth", label: "Youth" },
  { value: "children", label: "Children" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "persons_with_disabilities", label: "Persons with Disabilities" },
  { value: "general_population", label: "General Population" },
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

const Textarea = ({ label, value, onChange, rows = 3, required }) => (
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

const normalizeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};

export default function MYSServiceProviderForm({ initial = {}, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);

  const [form, setForm] = useState({
    provider_id: initial?.provider_id || "",
    organization_name: initial?.organization_name || "",
    organization_type: initial?.organization_type || "",
    other_organization_type: initial?.other_organization_type || "",
    county: initial?.county || "",
    district: initial?.district || "",
    community: initial?.community || "",
    services_offered: initial?.services_offered || "",
    target_population: initial?.target_population || "",
    service_categories: normalizeArray(initial?.service_categories),
    other_service_category: initial?.other_service_category || "",
    contact_person: initial?.contact_person || "",
    telephone: initial?.telephone || "",
    email: initial?.email || "",
    referral_services_available: initial?.referral_services_available || "no",
    accreditation_authorization: initial?.accreditation_authorization || "",
    date_last_verified: initial?.date_last_verified || "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCategory = (val) => {
    setForm((f) => {
      const cats = f.service_categories.includes(val)
        ? f.service_categories.filter((c) => c !== val)
        : [...f.service_categories, val];
      return { ...f, service_categories: cats };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      
      Object.keys(form).forEach((key) => {
        if (key === "service_categories") return;
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          fd.append(key, form[key]);
        }
      });

      fd.append("service_categories", JSON.stringify(form.service_categories));

      if (isEditing) {
        await moysService.serviceProviders.update(initial.id, fd);
      } else {
        await moysService.serviceProviders.create(fd);
      }
      onSaved?.();
    } catch (ex) {
      console.error("Save Error:", ex.response?.data || ex);
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : ex.message;
      setErr(msg || "Failed to save service provider.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      {/* A. Provider Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">A. Provider Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Provider ID" value={form.provider_id} onChange={(e) => set("provider_id", e.target.value)} required />
          <Input label="Organization Name" value={form.organization_name} onChange={(e) => set("organization_name", e.target.value)} required />
          <Select label="Organization Type" value={form.organization_type} onChange={(e) => set("organization_type", e.target.value)} options={ORG_TYPE_CHOICES} required />
          
          {form.organization_type === "other" && (
            <Input label="Other Organization Type" value={form.other_organization_type} onChange={(e) => set("other_organization_type", e.target.value)} required />
          )}
        </div>
      </section>

      {/* B. Location */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">B. Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="County" value={form.county} onChange={(e) => set("county", e.target.value)} required />
          <Input label="District" value={form.district} onChange={(e) => set("district", e.target.value)} />
          <Input label="Community" value={form.community} onChange={(e) => set("community", e.target.value)} />
        </div>
      </section>

      {/* C. Services */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">C. Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select label="Target Population" value={form.target_population} onChange={(e) => set("target_population", e.target.value)} options={TARGET_POPULATION_CHOICES} />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Services Offered (Description)" value={form.services_offered} onChange={(e) => set("services_offered", e.target.value)} required />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-base-content/70 mb-2">Select Service Categories:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-base-200/50 p-4 rounded-lg border border-base-300">
            {SERVICE_CATEGORY_CHOICES.map((cat) => (
              <label key={cat.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={form.service_categories.includes(cat.value)}
                  onChange={() => toggleCategory(cat.value)}
                />
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        {form.service_categories.includes("other") && (
          <div className="mt-4">
            <Input label="Other Service Category Details" value={form.other_service_category} onChange={(e) => set("other_service_category", e.target.value)} required />
          </div>
        )}
      </section>

      {/* D. Contact Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">D. Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Contact Person" value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} required />
          <Input label="Telephone" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </section>

      {/* E. Referral & Accreditation */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">E. Referral & Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select label="Referral Services Available?" value={form.referral_services_available} onChange={(e) => set("referral_services_available", e.target.value)} options={YES_NO} />
          <Input label="Date Last Verified" type="date" value={form.date_last_verified} onChange={(e) => set("date_last_verified", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Textarea label="Accreditation / Authorization Details" value={form.accreditation_authorization} onChange={(e) => set("accreditation_authorization", e.target.value)} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Provider"}
        </button>
      </div>
    </form>
  );
}