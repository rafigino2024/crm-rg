import { getTagColor } from "./tagConfig";
import { X } from "lucide-react";

export default function TagFilter({ leads, selectedTags, onChange }) {
  // Collect all unique tags from all leads
  const allTags = [...new Set(leads.flatMap((l) => l.tags || []))].sort();

  if (allTags.length === 0) return null;

  const toggle = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium shrink-0">Filter by tag:</span>
      {allTags.map((tag) => {
        const active = selectedTags.includes(tag);
        const color = getTagColor(tag);
        return (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all
              ${active ? color + " ring-2 ring-offset-1 ring-primary/30" : "bg-muted text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"}`}
          >
            {tag}
          </button>
        );
      })}
      {selectedTags.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}