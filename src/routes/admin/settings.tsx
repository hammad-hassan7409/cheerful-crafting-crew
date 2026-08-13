import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KeyRound, UserPlus, ShieldAlert } from "lucide-react";
import { createAdminUser } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // New Admin State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const createAdmin = useServerFn(createAdminUser);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminPassword.length < 6) {
      toast.error("Admin password must be at least 6 characters long");
      return;
    }

    setCreatingAdmin(true);
    try {
      await createAdmin({
        email: adminEmail,
        password: adminPassword,
        ownerEmail: "ammarhassan1888@gmail.com",
        ownerPassword: ownerPassword,
      });

      toast.success("New admin created successfully");
      setAdminEmail("");
      setAdminPassword("");
      setOwnerPassword("");
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast.error(error.message || "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
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
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background/50 border-border/50"
              />
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

      {/* Create New Admin */}
      <Card className="bg-card/50 border-border/50 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <UserPlus className="h-5 w-5" />
            Create New Admin
          </CardTitle>
          <CardDescription>
            Register a new administrator. Only the main owner can perform this action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">New Admin Gmail</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="example@gmail.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">New Admin Password</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Create password (min 6 chars)"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                className="bg-background/50 border-border/50"
              />
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-3 text-destructive font-medium text-sm">
                <ShieldAlert className="h-4 w-4" />
                Owner Verification Required
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerPassword">Owner (ammarhassan1888@gmail.com) Password</Label>
                <Input
                  id="ownerPassword"
                  type="password"
                  placeholder="Enter your owner password to authorize"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  required
                  className="bg-background/50 border-destructive/20 focus-visible:ring-destructive"
                />
              </div>
            </div>

            <Button type="submit" disabled={creatingAdmin} className="w-full sm:w-auto mt-4">
              {creatingAdmin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Admin Account"
              )}
            </Button>
          </form>
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