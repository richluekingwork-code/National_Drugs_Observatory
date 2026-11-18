import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, User, FileText, Scale, ShieldAlert, 
  Gavel, Calendar, CheckCircle, Clock, DollarSign, 
  PlusCircle, Fingerprint, MessageSquare, AlertTriangle, UserCheck,
  Pill
} from "lucide-react";
import { mojService } from "../../../services/mojService";
import { useRoles } from "../../../hooks/useRoles"; // <--- IMPORT HOOK

const REVIEW_DECISIONS = [
  { value: "draft", label: "Draft" },
  { value: "recommended", label: "Recommend for Prosecution" },
  { value: "pending_info", label: "Request More Info from LDEA" },
  { value: "rejected", label: "Recommend for Closure" },
];

const HEARING_TYPES = [
  { value: "Arraignment", label: "Arraignment" },
  { value: "Mention", label: "Mention" },
  { value: "Trial", label: "Trial" },
  { value: "Ruling", label: "Ruling" },
  { value: "Sentencing", label: "Sentencing" },
];

const JUDGMENT_TYPES = [
  { value: "conviction", label: "Conviction" },
  { value: "acquittal", label: "Acquittal" },
  { value: "dismissal", label: "Dismissal" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "other", label: "Other" },
];

export default function MOJCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = useRoles(); // <--- USE canWrite
  
  const [activeTab, setActiveTab] = useState("overview");
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [assignments, setAssignments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [courtCases, setCourtCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fines, setFines] = useState([]);
  const [infoRequests, setInfoRequests] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [seizures, setSeizures] = useState([]);

  // Form states
  const [assignmentForm, setAssignmentForm] = useState({ prosecutor: "", notes: "" });
  const [reviewForm, setReviewForm] = useState({ summary: "", gaps_identified: "", decision: "draft" });
  const [courtForm, setCourtForm] = useState({ court_name: "", court_case_number: "", filing_date: "", prosecutor: "" });
  const [hearingForm, setHearingForm] = useState({
    court_case: "", hearing_date: "", hearing_time: "", hearing_type: "Mention",
    outcome: "", is_adjourned: false, adjournment_reason: "", next_hearing_date: ""
  });
  const [orderForm, setOrderForm] = useState({
    court_case: "", judgment_type: "conviction", date_issued: "", summary: "",
    has_fine: false, total_amount: "", currency: "USD", deadline: ""
  });
  const [paymentForm, setPaymentForm] = useState({ amount: "", payment_date: "", transaction_reference: "" });
  const [selectedFineForPayment, setSelectedFineForPayment] = useState(null);
  const [infoRequestForm, setInfoRequestForm] = useState({ request_details: "" });
  const [appealForm, setAppealForm] = useState({ court_case: "", appealing_party: "Defendant", date_filed: "", grounds_for_appeal: "" });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [id]);

  async function fetchAllData() {
    try {
      setLoading(true);
      
      const caseRes = await mojService.cases.get(id);
      setRecord(caseRes.data);

      try {
        const assignRes = await mojService.assignments.list({ case: id });
        setAssignments(assignRes.data.results || assignRes.data);
      } catch (err) { console.error(err); }

      try {
        const reviewsRes = await mojService.legalReviews.list({ case: id });
        setReviews(reviewsRes.data.results || reviewsRes.data);
      } catch (err) { console.error(err); }

      try {
        const courtRes = await mojService.courtCases.list({ case: id });
        const courts = courtRes.data.results || courtRes.data;
        setCourtCases(courts);
        if (courts.length > 0) {
          setHearingForm(prev => ({ ...prev, court_case: courts[0].id }));
          setOrderForm(prev => ({ ...prev, court_case: courts[0].id }));
          setAppealForm(prev => ({ ...prev, court_case: courts[0].id }));
        }
      } catch (err) { console.error(err); }

      try {
        const hearingsRes = await mojService.hearings.list({ case: id });
        setHearings(hearingsRes.data.results || hearingsRes.data);
      } catch (err) { console.error(err); }

      try {
        const ordersRes = await mojService.orders.list({ case: id });
        setOrders(ordersRes.data.results || ordersRes.data);
      } catch (err) { console.error(err); }

      try {
        const finesRes = await mojService.fines.list({ case: id });
        setFines(finesRes.data.results || finesRes.data);
      } catch (err) { console.error(err); }

      try {
        const infoRes = await mojService.infoRequests.list({ case: id });
        setInfoRequests(infoRes.data.results || infoRes.data);
      } catch (err) { console.error(err); }

      try {
        const appealsRes = await mojService.appeals.list({ case: id });
        setAppeals(appealsRes.data.results || appealsRes.data);
      } catch (err) { console.error(err); }

      try {
        const seizuresRes = await mojService.seizures.list();
        setSeizures(seizuresRes.data.results || seizuresRes.data);
      } catch (err) { console.error("Seizures error", err); }

    } catch (err) {
      console.error("Main case error", err);
    } finally {
      setLoading(false);
    }
  }

  // --- SUBMIT HANDLERS ---
  async function submitAssignment(e) {
    e.preventDefault(); setSubmitting(true);
    try {
      await mojService.assignments.create({ ...assignmentForm, case: id });
      setAssignmentForm({ prosecutor: "", notes: "" });
      fetchAllData();
    } catch (err) { alert("Error assigning prosecutor: " + JSON.stringify(err.response?.data || err.message)); } finally { setSubmitting(false); }
  }

  async function submitReview(e) {
    e.preventDefault(); setSubmitting(true);
    try {
      await mojService.legalReviews.create({ ...reviewForm, case: id });
      setReviewForm({ summary: "", gaps_identified: "", decision: "draft" });
      fetchAllData();
    } catch (err) { alert("Error saving review"); } finally { setSubmitting(false); }
  }

  async function submitCourtCase(e) {
    e.preventDefault(); setSubmitting(true);
    try {
      await mojService.courtCases.create({ ...courtForm, original_case: id });
      setCourtForm({ court_name: "", court_case_number: "", filing_date: "", prosecutor: "" });
      fetchAllData();
    } catch (err) { alert("Error filing court case"); } finally { setSubmitting(false); }
  }

  async function submitHearing(e) {
    e.preventDefault();
    if (!hearingForm.court_case) return alert("File a court case first.");
    setSubmitting(true);
    try {
      const payload = { ...hearingForm, hearing_time: hearingForm.hearing_time || null, next_hearing_date: hearingForm.next_hearing_date || null };
      await mojService.hearings.create(payload);
      setHearingForm({ ...hearingForm, outcome: "", is_adjourned: false, adjournment_reason: "", next_hearing_date: "", hearing_date: "" });
      fetchAllData();
    } catch (err) { alert("Error scheduling hearing"); } finally { setSubmitting(false); }
  }

  async function submitOrder(e) {
    e.preventDefault(); setSubmitting(true);
    try {
      const orderRes = await mojService.orders.create({
        court_case: orderForm.court_case, judgment_type: orderForm.judgment_type,
        date_issued: orderForm.date_issued, summary: orderForm.summary, has_fine: orderForm.has_fine
      });
      if (orderForm.has_fine && orderForm.total_amount) {
        await mojService.fines.create({
          court_order: orderRes.data.id, total_amount: orderForm.total_amount,
          currency: orderForm.currency, deadline: orderForm.deadline || null
        });
      }
      setOrderForm({ ...orderForm, summary: "", has_fine: false, total_amount: "", deadline: "" });
      fetchAllData();
    } catch (err) { alert("Error saving judgment"); } finally { setSubmitting(false); }
  }

  async function submitPayment(e) {
    e.preventDefault(); setSubmitting(true);
    try {
      await mojService.payments.create({
        fine: selectedFineForPayment, amount: paymentForm.amount,
        payment_date: paymentForm.payment_date, transaction_reference: paymentForm.transaction_reference, status: "verified"
      });
      setPaymentForm({ amount: "", payment_date: "", transaction_reference: "" });
      setSelectedFineForPayment(null); fetchAllData();
    } catch (err) { alert("Error recording payment"); } finally { setSubmitting(false); }
  }

  async function submitInfoRequest(e) {
    e.preventDefault(); setSubmitting(true);
    try {
      await mojService.infoRequests.create({ ...infoRequestForm, case: id });
      setInfoRequestForm({ request_details: "" });
      fetchAllData();
    } catch (err) { alert("Error sending request"); } finally { setSubmitting(false); }
  }

  async function submitAppeal(e) {
    e.preventDefault(); setSubmitting(true);
    try {
      await mojService.appeals.create({ ...appealForm, status: "filed" });
      setAppealForm({ ...appealForm, grounds_for_appeal: "", date_filed: "" });
      fetchAllData();
    } catch (err) { alert("Error filing appeal"); } finally { setSubmitting(false); }
  }

  if (loading) return <div className="p-8 text-center text-primary">Loading case workspace...</div>;
  if (!record) return <div className="p-8 text-center text-error">Case not found.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/moj/cases" className="inline-flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content mb-2">
            <ArrowLeft className="size-4" /> Back to Case Register
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            Case {record.case_number}
            <span className="badge badge-primary badge-sm">{record.status_display}</span>
          </h1>
          <p className="mt-1 text-sm text-base-content/60 flex items-center gap-1.5">
            <Calendar className="size-3.5" /> Filed on {new Date(record.filing_date).toLocaleDateString()} by {record.filing_institution}
          </p>
        </div>
      </div>

      {/* TABS */}
      <div role="tablist" className="tabs tabs-bordered w-full overflow-x-auto flex-nowrap border-b border-base-300">
        <button role="tab" className={`tab ${activeTab === 'overview' ? 'tab-active font-bold text-primary' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button role="tab" className={`tab ${activeTab === 'review' ? 'tab-active font-bold text-primary' : ''}`} onClick={() => setActiveTab('review')}>Legal Review</button>
        <button role="tab" className={`tab ${activeTab === 'info' ? 'tab-active font-bold text-primary' : ''}`} onClick={() => setActiveTab('info')}>Info Requests</button>
        <button role="tab" className={`tab ${activeTab === 'court' ? 'tab-active font-bold text-primary' : ''}`} onClick={() => setActiveTab('court')}>Court Filings</button>
        <button role="tab" className={`tab ${activeTab === 'seizures' ? 'tab-active font-bold text-primary' : ''}`} onClick={() => setActiveTab('seizures')}>Seizures</button>
        <button role="tab" className={`tab ${activeTab === 'hearings' ? 'tab-active font-bold text-primary' : ''}`} onClick={() => setActiveTab('hearings')}>Hearings</button>
        <button role="tab" className={`tab ${activeTab === 'judgments' ? 'tab-active font-bold text-primary' : ''}`} onClick={() => setActiveTab('judgments')}>Judgments & Fines</button>
        <button role="tab" className={`tab ${activeTab === 'appeals' ? 'tab-active font-bold text-primary' : ''}`} onClick={() => setActiveTab('appeals')}>Appeals</button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
              <div className="bg-base-200/50 px-6 py-4 border-b border-base-300 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{record.title}</h2>
                    <p className="font-mono text-sm text-base-content/60">Case File: {record.case_number}</p>
                  </div>
                </div>
                <span className="badge badge-primary badge-lg font-semibold shadow-sm">
                  {record.status_display}
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-base-200">
                <div className="space-y-1">
                  <p className="text-[11px] text-base-content/50 font-bold uppercase tracking-wider">Charge</p>
                  <p className="font-semibold text-error">{record.charge || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-base-content/50 font-bold uppercase tracking-wider">Action Taken</p>
                  <p className="font-semibold">{record.action_taken || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-base-content/50 font-bold uppercase tracking-wider">Substance Involved</p>
                  <p className="font-semibold">{record.substance || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-base-content/50 font-bold uppercase tracking-wider">Assigned Court</p>
                  <p className="font-semibold">{record.court_name || "Not Assigned"}</p>
                </div>
              </div>

              <div className="bg-base-200/20 px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-base-200">
                <div>
                  <p className="text-[11px] text-base-content/50 font-bold uppercase tracking-wider">Filing Institution</p>
                  <p className="font-medium text-sm mt-0.5">{record.filing_institution}</p>
                </div>
                <div>
                  <p className="text-[11px] text-base-content/50 font-bold uppercase tracking-wider">Filing Date</p>
                  <p className="font-medium text-sm mt-0.5">{new Date(record.filing_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-base-content/50 font-bold uppercase tracking-wider">County</p>
                  <p className="font-medium text-sm mt-0.5 capitalize">{record.county || "—"}</p>
                </div>
              </div>

              <div className="p-6">
                <p className="text-[11px] text-base-content/50 font-bold uppercase tracking-wider mb-2">Case Description</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-base-200/40 p-4 rounded-xl border border-base-200">
                  {record.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Arrested Persons */}
            <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
              <div className="bg-base-200/50 px-6 py-4 border-b border-base-300 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-xl bg-warning/20 text-warning shrink-0">
                    <User className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-base-content">Accused / Arrested Persons</h2>
                    <p className="text-sm font-bold text-primary mt-0.5">{record.title}</p>
                    <p className="font-mono text-xs text-base-content/60">Case File: {record.case_number}</p>
                  </div>
                </div>
                <span className="badge badge-neutral font-semibold">{record.participants?.length || 0} Persons</span>
              </div>

              <div className="p-6 space-y-6">
                {record.participants?.length > 0 ? (
                  record.participants.map((p) => {
                    const person = p.person_arrested;
                    return (
                      <div key={p.id} className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                        <div className="bg-base-200/40 px-5 py-3 border-b border-base-300 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {person.photo ? (
                              <img src={person.photo.startsWith('http') ? person.photo : `http://localhost:8000${person.photo}`} alt={person.full_name} className="size-12 rounded-full object-cover shadow-sm ring-2 ring-primary/20" />
                            ) : (
                              <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-content font-bold text-lg shadow-sm">
                                {person.first_name?.[0]}{person.last_name?.[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-lg leading-tight">{person.full_name}</p>
                              <p className="text-xs text-base-content/60 mt-0.5">Arrest #: <span className="font-mono text-base-content font-medium">{person.arrests_number}</span></p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="badge badge-outline capitalize">{p.role_display}</span>
                            {p.is_primary && <span className="badge badge-error badge-sm">Primary Suspect</span>}
                          </div>
                        </div>

                        <div className="p-5 space-y-5">
                          <div>
                            <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Personal Details</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div><p className="text-[10px] text-base-content/50 uppercase">Gender</p><p className="font-medium capitalize text-sm">{person.gender || "—"}</p></div>
                              <div><p className="text-[10px] text-base-content/50 uppercase">Date of Birth</p><p className="font-medium text-sm">{person.date_of_birth || "—"}</p></div>
                              <div><p className="text-[10px] text-base-content/50 uppercase">Nationality</p><p className="font-medium text-sm">{person.nationality || "—"}</p></div>
                              <div><p className="text-[10px] text-base-content/50 uppercase">Marital Status</p><p className="font-medium capitalize text-sm">{person.marital_status || "—"}</p></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Contact</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div><p className="text-[10px] text-base-content/50 uppercase">Phone</p><p className="font-medium text-sm">{person.phone_number || "—"}</p></div>
                                <div><p className="text-[10px] text-base-content/50 uppercase">Email</p><p className="font-medium text-sm">{person.email || "—"}</p></div>
                                <div className="col-span-2"><p className="text-[10px] text-base-content/50 uppercase">Address</p><p className="font-medium text-sm">{person.address || "—"}</p></div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Arrest Location</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div><p className="text-[10px] text-base-content/50 uppercase">County</p><p className="font-medium text-sm capitalize">{person.county_of_arrests || "—"}</p></div>
                                <div><p className="text-[10px] text-base-content/50 uppercase">District</p><p className="font-medium text-sm capitalize">{person.district_of_arrests || "—"}</p></div>
                                <div className="col-span-2"><p className="text-[10px] text-base-content/50 uppercase">Specific Location</p><p className="font-medium text-sm">{person.location_of_arrests || "—"}</p></div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3 border-b border-base-200 pb-1">Arrest Specifics</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-base-200/30 p-3 rounded-lg">
                              <div><p className="text-[10px] text-base-content/50 uppercase">Drug Type</p><p className="font-bold text-error capitalize text-sm">{person.drug_type || "—"}</p></div>
                              <div><p className="text-[10px] text-base-content/50 uppercase">Quantity</p><p className="font-medium text-sm">{person.quantity ? `${person.quantity} ${person.unit}` : "—"}</p></div>
                              <div><p className="text-[10px] text-base-content/50 uppercase">Arresting Officer</p><p className="font-medium text-sm">{person.arresting_officer || "—"}</p></div>
                              <div><p className="text-[10px] text-base-content/50 uppercase">Status</p><p className="font-medium capitalize text-sm text-warning">{person.status_display || "—"}</p></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 rounded-lg bg-error/5 border border-error/20">
                              <p className="text-[10px] text-error font-bold uppercase tracking-wider mb-1">Formal Charges</p>
                              <p className="text-sm text-error font-semibold">{person.charges || "No charges specified."}</p>
                            </div>
                            {person.remarks && (
                              <div className="p-4 rounded-lg bg-base-200/50 border border-base-200">
                                <p className="text-[10px] text-base-content/50 font-bold uppercase tracking-wider mb-1">Remarks</p>
                                <p className="text-sm text-base-content/80 italic">{person.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-base-200/20 rounded-xl border border-dashed border-base-300">
                    <User className="size-8 text-base-content/30 mx-auto mb-2" />
                    <p className="text-base-content/50">No participants linked to this case.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Prosecutor Assignment */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-t-4 border-base-300 border-t-primary bg-base-100 p-5 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <UserCheck className="size-5 text-primary" /> Current Prosecutor
              </h2>
              
              {assignments.length > 0 ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-primary text-primary-content font-bold">
                      <User className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-base text-primary">{assignments[0].prosecutor}</p>
                      <p className="text-xs text-base-content/60">Assigned: {assignments[0].assigned_date}</p>
                    </div>
                  </div>
                  {assignments[0].notes && (
                    <p className="text-sm text-base-content/80 bg-base-100 p-3 rounded-lg border border-base-200">
                      <strong>Notes:</strong> {assignments[0].notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 bg-base-200/30 rounded-xl border border-dashed border-base-300">
                  <p className="text-sm text-base-content/50 font-medium">No prosecutor assigned.</p>
                </div>
              )}
            </div>

            {canWrite && (
              <form onSubmit={submitAssignment} className="rounded-xl border border-t-4 border-base-300 border-t-primary bg-base-100 p-5 shadow-sm space-y-4 sticky top-6">
                <h2 className="text-lg font-bold border-b border-base-200 pb-2">Assign Prosecutor</h2>
                <div>
                  <label className="label text-xs font-semibold">Prosecutor Name</label>
                  <input type="text" className="input input-bordered w-full" value={assignmentForm.prosecutor} onChange={e => setAssignmentForm({...assignmentForm, prosecutor: e.target.value})} placeholder="e.g. John Doe" required />
                </div>
                <div>
                  <label className="label text-xs font-semibold">Assignment Notes</label>
                  <textarea className="textarea textarea-bordered w-full h-24" value={assignmentForm.notes} onChange={e => setAssignmentForm({...assignmentForm, notes: e.target.value})} placeholder="Reason for assignment or handover..."></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? "Assigning..." : "Assign Prosecutor"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. LEGAL REVIEW TAB */}
      {activeTab === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold">Review History</h2>
            {reviews.length === 0 ? <p className="text-sm text-base-content/50">No reviews submitted yet.</p> : null}
            {reviews.map(r => (
              <div key={r.id} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-base-200 pb-2 mb-2">
                  <span className="font-semibold">{r.reviewer_name}</span>
                  <span className={`badge ${r.decision === 'recommended' ? 'badge-success' : 'badge-warning'}`}>{r.decision_display}</span>
                </div>
                <p className="text-sm"><strong>Summary:</strong> {r.summary || "—"}</p>
                <p className="text-sm mt-1"><strong>Gaps:</strong> {r.gaps_identified || "—"}</p>
                <p className="text-xs text-base-content/50 mt-2">{new Date(r.review_date).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            {canWrite && (
              <form onSubmit={submitReview} className="rounded-xl border border-t-4 border-base-300 border-t-primary bg-base-100 p-5 shadow-sm space-y-4 sticky top-6">
                <h2 className="text-lg font-bold border-b border-base-200 pb-2">New Legal Review</h2>
                <div>
                  <label className="label text-xs font-semibold">Decision</label>
                  <select className="select select-bordered w-full" value={reviewForm.decision} onChange={e => setReviewForm({...reviewForm, decision: e.target.value})}>
                    {REVIEW_DECISIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div><label className="label text-xs font-semibold">Summary of Evidence</label><textarea className="textarea textarea-bordered w-full h-24" value={reviewForm.summary} onChange={e => setReviewForm({...reviewForm, summary: e.target.value})}></textarea></div>
                <div><label className="label text-xs font-semibold">Identified Gaps</label><textarea className="textarea textarea-bordered w-full h-24" value={reviewForm.gaps_identified} onChange={e => setReviewForm({...reviewForm, gaps_identified: e.target.value})}></textarea></div>
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? "Saving..." : "Save Review"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. INFO REQUESTS TAB */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold">Information Requests (LDEA)</h2>
            {infoRequests.length === 0 ? <p className="text-sm text-base-content/50">No information requests sent yet.</p> : null}
            
            {infoRequests.map(req => (
              <div key={req.id} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-base-200 pb-2 mb-2">
                  <span className="font-semibold text-sm flex items-center gap-1.5"><MessageSquare className="size-4 text-primary" /> Requested by {req.requested_by_name}</span>
                  <span className={`badge ${req.status === 'resolved' ? 'badge-success' : req.status === 'responded' ? 'badge-info' : 'badge-warning'}`}>{req.status_display}</span>
                </div>
                <div className="bg-base-200/40 p-3 rounded-lg border border-base-200 mt-2">
                  <p className="text-xs font-bold text-base-content/50 uppercase mb-1">Request Details</p>
                  <p className="text-sm">{req.request_details}</p>
                </div>
                {req.response_details && (
                  <div className="bg-success/5 p-3 rounded-lg border border-success/20 mt-3">
                    <p className="text-xs font-bold text-success uppercase mb-1">LDEA Response</p>
                    <p className="text-sm">{req.response_details}</p>
                  </div>
                )}
                <p className="text-xs text-base-content/50 mt-3">{new Date(req.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            {canWrite && (
              <form onSubmit={submitInfoRequest} className="rounded-xl border border-t-4 border-base-300 border-t-primary bg-base-100 p-5 shadow-sm space-y-4 sticky top-6">
                <h2 className="text-lg font-bold border-b border-base-200 pb-2">Request Info from LDEA</h2>
                <div>
                  <label className="label text-xs font-semibold">What information is needed?</label>
                  <textarea className="textarea textarea-bordered w-full h-32" value={infoRequestForm.request_details} onChange={e => setInfoRequestForm({request_details: e.target.value})} placeholder="e.g. We need the original arrest report for suspect Mary Doo..." required></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? "Sending..." : "Send Request"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. COURT FILINGS TAB */}
      {activeTab === "court" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold">Court Cases</h2>
            {courtCases.length === 0 ? <p className="text-sm text-base-content/50">No court cases filed yet.</p> : null}
            {courtCases.map(c => (
              <div key={c.id} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-base-200 pb-2 mb-2">
                  <span className="font-bold flex items-center gap-2"><Gavel className="size-4"/> {c.court_name}</span>
                  <span className="badge badge-primary">{c.court_case_number}</span>
                </div>
                <p className="text-sm"><strong>Filed:</strong> {c.filing_date}</p>
                <p className="text-sm"><strong>Prosecutor:</strong> {c.prosecutor || "—"}</p>
                <p className="text-sm mt-2"><strong>Status:</strong> {c.status_display}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            {canWrite && (
              <form onSubmit={submitCourtCase} className="rounded-xl border border-t-4 border-base-300 border-t-primary bg-base-100 p-5 shadow-sm space-y-4 sticky top-6">
                <h2 className="text-lg font-bold border-b border-base-200 pb-2">File in Court</h2>
                <div><label className="label text-xs font-semibold">Court Name</label><input type="text" className="input input-bordered w-full" value={courtForm.court_name} onChange={e => setCourtForm({...courtForm, court_name: e.target.value})} required /></div>
                <div><label className="label text-xs font-semibold">Court Case #</label><input type="text" className="input input-bordered w-full" value={courtForm.court_case_number} onChange={e => setCourtForm({...courtForm, court_case_number: e.target.value})} required /></div>
                <div><label className="label text-xs font-semibold">Prosecutor Name</label><input type="text" className="input input-bordered w-full" value={courtForm.prosecutor} onChange={e => setCourtForm({...courtForm, prosecutor: e.target.value})} placeholder="e.g. John Doe" required /></div>
                <div><label className="label text-xs font-semibold">Filing Date</label><input type="date" className="input input-bordered w-full" value={courtForm.filing_date} onChange={e => setCourtForm({...courtForm, filing_date: e.target.value})} required /></div>
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? "Filing..." : "File Court Case"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. SEIZURES TAB */}
      {activeTab === "seizures" && (
        <div className="pt-4">
          <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
            <div className="bg-base-200/50 px-6 py-4 border-b border-base-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Pill className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">LDEA Drug Seizures</h2>
                  <p className="text-sm text-base-content/60">Physical seizures logged by the Liberia Drug Enforcement Agency</p>
                </div>
              </div>
              <span className="badge badge-neutral font-semibold">{seizures.length} Items</span>
            </div>

            <div className="p-6">
              {seizures.length === 0 ? (
                <div className="text-center py-12 bg-base-200/20 rounded-xl border border-dashed border-base-300">
                  <Pill className="size-8 text-base-content/30 mx-auto mb-2" />
                  <p className="text-base-content/50">No seizures logged yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seizures.map(s => (
                    <div key={s.id} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="badge badge-warning capitalize">{s.status_display}</span>
                        <span className="text-xs text-base-content/60">{new Date(s.seizure_date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Drug Type</p>
                        <p className="font-bold text-error capitalize text-sm">{s.drug_type || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Quantity</p>
                        <p className="font-medium text-sm">{s.quantity ? `${s.quantity} ${s.unit}` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Seized By</p>
                        <p className="font-medium text-sm">{s.seized_by || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50 uppercase">Location</p>
                        <p className="font-medium text-sm">{s.location_description || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. HEARINGS TAB */}
      {activeTab === "hearings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold">Hearing Schedule & History</h2>
            {hearings.length === 0 ? (
              <p className="text-sm text-base-content/50">No hearings scheduled yet.</p>
            ) : (
              <div className="space-y-3">
                {hearings.map(h => (
                  <div key={h.id} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm relative pl-6">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-base-content">{h.hearing_type}</p>
                        <p className="text-sm text-base-content/70 flex items-center gap-1">
                          <Calendar className="size-3.5" /> {h.hearing_date} {h.hearing_time ? ` at ${h.hearing_time}` : ""}
                        </p>
                      </div>
                      <span className={`badge badge-sm ${h.is_adjourned ? 'badge-warning' : 'badge-success'}`}>
                        {h.is_adjourned ? "Adjourned" : "Completed"}
                      </span>
                    </div>
                    <p className="text-sm"><strong>Outcome:</strong> {h.outcome || "Pending"}</p>
                    {h.is_adjourned && (
                      <div className="mt-2 p-2 bg-warning/10 rounded border border-warning/20 text-sm">
                        <p><strong>Reason:</strong> {h.adjournment_reason || "Not specified"}</p>
                        {h.next_hearing_date && <p><strong>Next Date:</strong> {h.next_hearing_date}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            {courtCases.length === 0 ? (
              <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm text-center">
                <ShieldAlert className="size-8 text-warning mx-auto mb-2" />
                <p className="text-sm font-semibold">No Court Case Found</p>
                <p className="text-xs text-base-content/60 mt-1">File the case in court first.</p>
              </div>
            ) : canWrite && (
              <form onSubmit={submitHearing} className="rounded-xl border border-t-4 border-base-300 border-t-primary bg-base-100 p-5 shadow-sm space-y-4 sticky top-6">
                <h2 className="text-lg font-bold border-b border-base-200 pb-2">Schedule Hearing</h2>
                <div><label className="label text-xs font-semibold">Court Case</label><select className="select select-bordered w-full" value={hearingForm.court_case} onChange={e => setHearingForm({...hearingForm, court_case: e.target.value})} required>{courtCases.map(c => <option key={c.id} value={c.id}>{c.court_case_number}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label text-xs font-semibold">Date</label><input type="date" className="input input-bordered w-full" value={hearingForm.hearing_date} onChange={e => setHearingForm({...hearingForm, hearing_date: e.target.value})} required /></div>
                  <div><label className="label text-xs font-semibold">Time</label><input type="time" className="input input-bordered w-full" value={hearingForm.hearing_time} onChange={e => setHearingForm({...hearingForm, hearing_time: e.target.value})} /></div>
                </div>
                <div><label className="label text-xs font-semibold">Hearing Type</label><select className="select select-bordered w-full" value={hearingForm.hearing_type} onChange={e => setHearingForm({...hearingForm, hearing_type: e.target.value})}>{HEARING_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                <div><label className="label text-xs font-semibold">Outcome / Notes</label><textarea className="textarea textarea-bordered w-full h-20" value={hearingForm.outcome} onChange={e => setHearingForm({...hearingForm, outcome: e.target.value})}></textarea></div>
                <div className="form-control"><label className="label cursor-pointer justify-start gap-3"><input type="checkbox" className="checkbox checkbox-primary" checked={hearingForm.is_adjourned} onChange={e => setHearingForm({...hearingForm, is_adjourned: e.target.checked})} /><span className="label-text font-semibold text-xs">Adjourned?</span></label></div>
                {hearingForm.is_adjourned && (
                  <div className="space-y-2 p-3 bg-base-200/50 rounded-lg">
                    <div><label className="label text-xs font-semibold pt-0">Reason</label><textarea className="textarea textarea-bordered w-full h-16" value={hearingForm.adjournment_reason} onChange={e => setHearingForm({...hearingForm, adjournment_reason: e.target.value})} required></textarea></div>
                    <div><label className="label text-xs font-semibold pt-0">Next Date</label><input type="date" className="input input-bordered w-full" value={hearingForm.next_hearing_date} onChange={e => setHearingForm({...hearingForm, next_hearing_date: e.target.value})} /></div>
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? "Saving..." : "Save Hearing"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 7. JUDGMENTS & FINES TAB */}
      {activeTab === "judgments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold">Court Judgments</h2>
            {orders.length === 0 ? <p className="text-sm text-base-content/50">No judgments recorded yet.</p> : null}
            
            {orders.map(o => {
              const orderFine = fines.find(f => f.court_order === o.id);
              return (
                <div key={o.id} className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-base-200 pb-2">
                    <div>
                      <p className="font-bold text-lg capitalize flex items-center gap-2">
                        <Gavel className="size-5 text-primary" /> {o.judgment_type_display}
                      </p>
                      <p className="text-xs text-base-content/60">Date Issued: {o.date_issued}</p>
                    </div>
                  </div>
                  <p className="text-sm"><strong>Summary:</strong> {o.summary}</p>

                  {orderFine && (
                    <div className="mt-4 p-4 rounded-lg bg-error/5 border border-error/20 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-error flex items-center gap-2"><DollarSign className="size-4" /> Fine Imposed</h4>
                        <span className="text-lg font-bold">{orderFine.currency} {orderFine.total_amount}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-xs text-base-content/60 uppercase font-bold">Outstanding Balance</p>
                          <p className="text-xl font-bold text-error">{orderFine.currency} {orderFine.outstanding_balance}</p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60 uppercase font-bold">Deadline</p>
                          <p>{orderFine.deadline || "None"}</p>
                        </div>
                      </div>
                      {parseFloat(orderFine.outstanding_balance) > 0 && canWrite && (
                        <button className="btn btn-sm btn-outline btn-error w-full mt-2" onClick={() => setSelectedFineForPayment(orderFine.id)}>
                          <PlusCircle className="size-4" /> Record Payment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {canWrite && (
              <form onSubmit={submitOrder} className="rounded-xl border border-t-4 border-base-300 border-t-primary bg-base-100 p-5 shadow-sm space-y-4">
                <h2 className="text-lg font-bold border-b border-base-200 pb-2">Record Judgment</h2>
                <div><label className="label text-xs font-semibold">Court Case</label><select className="select select-bordered w-full" value={orderForm.court_case} onChange={e => setOrderForm({...orderForm, court_case: e.target.value})} required>{courtCases.map(c => <option key={c.id} value={c.id}>{c.court_case_number}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label text-xs font-semibold">Outcome</label><select className="select select-bordered w-full" value={orderForm.judgment_type} onChange={e => setOrderForm({...orderForm, judgment_type: e.target.value})}>{JUDGMENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                  <div><label className="label text-xs font-semibold">Date</label><input type="date" className="input input-bordered w-full" value={orderForm.date_issued} onChange={e => setOrderForm({...orderForm, date_issued: e.target.value})} required /></div>
                </div>
                <div><label className="label text-xs font-semibold">Summary</label><textarea className="textarea textarea-bordered w-full h-20" value={orderForm.summary} onChange={e => setOrderForm({...orderForm, summary: e.target.value})} required></textarea></div>
                <div className="form-control"><label className="label cursor-pointer justify-start gap-3"><input type="checkbox" className="checkbox checkbox-primary" checked={orderForm.has_fine} onChange={e => setOrderForm({...orderForm, has_fine: e.target.checked})} /><span className="label-text font-semibold text-xs">Court imposed a fine?</span></label></div>
                {orderForm.has_fine && (
                  <div className="space-y-2 p-3 bg-base-200/50 rounded-lg">
                    <div><label className="label text-xs font-semibold pt-0">Fine Amount</label><input type="number" step="0.01" className="input input-bordered w-full" value={orderForm.total_amount} onChange={e => setOrderForm({...orderForm, total_amount: e.target.value})} required /></div>
                    <div><label className="label text-xs font-semibold pt-0">Currency</label><select className="select select-bordered w-full" value={orderForm.currency} onChange={e => setOrderForm({...orderForm, currency: e.target.value})}><option value="USD">USD</option><option value="LRD">LRD</option></select></div>
                    <div><label className="label text-xs font-semibold pt-0">Deadline</label><input type="date" className="input input-bordered w-full" value={orderForm.deadline} onChange={e => setOrderForm({...orderForm, deadline: e.target.value})} /></div>
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? "Saving..." : "Save Judgment"}</button>
              </form>
            )}

            {selectedFineForPayment && canWrite && (
              <form onSubmit={submitPayment} className="rounded-xl border border-t-4 border-base-300 border-t-error bg-base-100 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-lg font-bold text-error">Record Payment</h2>
                  <button type="button" onClick={() => setSelectedFineForPayment(null)} className="btn btn-xs btn-ghost">Cancel</button>
                </div>
                <div><label className="label text-xs font-semibold">Amount Paid</label><input type="number" step="0.01" className="input input-bordered w-full" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required /></div>
                <div><label className="label text-xs font-semibold">Payment Date</label><input type="date" className="input input-bordered w-full" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} required /></div>
                <div><label className="label text-xs font-semibold">Receipt / Ref #</label><input type="text" className="input input-bordered w-full" value={paymentForm.transaction_reference} onChange={e => setPaymentForm({...paymentForm, transaction_reference: e.target.value})} required /></div>
                <button type="submit" className="btn btn-error w-full" disabled={submitting}>{submitting ? "Saving..." : "Save Payment"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 8. APPEALS TAB */}
      {activeTab === "appeals" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold">Appeals History</h2>
            {appeals.length === 0 ? <p className="text-sm text-base-content/50">No appeals filed yet.</p> : null}
            
            {appeals.map(a => (
              <div key={a.id} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-base-200 pb-2 mb-2">
                  <span className="font-bold flex items-center gap-2 text-warning"><AlertTriangle className="size-4"/> Appeal by {a.appealing_party}</span>
                  <span className="badge badge-warning">{a.status_display}</span>
                </div>
                <p className="text-sm"><strong>Date Filed:</strong> {a.date_filed}</p>
                <p className="text-sm mt-2"><strong>Grounds:</strong> {a.grounds_for_appeal}</p>
                {a.outcome && (
                  <div className="mt-2 p-2 bg-base-200 rounded text-sm">
                    <strong>Outcome:</strong> {a.outcome}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            {courtCases.length === 0 ? (
              <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm text-center">
                <ShieldAlert className="size-8 text-warning mx-auto mb-2" />
                <p className="text-sm font-semibold">No Court Case Found</p>
              </div>
            ) : canWrite && (
              <form onSubmit={submitAppeal} className="rounded-xl border border-t-4 border-base-300 border-t-primary bg-base-100 p-5 shadow-sm space-y-4 sticky top-6">
                <h2 className="text-lg font-bold border-b border-base-200 pb-2">File Appeal</h2>
                <div><label className="label text-xs font-semibold">Court Case</label><select className="select select-bordered w-full" value={appealForm.court_case} onChange={e => setAppealForm({...appealForm, court_case: e.target.value})} required>{courtCases.map(c => <option key={c.id} value={c.id}>{c.court_case_number}</option>)}</select></div>
                <div><label className="label text-xs font-semibold">Appealing Party</label><select className="select select-bordered w-full" value={appealForm.appealing_party} onChange={e => setAppealForm({...appealForm, appealing_party: e.target.value})}><option value="Defendant">Defendant</option><option value="Prosecution">Prosecution</option></select></div>
                <div><label className="label text-xs font-semibold">Date Filed</label><input type="date" className="input input-bordered w-full" value={appealForm.date_filed} onChange={e => setAppealForm({...appealForm, date_filed: e.target.value})} required /></div>
                <div><label className="label text-xs font-semibold">Grounds for Appeal</label><textarea className="textarea textarea-bordered w-full h-24" value={appealForm.grounds_for_appeal} onChange={e => setAppealForm({...appealForm, grounds_for_appeal: e.target.value})} required></textarea></div>
                <button type="submit" className="btn btn-warning w-full text-warning-content" disabled={submitting}>{submitting ? "Filing..." : "Submit Appeal"}</button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}