import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, PlusCircle, FolderOpen, HardDrive } from "lucide-react";
import { Link, useSearch } from "@tanstack/react-router";
import { getStorageUsage } from "@/lib/storage.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchStorage = useServerFn(getStorageUsage);

  const { data: storageInfo } = useQuery({
    queryKey: ["storage-usage"],
    queryFn: () => fetchStorage(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" });
      } else {
        setSession(session);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate({ to: "/login" });
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/" className="text-xl font-bold text-primary">AR EDITZ Admin</Link>
        </div>
        <nav className="p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/admin/products/$productId" params={{ productId: "new" }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/admin/categories">
              <FolderOpen className="mr-2 h-4 w-4" />
              Categories
            </Link>
          </Button>
          
          <div className="mt-8 px-4 py-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <HardDrive className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">Storage Used</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{storageInfo?.formattedSize || "0 MB"}</span>
                <span className="text-muted-foreground">{storageInfo?.count || 0} files</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${Math.min((storageInfo?.totalBytes || 0) / (1024 * 1024 * 1024 * 5) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic">Approx. usage of 128GB total</p>
            </div>
          </div>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}