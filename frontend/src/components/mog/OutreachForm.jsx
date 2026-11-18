// frontend/src/components/mog/OutreachForm.jsx
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { mogService } from "../../services/mogService";
import { useAuth } from "../../contexts/AuthContext";

const COUNTIES = [
  { value: "bomi", label: "Bomi" },
  { value: "bong", label: "Bong" },
  { value: "gbarpolu", label: "Gbarpolu" },
  { value: "grand_bassa", label: "Grand Bassa" },
  { value: "grand_cape_mount", label: "Grand Cape Mount" },
  { value: "grand_gedeh", label: "Grand Gedeh" },
  { value: "grand_kru", label: "Grand Kru" },
  { value: "lofa", label: "Lofa" },
  { value: "margibi", label: "Margibi" },
  { value: "maryland", label: "Maryland" },
  { value: "montserrado", label: "Montserrado" },
  { value: "nimba", label: "Nimba" },
  { value: "river_cess", label: "River Cess" },
  { value: "river_gee", label: "River Gee" },
  { value: "sinoe", label: "Sinoe" },
];

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

const Textarea = ({ label, value, onChange, rows = 2 }) => (
  <label className="block col-span-1 md:col-span-2">
    <span className="text-xs font-medium text-base-content/70">{label}</span>
    <textarea
      className="w-full mt-1 border border-base-300 rounded-md p-2 text-sm focus:border-primary focus:outline-none"
      rows={rows}
      value={value || ""}
      onChange={onChange}
    />
  </label>
);

export default function OutreachForm({ initial, onSaved, onCancel }) {
  const isEditing = Boolean(initial?.id);
  const { currentMembership } = useAuth();

  const allowedCounties = useMemo(() => {
    const assigned = currentMembership?.counties || [];
    if (assigned.length === 0) return COUNTIES;
    const normalizedAssigned = assigned.map(c => typeof c === 'string' ? c.toLowerCase() : c);
    return COUNTIES.filter((c) => normalizedAssigned.includes(c.value.toLowerCase()));
  }, [currentMembership]);

  const [form, setForm] = useState({
    person_id: initial?.person_id || "",
    follow_county: initial?.follow_county || "",
    reporting_date: initial?.reporting_date || new Date().toISOString().split("T")[0],
    reporting_period: initial?.reporting_period || "",
    organization: initial?.organization || "",
    county_district_community: initial?.county_district_community || "",
    outreach_officer: initial?.outreach_officer || "",
    contact_information: initial?.contact_information || "",
    
    activity_date: initial?.activity_date || "",
    community_location: initial?.community_location || "",
    activity_type: initial?.activity_type || "",
    target_group: initial?.target_group || "",
    number_reached: initial?.number_reached || "",
    key_issues_identified: initial?.key_issues_identified || "",
    topics_discussed: initial?.topics_discussed || "",
    community_concerns: initial?.community_concerns || "",
    
    risk_factors: initial?.risk_factors || "",
    immediate_needs: initial?.immediate_needs || "",
    
    followup_details: initial?.followup_details || "",
    followup_type: initial?.followup_type || "",
    progress_observed: initial?.progress_observed || "",
    challenges_identified: initial?.challenges_identified || "",
    action_taken: initial?.action_taken || "",
    next_followup_date: initial?.next_followup_date || "",
    
    emotional_condition: initial?.emotional_condition || "",
    family_support_status: initial?.family_support_status || "",
    school_attendance: initial?.school_attendance || "",
    behavioral_improvement: initial?.behavioral_improvement || "",
    additional_support_needed: initial?.additional_support_needed || "",
    
    referral_date: initial?.referral_date || "",
    referred_by: initial?.referred_by || "",
    receiving_institution: initial?.receiving_institution || "",
    contact_person: initial?.contact_person || "",
    contact_number: initial?.contact_number || "",
    reason_for_referral: initial?.reason_for_referral || "",
    services_accessed: initial?.services_accessed || "",
    feedback_from_provider: initial?.feedback_from_provider || "",
    outcome: initial?.outcome || "",
    followup_needed: initial?.followup_needed || "",
    challenges: initial?.challenges || "",
    recommendation: initial?.recommendation || "",
    
    institution_name: initial?.institution_name || "",
    location: initial?.location || "",
    assessment_datetime: initial?.assessment_datetime || "",
    interviewee_name: initial?.interviewee_name || "",
    interviewee_position: initial?.interviewee_position || "",
    interviewee_contact: initial?.interviewee_contact || "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const payload = { ...form };
      const dateFields = ["reporting_date", "activity_date", "next_followup_date", "referral_date", "assessment_datetime"];
      dateFields.forEach(f => { if (!payload[f]) payload[f] = null; });
      
      if (isEditing) {
        await mogService.outreach.update(initial.id, payload);
      } else {
        await mogService.outreach.create(payload);
      }
      onSaved();
    } catch (ex) {
      const data = ex?.response?.data;
      const msg = typeof data === "string" ? data 
        : data?.detail ? data.detail 
        : data ? Object.entries(data)[0]?.map(String).join(": ")
        : ex.message;
      setErr(msg || "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-8">
      {err && <div className="p-3 text-sm text-error bg-error/10 rounded-md border border-error/20">{err}</div>}
      
      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Reporting Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Reporting Date" type="date" value={form.reporting_date} onChange={(e) => set("reporting_date", e.target.value)} required />
          <Input label="Reporting Period" value={form.reporting_period} onChange={(e) => set("reporting_period", e.target.value)} required />
          <Input label="Organization" value={form.organization} onChange={(e) => set("organization", e.target.value)} required />
          <Input label="County/District/Community" value={form.county_district_community} onChange={(e) => set("county_district_community", e.target.value)} required />
          <Input label="Outreach Officer" value={form.outreach_officer} onChange={(e) => set("outreach_officer", e.target.value)} required />
          <Input label="Contact Information" value={form.contact_information} onChange={(e) => set("contact_information", e.target.value)} required />
          <Select label="Follow-up County" value={form.follow_county} onChange={(e) => set("follow_county", e.target.value)} options={allowedCounties} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Activity Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Activity Date" type="date" value={form.activity_date} onChange={(e) => set("activity_date", e.target.value)} />
          <Input label="Community Location" value={form.community_location} onChange={(e) => set("community_location", e.target.value)} />
          <Input label="Activity Type" value={form.activity_type} onChange={(e) => set("activity_type", e.target.value)} />
          <Input label="Target Group" value={form.target_group} onChange={(e) => set("target_group", e.target.value)} />
          <Input label="Number Reached" type="number" value={form.number_reached} onChange={(e) => set("number_reached", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Textarea label="Key Issues Identified" value={form.key_issues_identified} onChange={(e) => set("key_issues_identified", e.target.value)} />
          <Textarea label="Topics Discussed" value={form.topics_discussed} onChange={(e) => set("topics_discussed", e.target.value)} />
          <Textarea label="Community Concerns" value={form.community_concerns} onChange={(e) => set("community_concerns", e.target.value)} />
          <Textarea label="Risk Factors" value={form.risk_factors} onChange={(e) => set("risk_factors", e.target.value)} />
          <Textarea label="Immediate Needs" value={form.immediate_needs} onChange={(e) => set("immediate_needs", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Follow-up & Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Follow-up Type" value={form.followup_type} onChange={(e) => set("followup_type", e.target.value)} />
          <Input label="Next Follow-up Date" type="date" value={form.next_followup_date} onChange={(e) => set("next_followup_date", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Textarea label="Follow-up Details" value={form.followup_details} onChange={(e) => set("followup_details", e.target.value)} />
          <Textarea label="Progress Observed" value={form.progress_observed} onChange={(e) => set("progress_observed", e.target.value)} />
          <Textarea label="Challenges Identified" value={form.challenges_identified} onChange={(e) => set("challenges_identified", e.target.value)} />
          <Textarea label="Action Taken" value={form.action_taken} onChange={(e) => set("action_taken", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <Input label="Emotional Condition" value={form.emotional_condition} onChange={(e) => set("emotional_condition", e.target.value)} />
          <Input label="Family Support Status" value={form.family_support_status} onChange={(e) => set("family_support_status", e.target.value)} />
          <Input label="School Attendance" value={form.school_attendance} onChange={(e) => set("school_attendance", e.target.value)} />
          <Input label="Behavioral Improvement" value={form.behavioral_improvement} onChange={(e) => set("behavioral_improvement", e.target.value)} />
          <Textarea label="Additional Support Needed" value={form.additional_support_needed} onChange={(e) => set("additional_support_needed", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Referral</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Referral Date" type="date" value={form.referral_date} onChange={(e) => set("referral_date", e.target.value)} />
          <Input label="Referred By" value={form.referred_by} onChange={(e) => set("referred_by", e.target.value)} />
          <Input label="Receiving Institution" value={form.receiving_institution} onChange={(e) => set("receiving_institution", e.target.value)} />
          <Input label="Contact Person" value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} />
          <Input label="Contact Number" value={form.contact_number} onChange={(e) => set("contact_number", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Textarea label="Reason for Referral" value={form.reason_for_referral} onChange={(e) => set("reason_for_referral", e.target.value)} />
          <Textarea label="Services Accessed" value={form.services_accessed} onChange={(e) => set("services_accessed", e.target.value)} />
          <Textarea label="Feedback from Provider" value={form.feedback_from_provider} onChange={(e) => set("feedback_from_provider", e.target.value)} />
          <Textarea label="Outcome" value={form.outcome} onChange={(e) => set("outcome", e.target.value)} />
          <Textarea label="Follow-up Needed" value={form.followup_needed} onChange={(e) => set("followup_needed", e.target.value)} />
          <Textarea label="Challenges" value={form.challenges} onChange={(e) => set("challenges", e.target.value)} />
          <Textarea label="Recommendation" value={form.recommendation} onChange={(e) => set("recommendation", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-base-300 pb-2 text-base-content/80">Assessment / Interview Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Institution Name" value={form.institution_name} onChange={(e) => set("institution_name", e.target.value)} />
          <Input label="Location" value={form.location} onChange={(e) => set("location", e.target.value)} />
          <Input label="Assessment Date/Time" type="datetime-local" value={form.assessment_datetime} onChange={(e) => set("assessment_datetime", e.target.value)} />
          <Input label="Interviewee Name" value={form.interviewee_name} onChange={(e) => set("interviewee_name", e.target.value)} />
          <Input label="Interviewee Position" value={form.interviewee_position} onChange={(e) => set("interviewee_position", e.target.value)} />
          <Input label="Interviewee Contact" value={form.interviewee_contact} onChange={(e) => set("interviewee_contact", e.target.value)} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-base-300 mt-6 sticky bottom-0 bg-base-100 z-10 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium hover:bg-base-200 rounded-md">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-medium text-primary-content bg-primary hover:brightness-110 rounded-md flex items-center gap-2 disabled:opacity-50 shadow-sm">
          {busy && <Loader2 className="size-4 animate-spin" />} 
          {isEditing ? "Save Changes" : "Save Outreach"}
        </button>
      </div>
    </form>
  );
}