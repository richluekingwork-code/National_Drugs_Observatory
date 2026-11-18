// src/constants/counties.js
// Liberia's 15 counties — shared across LDEA, MOG, MOH.
// Value and label are identical; the API stores the display name directly
// (LogInVictims.incident_county / county_resident are plain CharFields).

export const LIBERIA_COUNTIES = [
  "Bomi",
  "Bong",
  "Gbarpolu",
  "Grand Bassa",
  "Grand Cape Mount",
  "Grand Gedeh",
  "Grand Kru",
  "Lofa",
  "Margibi",
  "Maryland",
  "Montserrado",
  "Nimba",
  "Rivercess",
  "River Gee",
  "Sinoe",
];

/** Options array for <SelectField options={...} /> */
export const COUNTY_OPTIONS = LIBERIA_COUNTIES.map((c) => ({
  value: c,
  label: c,
}));

// src/constants/dropdowns.js   (create a new file — or append to counties.js)

export const EDUCATION_LEVEL_OPTIONS = [
  { value: "none",                  label: "None" },
  { value: "primary",               label: "Primary" },
  { value: "junior_high",           label: "Junior High" },
  { value: "senior_high",           label: "Senior High" },
  { value: "technical_vocational",  label: "Technical / Vocational" },
  { value: "university",            label: "University" },
  { value: "postgraduate",          label: "Postgraduate" },
  { value: "other",                 label: "Other" },
];

export const PROFESSIONAL_STATUS_OPTIONS = [
  { value: "unemployed",     label: "Unemployed" },
  { value: "student",        label: "Student" },
  { value: "farmer",         label: "Farmer" },
  { value: "trader",         label: "Trader / Market" },
  { value: "driver",         label: "Driver" },
  { value: "teacher",        label: "Teacher" },
  { value: "nurse",          label: "Nurse / Health worker" },
  { value: "civil_servant",  label: "Civil servant" },
  { value: "security",       label: "Security" },
  { value: "laborer",        label: "Laborer" },
  { value: "self_employed",  label: "Self-employed" },
  { value: "other",          label: "Other" },
];