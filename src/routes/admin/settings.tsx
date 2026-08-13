import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KeyRound, UserPlus, ShieldAlert, Trash2, Users } from "lucide-react";
import { createAdminUser, listAdminUsers, deleteAdminUser } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
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
  const listAdmins = useServerFn(listAdminUsers);
  const deleteAdmin = useServerFn(deleteAdminUser);

  const [admins, setAdmins] = useState<{ id: string; email: string | undefined }[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [deleteOwnerPassword, setDeleteOwnerPassword] = useState("");

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
        data: {
          email: adminEmail,
          password: adminPassword,
          ownerEmail: "ammarhassan1888@gmail.com",
          ownerPassword: ownerPassword,
        }
      });

      toast.success("New admin created successfully");
      setAdminEmail("");
      setAdminPassword("");
      setOwnerPassword("");
      fetchAdmins();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast.error(error.message || "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdminId) return;

    setLoading(true);
    try {
      await deleteAdmin({
        data: {
          userIdToDelete: deletingAdminId,
          ownerEmail: "ammarhassan1888@gmail.com",
          ownerPassword: deleteOwnerPassword,
        }
      });

      toast.success("Admin deleted successfully");
      setDeletingAdminId(null);
      setDeleteOwnerPassword("");
      fetchAdmins();
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      toast.error(error.message || "Failed to delete admin");
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

      {/* Manage Admins */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage Admins
          </CardTitle>
          <CardDescription>
            List and remove existing administrator accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingAdmins ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No other admins found.</p>
            ) : (
              <div className="grid gap-3">
                {admins.map((admin) => (
                  <div 
                    key={admin.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{admin.email}</p>
                      {admin.email === "ammarhassan1888@gmail.com" && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">
                          Owner
                        </span>
                      )}
                    </div>
                    
                    {admin.email !== "ammarhassan1888@gmail.com" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingAdminId(admin.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Admin Account?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove <strong>{admin.email}</strong> from the admin portal.
                              You must provide the owner password to confirm.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <div className="py-4 space-y-2">
                            <Label htmlFor="deleteOwnerPassword">Owner Password</Label>
                            <Input
                              id="deleteOwnerPassword"
                              type="password"
                              placeholder="Enter owner password"
                              value={deleteOwnerPassword}
                              onChange={(e) => setDeleteOwnerPassword(e.target.value)}
                              className="bg-background border-border"
                            />
                          </div>

                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                              setDeletingAdminId(null);
                              setDeleteOwnerPassword("");
                            }}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteAdmin}
                              disabled={!deleteOwnerPassword || loading}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {loading ? "Deleting..." : "Delete Admin"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
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