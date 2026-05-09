import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BulkImportCSV({ open, onOpenChange, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must have header and at least one data row");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row = {};
      headers.forEach((h, idx) => {
        if (values[idx] !== undefined && values[idx] !== "") {
          row[h] = values[idx];
        }
      });
      if (row.name) rows.push(row);
    }

    return rows;
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setPreview([]);
    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 5));
    } catch (err) {
      setError(err.message);
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const leads = rows.map((row) => ({
        name: row.name,
        company: row.company || undefined,
        email: row.email || undefined,
        phone: row.phone || undefined,
        stage: row.stage || "New",
        priority: row.priority || "Medium",
        estimated_value: row.estimated_value ? parseFloat(row.estimated_value) : undefined,
        assigned_to: row.assigned_to || undefined,
        tags: row.tags ? row.tags.split(";").map((t) => t.trim()) : [],
        follow_up_date: row.follow_up_date || undefined,
        notes: row.notes || undefined,
        internal_notes: row.internal_notes || undefined,
      }));

      await base44.entities.Lead.bulkCreate(leads);
      setResult({ success: true, count: leads.length });
      setFile(null);
      setPreview([]);
      onImportSuccess?.();
    } catch (err) {
      setError(err.message || "Import failed");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setError("");
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Leads</DialogTitle>
        </DialogHeader>

        {result?.success ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">{result.count} leads imported successfully</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleReset} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with columns: name, company, email, phone, stage, priority, estimated_value, assigned_to, tags (semicolon-separated), follow_up_date, notes, internal_notes
              </p>
              <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {file ? file.name : "Click to select CSV file"}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {preview.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Preview (first 5 rows)</p>
                <div className="bg-muted rounded-lg p-3 max-h-48 overflow-auto">
                  {preview.map((row, idx) => (
                    <div key={idx} className="text-xs mb-2 pb-2 border-b border-border/50 last:border-0">
                      <p className="font-medium">{row.name}</p>
                      {row.company && <p className="text-muted-foreground">{row.company}</p>}
                      {row.email && <p className="text-muted-foreground">{row.email}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{preview.length} preview rows shown</p>
              </div>
            )}

            <DialogFooter className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || uploading || error}>
                {uploading ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}