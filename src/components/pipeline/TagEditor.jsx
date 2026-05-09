import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TAG_PRESETS, getTagColor } from "./tagConfig";

export default function TagEditor({ tags = [], onChange }) {
  const [custom, setCustom] = useState("");

  const addTag = (label) => {
    const trimmed = label.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
  };

  const removeTag = (label) => {
    onChange(tags.filter((t) => t !== label));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(custom);
      setCustom("");
    }
  };

  return (
    <div className="space-y-2">
      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${getTagColor(tag)}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:opacity-70 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {TAG_PRESETS.filter((p) => !tags.includes(p.label)).map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => addTag(preset.label)}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium transition-opacity hover:opacity-80 ${preset.color}`}
          >
            <Plus className="w-3 h-3" />
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom tag input */}
      <Input
        placeholder="Type a custom tag and press Enter..."
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 text-sm"
      />
    </div>
  );
}