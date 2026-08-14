import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KeyRound, Share2, MessageSquare, Video } from "lucide-react";
import { listAdminUsers } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      const settingsMap: Record<string, any> = {};
      data.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      return settingsMap;
    },
  });

  const [whatsapp, setWhatsapp] = useState("");
  const [tiktok, setTiktok] = useState("");

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings["whatsapp_number"] || "");
      setTiktok(settings["tiktok_url"] || "");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ whatsapp, tiktok }: { whatsapp: string; tiktok: string }) => {
      const updates = [
        { key: "whatsapp_number", value: whatsapp },
        { key: "tiktok_url", value: tiktok },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert(update, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Social links updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update social links: " + error.message);
    },
  });

  const handleUpdateSocials = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ whatsapp, tiktok });
  };

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication session expired. Please log in again.");
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email!,
        password: currentPassword,
      });

      if (authError) {
        throw new Error("Current password is incorrect.");
      }

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
      let errorMessage = error.message || "Failed to update password";
      
      if (error.code === 'weak_password') {
        errorMessage = "This password is too common or easy to guess. Please choose a stronger password with a mix of letters, numbers, and symbols.";
      } else if (error.message && error.message.toLowerCase().includes("weak to guess")) {
        errorMessage = "This password is too common or easy to guess. Please choose a stronger password.";
      } else if (error.status === 400 && error.message.includes("different")) {
        errorMessage = "New password must be different from the current password.";
      }
      
      toast.error(errorMessage);
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

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Social Media Links
          </CardTitle>
          <CardDescription>
            Update your WhatsApp number and TikTok profile link shown in the footer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateSocials} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number (with country code, e.g., 920123456789)</Label>
              <div className="relative">
                <Input
                  id="whatsapp"
                  type="text"
                  placeholder="923021937758"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="bg-background/50 border-border/50 pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok Profile URL</Label>
              <div className="relative">
                <Input
                  id="tiktok"
                  type="url"
                  placeholder="https://www.tiktok.com/@yourusername"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="bg-background/50 border-border/50 pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Video className="h-4 w-4" />
                </div>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending || settingsLoading} 
              className="w-full sm:w-auto"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Social Links"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

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
    </div>
  );
}
