import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, Zap, Search, Download, UserCircle, Mail, Activity, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import PipelineBoard from "../components/pipeline/PipelineBoard";
import StageChart from "../components/pipeline/StageChart";
import LeadListView from "../components/pipeline/LeadListView";
import LeadFormDialog from "../components/pipeline/LeadFormDialog";
import FollowUpToday from "../components/pipeline/FollowUpToday";
import TagFilter from "../components/pipeline/TagFilter";
import BulkActionsBar from "../components/pipeline/BulkActionsBar";

export default function Dashboard() {
  const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };
  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [sortByPriority, setSortByPriority] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleSave = async (formData) => {
    if (editingLead) {
      await updateMutation.mutateAsync({ id: editingLead.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDelete = async (id) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStage = result.destination.droppableId;
    const lead = leads.find((l) => String(l.id) === leadId);
    if (lead && lead.stage !== newStage) {
      updateMutation.mutate({ id: lead.id, data: { ...lead, stage: newStage } });
    }
  };

  const handleLeadClick = (lead) => {
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids) => {
    const allSelected = ids.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  };

  const handleBulkDelete = async () => {
    await Promise.all([...selectedIds].map((id) => deleteMutation.mutateAsync(id)));
    setSelectedIds(new Set());
  };

  const handleBulkChangeStage = async (stage) => {
    const toUpdate = leads.filter((l) => selectedIds.has(l.id));
    await Promise.all(toUpdate.map((l) => updateMutation.mutateAsync({ id: l.id, data: { ...l, stage } })));
    setSelectedIds(new Set());
  };

  const openAddDialog = () => {
    setEditingLead(null);
    setDialogOpen(true);
  };

  const exportCSV = () => {
    const headers = ["Name", "Company", "Email", "Phone", "Stage", "Tags", "Follow-up Date", "Notes"];
    const rows = filteredLeads.map((l) => [
      l.name || "",
      l.company || "",
      l.email || "",
      l.phone || "",
      l.stage || "",
      (l.tags || []).join("; "),
      l.follow_up_date || "",
      (l.notes || "").replace(/\n/g, " "),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  let filteredLeads = leads.filter((l) => {
    const matchesSearch =
      !search.trim() ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((t) => l.tags?.includes(t));
    const matchesOwner =
      !selectedOwner || l.assigned_to === selectedOwner;
    return matchesSearch && matchesTags && matchesOwner;
  });

  if (sortByPriority) {
    filteredLeads.sort((a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
    );
  }

  const owners = [...new Set(leads.map((l) => l.assigned_to).filter(Boolean))];

  const totalLeads = leads.length;
  const activeLeads = leads.filter(
    (l) => !["Won", "Lost"].includes(l.stage)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">Pipeline</h1>
                <p className="text-xs text-muted-foreground">
                  {totalLeads} leads · {activeLeads} active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 w-56 text-sm rounded-lg"
                />
              </div>
              {/* View Toggle */}
              <div className="hidden sm:flex items-center bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setView("board")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${view === "board" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Board
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <List className="w-3.5 h-3.5" />
                  List
                </button>
              </div>

              <Button
                size="sm"
                variant={sortByPriority ? "default" : "outline"}
                className="gap-1.5 rounded-lg"
                onClick={() => setSortByPriority((p) => !p)}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">Priority</span>
              </Button>
              <Link to="/activity">
                <Button size="sm" variant="outline" className="gap-1.5 rounded-lg">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Activity</span>
                </Button>
              </Link>
              <Link to="/email-templates">
                <Button size="sm" variant="outline" className="gap-1.5 rounded-lg">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Templates</span>
                </Button>
              </Link>
              <Button onClick={exportCSV} size="sm" variant="outline" className="gap-1.5 rounded-lg">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
              <Button onClick={openAddDialog} size="sm" className="gap-1.5 rounded-lg">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Lead</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isLoading && <StageChart leads={leads} />}
        {!isLoading && <div className="mt-4"><FollowUpToday leads={leads} onLeadClick={handleLeadClick} /></div>}

        {/* Mobile search */}
        <div className="sm:hidden mt-4 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm rounded-lg"
          />
        </div>

        {!isLoading && leads.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <TagFilter leads={leads} selectedTags={selectedTags} onChange={setSelectedTags} />
            {owners.length > 0 && (
              <div className="flex items-center gap-1.5">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                  <SelectTrigger className="h-7 text-xs w-40 rounded-lg">
                    <SelectValue placeholder="All owners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All owners</SelectItem>
                    {owners.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : view === "board" ? (
          <PipelineBoard
            leads={filteredLeads}
            onDragEnd={handleDragEnd}
            onLeadClick={handleLeadClick}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
          />
        ) : (
          <LeadListView
            leads={filteredLeads}
            onLeadClick={handleLeadClick}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
          />
        )}
        </div>
      </main>

      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onChangeStage={handleBulkChangeStage}
          onDelete={handleBulkDelete}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Form Dialog */}
      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editingLead}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}