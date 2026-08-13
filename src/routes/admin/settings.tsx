import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { listAdminUsers } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const listAdmins = useServerFn(listAdminUsers);

  const [admins, setAdmins] = useState<{ id: string; email: string | undefined }[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // 1. Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication session expired. Please log in again.");
      }

      // 2. Verify current password by attempting a re-login/re-auth
      // Supabase doesn't have a direct "verifyPassword" for the current session,
      // so we use signInWithPassword which will verify credentials.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email!,
        password: currentPassword,
      });

      if (authError) {
        throw new Error("Current password is incorrect.");
      }

      // 3. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
        <p className="text-muted-foreground">Manage your admin account and portal access.</p>
      </div>

      {/* Change Password */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Change Your Password
          </CardTitle>
          <CardDescription>
            Update your own admin portal password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrent ? <KeyRound className="h-4 w-4" /> : <KeyRound className="h-4 w-4 opacity-50" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? <KeyRound className="h-4 w-4" /> : <KeyRound className="h-4 w-4 opacity-50" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <KeyRound className="h-4 w-4" /> : <KeyRound className="h-4 w-4 opacity-50" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Details about your current administrator account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingAdmins ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-3">
                {admins.map((admin) => (
                  admin.email === "ammarhassan1888@gmail.com" && (
                    <div 
                      key={admin.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{admin.email}</p>
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">
                          Owner
                        </span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20 opacity-50">
            <div>
              <p className="font-medium">Reset Account Data</p>
              <p className="text-sm text-muted-foreground">This is just a placeholder. Use with caution.</p>
            </div>
            <Button variant="destructive" disabled>
              Reset Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}