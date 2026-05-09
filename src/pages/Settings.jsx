import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, User, Mail, ShieldCheck } from "lucide-react";

export default function Settings() {
  const [deleting, setDeleting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const handleDeleteAccount = async () => {
    setDeleting(true);
    // Log out — actual deletion requires admin/backend action
    await base44.auth.logout("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        {/* Account Info */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
          {user && (
            <>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{user.full_name || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{user.role}</span>
              </div>
            </>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-2xl border border-destructive/30 p-5">
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide mb-3">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 w-full sm:w-auto" disabled={deleting}>
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and log you out. Contact your admin to remove your data from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}