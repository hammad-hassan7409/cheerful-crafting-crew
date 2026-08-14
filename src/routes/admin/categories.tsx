import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2, Edit, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!name.trim()) throw new Error("Category name is required");
      const { error } = await supabase
        .from("categories")
        .update({ name: name.trim().toUpperCase() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category updated");
      setEditingId(null);
      setEditingName("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update category");
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
              {editingId === category.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") updateMutation.mutate({ id: category.id, name: editingName });
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-500"
                    onClick={() => updateMutation.mutate({ id: category.id, name: editingName })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setEditingId(null)}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="font-medium">{category.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm("Are you sure? This will delete all products in this category.")) {
                          deleteMutation.mutate(category.id);
                        }
                      }}
                    >
                      {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}