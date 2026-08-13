import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [newCategory, setNewCategory] = useState("");
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!name.trim()) throw new Error("Category name is required");
      const { error } = await supabase.from("categories").insert([{ name: name.trim().toUpperCase() }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category added");
      setNewCategory("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (isLoading) return <div>Loading categories...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manage Categories</h1>
        <p className="text-muted-foreground">Add or remove product categories.</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="New Category Name (e.g. THUMBNAILS)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </div>
        <Button onClick={() => addMutation.mutate(newCategory)} disabled={!newCategory || addMutation.isPending}>
          {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Category
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <ul className="divide-y">
          {categories?.map((category) => (
            <li key={category.id} className="flex items-center justify-between p-4">
              <span className="font-medium">{category.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => {
                  if (confirm("Are you sure? This will delete all products in this category.")) {
                    deleteMutation.mutate(category.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}