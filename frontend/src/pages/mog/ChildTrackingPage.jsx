import { useEffect, useState } from "react";
import { ClipboardCheck, Plus, Search, Trash2 } from "lucide-react";
import FormModal from "../../components/mog/FormModal";
import { COUNTIES } from "../../constants/mogCounties";
import { mogService } from "../../services/mogService";

const EMPTY = {
  child_code: "", tracking_date: "", county: "",
  surname: "", first_name: "", middle_name: "", nickname: "", gender: "",
  date_of_birth: "", age: "", county_of_birth: "", county_of_origin: "",
  ethnic_group: "", current_address: "", district: "", community: "",
  protection_status: "", other_protection_status: "", further_information: "",
  immediate_action_required: false, additional_information: "",
  recommended_next_steps: "", referral_to_services: "",
  gbv_services: false, health: false, mental_health: false, ftr: false,
  alternative_care: false, other_referral: "",
  father_name: "", father_date_of_birth: "", father_nationality: "",
  father_county_origin: "", father_district_origin: "", father_status: "",
  father_address: "", father_contact_number: "",
  mother_name: "", mother_date_of_birth: "", mother_nationality: "",
  mother_county_origin: "", mother_district_origin: "", mother_status: "",
  mother_address: "", mother_contact_number: "",
  social_worker_signature: "",
};

const protectionOptions = [
  ["probable", "Probable"],
  ["confirmed", "Confirmed"],
  ["contact", "Contact"],
  ["suspected", "Suspected"],
  ["survivor", "Survivor"],
  ["other", "Other"],
];

const parentStatuses = ["living", "deceased", "missing", "unknown"];

function Field({ label, name, type = "text", value, onChange, required = false, options }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-base-content/70">{label}{required ? " *" : ""}</span>
      {options ? (
        <select name={name} value={value} required={required} onChange={onChange} className="w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm">
          <option value="">Select</option>
          {options.map((option) => {
            const [value, label] = Array.isArray(option)
              ? option
              : typeof option === "object"
                ? [option.value, option.label]
                : [option, option];
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
      ) : (
        <input name={name} type={type} value={value ?? ""} required={required} onChange={onChange} className="w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm" />
      )}
    </label>
  );
}

function TextArea({ label, name, value, onChange }) {
  return (
    <label className="block space-y-1 sm:col-span-2">
      <span className="text-xs font-medium text-base-content/70">{label}</span>
      <textarea name={name} value={value ?? ""} onChange={onChange} rows={3} className="w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm" />
    </label>
  );
}

export default function ChildTrackingPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    setLoading(true);
    mogService.childTracking.list({ page_size: 100 })
      .then((data) => setRows(Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : [])))
      .catch((e) => setError(e?.response?.data?.detail || e.message || "Failed to load records"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const change = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await mogService.childTracking.create(form);
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || Object.values(e?.response?.data || {}).flat().join(" ") || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    if (!window.confirm(`Delete Child Tracking record ${record.child_code}?`)) return;
    try {
      await mogService.childTracking.remove(record.id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to delete record");
    }
  };

  const filtered = rows.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [row.child_code, row.first_name, row.surname, row.county, row.community]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(needle));
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-content"><ClipboardCheck className="size-5" /></span>
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Child Tracking Tool</h1>
            <p className="text-sm text-base-content/60">Ministry of Gender, Children and Social Protection</p>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}><Plus className="size-4" />New record</button>
      </div>

      <div className="rounded-lg border border-base-300 bg-base-100 p-3">
        <label className="flex items-center gap-2">
          <Search className="size-4 text-base-content/50" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code, name, county or community" className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      {error && <div className="alert alert-error text-sm">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
        <table className="table">
          <thead><tr><th>Child code</th><th>Child</th><th>County</th><th>Status</th><th>Immediate action</th><th>Date</th><th /></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="py-10 text-center text-base-content/60">Loading...</td></tr> :
              filtered.length === 0 ? <tr><td colSpan="7" className="py-10 text-center text-base-content/60">No child tracking records found.</td></tr> :
              filtered.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold">{row.child_code}</td>
                  <td>{row.first_name} {row.middle_name} {row.surname}</td>
                  <td>{row.county}</td>
                  <td className="capitalize">{row.protection_status || "—"}</td>
                  <td>{row.immediate_action_required ? "Yes" : "No"}</td>
                  <td>{row.tracking_date || "—"}</td>
                  <td><button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => remove(row)} title="Delete"><Trash2 className="size-4" /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <FormModal title="Child Tracking Tool" isOpen={open} onClose={() => setOpen(false)} busy={saving}>
        <form onSubmit={submit} className="space-y-5 p-4">
          <section>
            <h3 className="mb-3 border-b border-base-300 pb-2 text-sm font-semibold">I. Child Personal Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Child's Code" name="child_code" value={form.child_code} onChange={change} required />
              <Field label="Date" name="tracking_date" type="date" value={form.tracking_date} onChange={change} required />
              <Field label="County" name="county" value={form.county} onChange={change} required options={COUNTIES} />
              <Field label="Surname" name="surname" value={form.surname} onChange={change} required />
              <Field label="First name" name="first_name" value={form.first_name} onChange={change} required />
              <Field label="Middle name" name="middle_name" value={form.middle_name} onChange={change} />
              <Field label="Nickname" name="nickname" value={form.nickname} onChange={change} />
              <Field label="Gender" name="gender" value={form.gender} onChange={change} required options={[["male","Male"],["female","Female"]]} />
              <Field label="Date of birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={change} />
              <Field label="Age (years)" name="age" type="number" value={form.age} onChange={change} />
              <Field label="County of birth" name="county_of_birth" value={form.county_of_birth} onChange={change} options={COUNTIES} />
              <Field label="County of origin" name="county_of_origin" value={form.county_of_origin} onChange={change} options={COUNTIES} />
              <Field label="Ethnic group" name="ethnic_group" value={form.ethnic_group} onChange={change} />
              <TextArea label="Child's current address" name="current_address" value={form.current_address} onChange={change} />
              <Field label="District" name="district" value={form.district} onChange={change} />
              <Field label="Community" name="community" value={form.community} onChange={change} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 border-b border-base-300 pb-2 text-sm font-semibold">II. Additional Child Protection Concerns</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Protection status" name="protection_status" value={form.protection_status} onChange={change} options={protectionOptions} />
              <Field label="If other, please specify" name="other_protection_status" value={form.other_protection_status} onChange={change} />
              <TextArea label="Further information" name="further_information" value={form.further_information} onChange={change} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="immediate_action_required" checked={form.immediate_action_required} onChange={change} />Immediate action required</label>
            </div>
          </section>

          <section>
            <h3 className="mb-3 border-b border-base-300 pb-2 text-sm font-semibold">III. Case History</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextArea label="Additional information" name="additional_information" value={form.additional_information} onChange={change} />
              <TextArea label="Recommended next steps" name="recommended_next_steps" value={form.recommended_next_steps} onChange={change} />
              <TextArea label="Referral to services / support" name="referral_to_services" value={form.referral_to_services} onChange={change} />
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {[["gbv_services","GBV services"],["health","Health"],["mental_health","Mental health"],["ftr","FTR"],["alternative_care","Alternative care"]].map(([name,label]) =>
                  <label key={name} className="flex items-center gap-2"><input type="checkbox" name={name} checked={form[name]} onChange={change} />{label}</label>)}
              </div>
              <TextArea label="Other referral" name="other_referral" value={form.other_referral} onChange={change} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 border-b border-base-300 pb-2 text-sm font-semibold">IV. Child's Family Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Father's name" name="father_name" value={form.father_name} onChange={change} />
              <Field label="Father's date of birth" name="father_date_of_birth" type="date" value={form.father_date_of_birth} onChange={change} />
              <Field label="Father nationality" name="father_nationality" value={form.father_nationality} onChange={change} />
              <Field label="Father county of origin" name="father_county_origin" value={form.father_county_origin} onChange={change} options={COUNTIES} />
              <Field label="Father district or town of origin" name="father_district_origin" value={form.father_district_origin} onChange={change} />
              <Field label="Father status" name="father_status" value={form.father_status} onChange={change} options={parentStatuses} />
              <TextArea label="Father current or last known address" name="father_address" value={form.father_address} onChange={change} />
              <Field label="Father contact number" name="father_contact_number" value={form.father_contact_number} onChange={change} />

              <Field label="Mother's name" name="mother_name" value={form.mother_name} onChange={change} />
              <Field label="Mother's date of birth" name="mother_date_of_birth" type="date" value={form.mother_date_of_birth} onChange={change} />
              <Field label="Mother nationality" name="mother_nationality" value={form.mother_nationality} onChange={change} />
              <Field label="Mother county of origin" name="mother_county_origin" value={form.mother_county_origin} onChange={change} options={COUNTIES} />
              <Field label="Mother district or town of origin" name="mother_district_origin" value={form.mother_district_origin} onChange={change} />
              <Field label="Mother status" name="mother_status" value={form.mother_status} onChange={change} options={parentStatuses} />
              <TextArea label="Mother current or last known address" name="mother_address" value={form.mother_address} onChange={change} />
              <Field label="Mother contact number" name="mother_contact_number" value={form.mother_contact_number} onChange={change} />
              <Field label="Social worker's signature" name="social_worker_signature" value={form.social_worker_signature} onChange={change} />
            </div>
          </section>

          <div className="flex justify-end gap-2 border-t border-base-300 pt-4">
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save record"}</button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
