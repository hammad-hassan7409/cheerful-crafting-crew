import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("is_pinned", { ascending: false })
        .order("pin_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_pinned: !is_pinned, pin_order: !is_pinned ? 0 : 0 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product pinning updated");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: any) => {
      // 1. Delete media from storage if it exists
      if (product.media_url) {
        try {
          const url = new URL(product.media_url);
          const pathParts = url.pathname.split("product-media/");
          if (pathParts.length > 1) {
            const filePath = pathParts[1];
            if (filePath) {
              await supabase.storage.from("product-media").remove([decodeURIComponent(filePath)]);
            }
          }
        } catch (storageErr) {
          console.error("Failed to delete storage file:", storageErr);
        }
      }

      // 2. Delete product from database
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product and media deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (isLoading) return <div>Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/admin/products/$productId" params={{ productId: "new" }}>Add Product</Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 font-medium text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products?.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  {product.name}
                  {product.is_pinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      <Pin className="h-3 w-3 fill-current" />
                      Pinned #{product.pin_order}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{(product.categories as any)?.name}</td>
                <td className="px-4 py-3">
                  <span className="font-bold text-primary">RS. {product.discounted_price}</span>
                  <span className="ml-2 text-xs text-muted-foreground line-through">
                    RS. {product.original_price}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={product.is_pinned ? "text-primary" : "text-muted-foreground"}
                      onClick={() => togglePinMutation.mutate({ id: product.id, is_pinned: !!product.is_pinned })}
                      title={product.is_pinned ? "Unpin from home" : "Pin to home"}
                    >
                      {product.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/admin/products/$productId" params={{ productId: product.id }}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this product? This will also remove its media file from storage.")) {
                          deleteMutation.mutate(product);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No products found. Add your first product!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}