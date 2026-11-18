import { MapPin } from "lucide-react";

export function ScopeBadge({ membership }) {
  if (!membership) return null;

  // Safely handle null, undefined, or non-array values
  const counties = Array.isArray(membership.counties) ? membership.counties : [];

  // 1. No scope assigned (Warning state)
  if (counties.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warning/30 bg-warning/10 text-warning text-sm font-semibold">
        <MapPin size={16} />
        Scope: Not assigned
      </div>
    );
  }

  // 2. Format the text based on the number of counties
  let displayText = "";
  
  if (counties.length <= 2) {
    // e.g., "Montserrado" or "Montserrado, Bong"
    displayText = counties.join(", ");
  } else {
    // e.g., "Montserrado, Bong +3" (shows first 2, counts the rest)
    displayText = `${counties.slice(0, 2).join(", ")} +${counties.length - 2}`;
  }

  // 3. Render the badge with a native hover tooltip
  return (
    <div 
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-semibold cursor-help"
      title={counties.join(", ")} // Shows full list when hovering
    >
      <MapPin size={16} />
      Scope: {displayText}
    </div>
  );
}