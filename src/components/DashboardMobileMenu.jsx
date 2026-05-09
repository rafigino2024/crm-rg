import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Download, Upload, Mail } from "lucide-react";

export default function DashboardMobileMenu({
  onExportCSV,
  onImportCSV,
  onEmailTemplates,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-lg">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImportCSV}>
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEmailTemplates}>
          <Mail className="w-4 h-4 mr-2" />
          Email Templates
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}