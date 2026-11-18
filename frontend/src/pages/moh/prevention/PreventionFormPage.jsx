import { SchemaForm } from "../../../components/mog/SchemaForm";
import { FormActions } from "../../../components/ldea/fields";
import { useMOGForm } from "../../../components/mog/useMOGForm";
import { mohService } from "../../../services/mohService";

const EMPTY = {
  institution_name: "", address: "", date: "",
  district: "", county: "",
  sud_awareness: false, sud_communities: "",
  school_health_club: false, school_names: "",
  media_campaign: false, media_details: "",
  harm_reduction: false, harm_reduction_details: "",
  radio_talk_show: false, radio_details: "",
};

const SECTIONS = [
  { title: "Institution", fields: [
    { name: "institution_name", label: "Institution name", required: true },
    { name: "address", label: "Address", type: "textarea", rows: 2 },
    { fields: [
      { name: "date", label: "Report date", type: "date", required: true },
      { name: "county", label: "County" },
      { name: "district", label: "District" },
    ]},
  ]},
  { title: "Prevention activities", description: "Toggle the activities performed; the detail is required when an activity is on.", fields: [
    { name: "sud_awareness", label: "SUD awareness", type: "checkbox" },
    { name: "sud_communities", label: "Communities (comma-separated)", type: "textarea", rows: 2 },
    { name: "school_health_club", label: "School health clubs", type: "checkbox" },
    { name: "school_names", label: "School names (comma-separated)", type: "textarea", rows: 2 },
    { name: "media_campaign", label: "Media campaign", type: "checkbox" },
    { name: "media_details", label: "Media details", type: "textarea", rows: 2 },
    { name: "harm_reduction", label: "Harm reduction", type: "checkbox" },
    { name: "harm_reduction_details", label: "Harm reduction details", type: "textarea", rows: 2 },
    { name: "radio_talk_show", label: "Radio talk show", type: "checkbox" },
    { name: "radio_details", label: "Radio details", type: "textarea", rows: 2 },
  ]},
];

function normalize(form) {
  const out = { ...form };
  if (out.date === "") out.date = null;
  return out;
}

export default function PreventionFormPage() {
  const f = useMOGForm({
    resource: mohService.prevention,
    empty: EMPTY,
    normalize,
    redirectAfter: (r) => `/moh/prevention/${r.id}`,
  });

  return (
    <form onSubmit={f.submit} className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">
          {f.isEdit ? "Edit prevention report" : "New prevention report"}
        </h1>
      </header>
      {f.formError && (
        <div role="alert" className="rounded-[--radius-field] border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error">
          {f.formError}
        </div>
      )}
      <SchemaForm sections={SECTIONS} values={f.form} errors={f.fieldErrors} onChange={f.setField} disabled={f.submitting} />
      <FormActions submitting={f.submitting} onCancel={() => f.navigate(-1)} submitLabel={f.isEdit ? "Save changes" : "Create report"} />
    </form>
  );
}