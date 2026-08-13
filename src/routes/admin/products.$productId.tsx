import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category_id: z.string().uuid("Category is required"),
  media_url: z.string().min(1, "Please upload a media file"),
  media_type: z.enum(["video", "image"]),
  original_price: z.number().min(0),
  discounted_price: z.number().min(0),
});

type ProductFormValues = {
  name: string;
  category_id: string;
  media_url: string;
  media_type: "video" | "image";
  original_price: number;
  discounted_price: number;
};

export const Route = createFileRoute("/admin/products/$productId")({
  component: ProductFormPage,
});

function ProductFormPage() {
  const { productId } = useParams({ from: "/admin/products/$productId" });
  const isNew = productId === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      media_type: "image",
      original_price: 0,
      discounted_price: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        category_id: product.category_id,
        media_url: product.media_url,
        media_type: product.media_type as "video" | "image",
        original_price: Number(product.original_price),
        discounted_price: Number(product.discounted_price),
      });
    }
  }, [product, form]);

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (isNew) {
        const { error } = await supabase.from("products").insert([values]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").update(values).eq("id", productId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Product created" : "Product updated");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate({ to: "/admin" });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-media")
        .getPublicUrl(filePath);

      form.setValue("media_url", publicUrl, { shouldValidate: true });
      form.setValue("media_type", file.type.startsWith("video") ? "video" : "image", { shouldValidate: true });
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      // Reset the file input so it can be used again for the same file if needed
      e.target.value = "";
    }
  };

  const removeMedia = async () => {
    const mediaUrl = form.getValues("media_url") || "";
    if (!mediaUrl) return;

    try {
      // Extract path from public URL
      const url = new URL(mediaUrl);
      const pathParts = url.pathname.split("product-media/");
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        if (filePath) {
          await supabase.storage.from("product-media").remove([decodeURIComponent(filePath)]);
        }
      }
      
      form.setValue("media_url", "", { shouldValidate: true });
      toast.success("Media removed");
    } catch (error: any) {
      console.error("Error removing media:", error);
      // Even if storage delete fails, clear the form field
      form.setValue("media_url", "", { shouldValidate: true });
    }
  };

  if (productLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{isNew ? "Add Product" : "Edit Product"}</h1>
      </div>

      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v as any))} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            onValueChange={(val) => form.setValue("category_id", val)}
            value={form.watch("category_id")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Media File (Image or Video)</Label>
          
          {form.watch("media_url") ? (
            <div className="relative group rounded-lg overflow-hidden border border-zinc-200 aspect-video bg-zinc-50">
              {form.watch("media_type") === "video" ? (
                <video 
                  src={form.watch("media_url")} 
                  className="w-full h-full object-contain"
                  controls
                />
              ) : (
                <img 
                  src={form.watch("media_url")} 
                  alt="Product preview" 
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={(e) => {
                    e.preventDefault();
                    removeMedia();
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Input 
                id="file" 
                type="file" 
                onChange={handleFileUpload} 
                accept="image/*,video/*" 
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-primary animate-pulse">Uploading...</p>}
            </div>
          )}
          
          <Input type="hidden" {...form.register("media_url")} />
          {form.formState.errors.media_url && (
            <p className="text-sm text-destructive">{form.formState.errors.media_url.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="original_price">Original Price (Strikethrough)</Label>
            <Input 
              id="original_price" 
              type="number" 
              {...form.register("original_price", { valueAsNumber: true })} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discounted_price">Discounted Price (Actual)</Label>
            <Input 
              id="discounted_price" 
              type="number" 
              {...form.register("discounted_price", { valueAsNumber: true })} 
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={mutation.isPending || uploading}>
            {mutation.isPending ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
          </Button>
          <Button variant="outline" type="button" onClick={() => navigate({ to: "/admin" })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}