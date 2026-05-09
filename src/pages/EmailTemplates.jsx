import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const STAGES = ["Any", "New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

const stageColors = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-amber-50 text-amber-700 border-amber-200",
  Qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Proposal: "bg-purple-50 text-purple-700 border-purple-200",
  Won: "bg-green-50 text-green-700 border-green-200",
  Lost: "bg-red-50 text-red-700 border-red-200",
  Any: "bg-slate-50 text-slate-700 border-slate-200",
};

const empty = { name: "", stage: "Any", subject: "", body: "" };

export default function EmailTemplates() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => base44.entities.EmailTemplate.list("-created_date"),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing
        ? base44.entities.EmailTemplate.update(editing.id, data)
        : base44.entities.EmailTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, stage: t.stage || "Any", subject: t.subject, body: t.body });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return;
    saveMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-bold">Email Templates</h1>
              </div>
            </div>
            <Button onClick={openNew} size="sm" className="gap-1.5 rounded-lg">
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {templates.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No templates yet. Create your first one.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="bg-card border border-border/60 rounded-2xl p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{t.name}</span>
                    <Badge variant="outline" className={`text-xs ${stageColors[t.stage] || stageColors.Any}`}>
                      {t.stage || "Any"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Subject: {t.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">{t.body}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-8 w-8">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(t.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Template Name</Label>
                <Input
                  placeholder="e.g. Initial Outreach"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                placeholder="e.g. Following up on your inquiry"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> and{" "}
                <code className="bg-muted px-1 rounded">{"{{company}}"}</code> as placeholders.
              </p>
              <Textarea
                placeholder="Hi {{name}}, I wanted to follow up..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}