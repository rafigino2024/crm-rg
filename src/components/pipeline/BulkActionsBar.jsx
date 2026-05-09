import { Trash2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export default function BulkActionsBar({ selectedCount, onChangeStage, onDelete, onClear }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-foreground text-background rounded-2xl shadow-2xl px-4 py-3">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} selected
      </span>
      <div className="w-px h-5 bg-background/20" />
      <Select onValueChange={onChangeStage}>
        <SelectTrigger className="h-8 w-36 bg-background/10 border-background/20 text-background text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 shrink-0" />
          <SelectValue placeholder="Change stage" />
        </SelectTrigger>
        <SelectContent>
          {STAGES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="destructive"
        className="h-8 gap-1.5 text-xs"
        onClick={onDelete}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </Button>
      <button onClick={onClear} className="ml-1 text-background/60 hover:text-background transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}