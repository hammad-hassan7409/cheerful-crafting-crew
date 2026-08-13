import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, PlusCircle, FolderOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
            <Link to="/admin/products/new">
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