import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MobileSelect from "@/components/MobileSelect";
import TagEditor from "./TagEditor";
import { base44 } from "@/api/base44Client";
import SendEmailDialog from "./SendEmailDialog";
import ActivityHistory from "./ActivityHistory";
import { Separator } from "@/components/ui/separator";

const STAGES = ["New", "Contacted", "Qualified", "Negotiation", "Proposal", "Won", "Lost"];
const LOSS_REASONS = ["Price", "Timeline", "Competitor", "No Budget", "No Need", "No Response", "Other"];

const emptyLead = {
  name: "",
  company: "",
  email: "",
  phone: "",
  stage: "New",
  priority: "Medium",
  estimated_value: "",
  assigned_to: "",
  tags: [],
  follow_up_date: "",
  next_action_date: "",
  loss_reason: "",
  notes: "",
  internal_notes: "",
};

export default function LeadFormDialog({ open, onOpenChange, lead, onSave, onDelete }) {
  const [form, setForm] = useState(emptyLead);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    base44.entities.User.list().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setForm(lead ? { ...emptyLead, ...lead } : emptyLead);
    }
  }, [open, lead]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (form.stage === "Lost" && !form.loss_reason) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete(lead.id);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {lead ? "Edit Lead" : "Add New Lead"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Acme Inc."
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stage">Stage</Label>
                <MobileSelect
                  value={form.stage}
                  onValueChange={(v) => handleChange("stage", v)}
                  placeholder="Select stage"
                  label="Stage"
                >
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </MobileSelect>
              </div>
            </div>

            {form.stage === "Lost" && (
              <div className="space-y-1.5">
                <Label htmlFor="loss_reason">Reason for Loss *</Label>
                <MobileSelect
                  value={form.loss_reason || ""}
                  onValueChange={(v) => handleChange("loss_reason", v)}
                  placeholder="Select reason..."
                  label="Reason for Loss"
                >
                  <SelectContent>
                    {LOSS_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </MobileSelect>
                {!form.loss_reason && (
                  <p className="text-xs text-destructive">Required when stage is Lost</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <MobileSelect
                value={form.priority || "Medium"}
                onValueChange={(v) => handleChange("priority", v)}
                placeholder="Select priority"
                label="Priority"
              >
                <SelectContent>
                  <SelectItem value="High">🔴 High</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="Low">⚪ Low</SelectItem>
                </SelectContent>
              </MobileSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@acme.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1 555 0123"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estimated_value">Estimated Value</Label>
              <Input
                id="estimated_value"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.estimated_value || ""}
                onChange={(e) => handleChange("estimated_value", e.target.value ? parseFloat(e.target.value) : "")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <MobileSelect
                value={form.assigned_to || ""}
                onValueChange={(v) => handleChange("assigned_to", v)}
                placeholder="Unassigned"
                label="Assigned To"
              >
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </MobileSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={form.follow_up_date || ""}
                  onChange={(e) => handleChange("follow_up_date", e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="next_action_date">Next Action Date</Label>
                <Input
                  id="next_action_date"
                  type="date"
                  value={form.next_action_date || ""}
                  onChange={(e) => handleChange("next_action_date", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagEditor
                tags={form.tags || []}
                onChange={(tags) => handleChange("tags", tags)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
                className="h-20 resize-none"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                placeholder="Track call details, follow-ups, and internal observations..."
                className="h-20 resize-none"
                value={form.internal_notes || ""}
                onChange={(e) => handleChange("internal_notes", e.target.value)}
              />
            </div>

          {lead && (
            <div className="space-y-1.5">
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-1">Activity History</p>
              <ActivityHistory leadId={lead.id} />
            </div>
          )}

            <DialogFooter className="flex items-center gap-2 pt-2">
              {lead && (
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              {lead && lead.email && (
                <Button type="button" variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
                  Send Email
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !form.name.trim() || (form.stage === "Lost" && !form.loss_reason)}>
                {saving ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {lead && (
        <SendEmailDialog open={emailOpen} onOpenChange={setEmailOpen} lead={lead} />
      )}
    </>
  );
}