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
import { Send } from "lucide-react";
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
    await base44.integrations.Core.SendEmail({
      to: lead.email,
      subject,
      body: body.replace(/\n/g, "<br/>"),
    });
    toast.success(`Email sent to ${lead.email}`);
    setSending(false);
    onOpenChange(false);
    setSelectedTemplateId("");
    setSubject("");
    setBody("");
  };

  const handleClose = (val) => {
    if (!val) {
      setSelectedTemplateId("");
      setSubject("");
      setBody("");
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