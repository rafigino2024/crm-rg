export const TAG_PRESETS = [
  { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "High Priority", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "VIP", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "Follow Up", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Cold", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { label: "Hot", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { label: "Partner", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Referral", color: "bg-teal-100 text-teal-700 border-teal-200" },
];

// Fallback color for custom tags not in presets
export const DEFAULT_TAG_COLOR = "bg-indigo-100 text-indigo-700 border-indigo-200";

export function getTagColor(label) {
  const preset = TAG_PRESETS.find((t) => t.label === label);
  return preset ? preset.color : DEFAULT_TAG_COLOR;
}