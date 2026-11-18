import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Gavel, User, ArrowRight, Loader2, Scale } from "lucide-react";
import { mojService } from "../../../services/mojService";

export default function MOJHearingsPage() {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHearings() {
      try {
        // Fetch all hearings (we use page_size=1000 to get them all for the calendar)
        const res = await mojService.hearings.list({ page_size: 1000, ordering: "hearing_date" });
        const data = res.data.results || res.data;
        
        // Filter out past hearings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = data.filter(h => new Date(h.hearing_date) >= today);
        setHearings(upcoming);
      } catch (err) {
        console.error("Failed to load hearings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHearings();
  }, []);

  // Group hearings by Date
  const groupedHearings = hearings.reduce((acc, hearing) => {
    const date = hearing.hearing_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(hearing);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedHearings).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="size-6 text-primary" /> Court Calendar
        </h1>
        <p className="text-sm text-base-content/60">Upcoming scheduled hearings across all active cases.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-base-content/50">Loading calendar...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-12 text-center shadow-sm">
          <Calendar className="size-12 text-base-content/20 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-base-content/70">No upcoming hearings</h3>
          <p className="text-sm text-base-content/50 mt-1">Your calendar is clear.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => {
            const dateObj = new Date(date);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            
            return (
              <div key={date} className="relative">
                {/* Date Header */}
                <div className="sticky top-16 z-10 flex items-center gap-4 mb-4">
                  <div className={`px-4 py-2 rounded-xl border shadow-sm font-bold ${isToday ? 'bg-primary text-primary-content border-primary' : 'bg-base-100 border-base-300'}`}>
                    {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {isToday && <span className="ml-2 text-xs bg-primary-content/20 px-2 py-0.5 rounded-full">Today</span>}
                  </div>
                  <div className="h-px bg-base-300 flex-1"></div>
                </div>

                {/* Hearings for this date */}
                <div className="space-y-3 pl-2">
                  {groupedHearings[date].map(hearing => (
                    <div key={hearing.id} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4">
                        <div className="grid size-12 place-items-center rounded-full bg-warning/10 text-warning shrink-0 mt-1">
                          <Gavel className="size-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{hearing.hearing_type}</h3>
                          <p className="text-sm font-medium text-primary flex items-center gap-1.5 mt-0.5">
                            <Clock className="size-3.5" /> {hearing.hearing_time || "Time TBA"}
                          </p>
                          <p className="text-xs text-base-content/60 mt-1">
                            Court Case: <span className="font-mono font-semibold text-base-content">{hearing.court_case_number || `#${hearing.court_case}`}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <span className={`badge badge-sm ${hearing.is_adjourned ? 'badge-error' : 'badge-success'}`}>
                          {hearing.is_adjourned ? 'Adjourned' : 'Scheduled'}
                        </span>
                        {/* Note: If you link hearings directly to cases, add the link here */}
                        <Link to={`/moj/cases/${hearing.court_case}`} className="btn btn-sm btn-ghost gap-1 text-primary hover:bg-primary/5">
                          View Case <ArrowRight className="size-3.5" />
                        </Link>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}