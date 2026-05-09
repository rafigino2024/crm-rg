import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, FileUp, X } from "lucide-react";
import { toast } from "sonner";

function applyPlaceholders(text, lead) {
  return text
    .replace(/\{\{name\}\}/g, lead.name || "")
    .replace(/\{\{company\}\}/g, lead.company || "");
}

export default function SendEmailDialog({ open, onOpenChange, lead }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => base44.entities.EmailTemplate.list("-created_date"),
    enabled: open,
  });

  const handleTemplateChange = (id) => {
    setSelectedTemplateId(id);
    const t = templates.find((t) => t.id === id);
    if (t) {
      setSubject(applyPlaceholders(t.subject, lead));
      setBody(applyPlaceholders(t.body, lead));
    }
  };

  const handleSend = async () => {
    if (!lead.email) {
      toast.error("This lead has no email address.");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    setSending(true);
    let bodyWithAttachments = body.replace(/\n/g, "<br/>");
    if (attachments.length > 0) {
      bodyWithAttachments += `<br/><br/><strong>Attachments:</strong><br/>`;
      attachments.forEach((att) => {
        bodyWithAttachments += `<a href="${att.url}">${att.name}</a><br/>`;
      });
    }
    await base44.integrations.Core.SendEmail({
      to: lead.email,
      subject,
      body: bodyWithAttachments,
    });
    toast.success(`Email sent to ${lead.email}`);
    setSending(false);
    onOpenChange(false);
    setSelectedTemplateId("");
    setSubject("");
    setBody("");
    setAttachments([]);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const result = await base44.integrations.Core.UploadFile({ file });
          return { name: file.name, url: result.file_url };
        })
      );
      setAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (err) {
      toast.error("Failed to upload file(s)");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = (val) => {
    if (!val) {
      setSelectedTemplateId("");
      setSubject("");
      setBody("");
      setAttachments([]);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email to {lead?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <Label>Load Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.stage && t.stage !== "Any" ? `(${t.stage})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input value={lead?.email || ""} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
            />
          </div>
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 cursor-pointer w-full"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <FileUp className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Add Files"}
                  </span>
                </Button>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1.5 bg-muted/40 rounded-lg p-2.5">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-background px-2.5 py-1.5 rounded">
                    <span className="truncate text-muted-foreground">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}