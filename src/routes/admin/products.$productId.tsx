import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

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

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      console.log("Saving product values:", values);
      if (isNew) {
        const { data, error } = await supabase.from("products").insert([values]).select();
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        return data;
      } else {
        const { data, error } = await supabase.from("products").update(values).eq("id", productId).select();
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Product created" : "Product updated");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      navigate({ to: "/admin" });
    },
    onError: (error: any) => {
      console.error("Mutation error callback:", error);
      toast.error(error.message || "Failed to save changes");
    },
  });

  const performUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setPendingFile(file);

    // Create local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    form.setValue("media_type", file.type.startsWith("video") ? "video" : "image", { shouldValidate: true });

    try {
      // 1. Ensure bucket exists (Try to create if it doesn't - will fail if RLS prevents but good attempt)
      // This is a common issue where the bucket is missing in the specific environment.
      // We try to use it and handle errors.
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + 5;
        });
      }, 200);

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("product-media")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(interval);

      if (uploadErr) {
        // Technical cause identified: If bucket doesn't exist or RLS fails
        throw uploadErr;
      }

      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from("product-media")
        .getPublicUrl(filePath);

      form.setValue("media_url", publicUrl, { shouldValidate: true });
      setPendingFile(null);
      toast.success("File uploaded successfully to storage");
    } catch (error: any) {
      console.error("Upload error details:", error);
      const msg = error.message || "Failed to upload media. The storage bucket may be unavailable.";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset the file input
    e.target.value = "";
    
    await performUpload(file);
  };

  const removeMedia = async () => {
    const mediaUrl = form.getValues("media_url") || "";
    
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }

    if (!mediaUrl) {
      form.setValue("media_url", "", { shouldValidate: true });
      return;
    }

    try {
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
      form.setValue("media_url", "", { shouldValidate: true });
    }
  };

  if (productLoading) return <div>Loading...</div>;

  const currentMediaUrl = form.watch("media_url");
  const currentMediaType = form.watch("media_type");
  const displayUrl = localPreview || currentMediaUrl;

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
          
          {displayUrl ? (
            <div className="space-y-4">
              <div className="relative group rounded-lg overflow-hidden border border-zinc-200 aspect-video bg-black flex items-center justify-center">
                {currentMediaType === "video" ? (
                  <video 
                    src={displayUrl} 
                    className="max-w-full max-h-full"
                    controls
                    autoPlay
                    muted
                    key={displayUrl} // Force reload when URL changes
                  />
                ) : (
                  <img 
                    src={displayUrl} 
                    alt="Product preview" 
                    className="max-w-full max-h-full object-contain"
                    key={displayUrl}
                  />
                )}
                
                {!uploading && (
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
                )}

                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-white space-y-3">
                    <Progress value={uploadProgress} className="w-full h-2" />
                    <p className="text-sm font-bold animate-pulse">Uploading to server...</p>
                  </div>
                )}
              </div>

              {!currentMediaUrl && !uploading && uploadError && (
                 <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
                    <p className="text-sm text-destructive font-bold">Upload Failed: {uploadError}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (pendingFile) performUpload(pendingFile);
                        }}
                      >
                        Retry Upload
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.preventDefault();
                          removeMedia();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                 </div>
              )}

              {currentMediaUrl && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  ✓ Successfully saved to storage
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-zinc-300 border-dashed rounded-lg cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-zinc-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-zinc-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-zinc-500">Video or Image (MAX. 50MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept="image/*,video/*" 
                    disabled={uploading}
                  />
                </label>
              </div>
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
              {...form.register("original_price", { 
                valueAsNumber: true,
                required: "Original price is required"
              })} 
            />
            {form.formState.errors.original_price && (
              <p className="text-sm text-destructive">{form.formState.errors.original_price.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="discounted_price">Discounted Price (Actual)</Label>
            <Input 
              id="discounted_price" 
              type="number" 
              {...form.register("discounted_price", { 
                valueAsNumber: true,
                required: "Discounted price is required"
              })} 
            />
            {form.formState.errors.discounted_price && (
              <p className="text-sm text-destructive">{form.formState.errors.discounted_price.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={mutation.isPending || uploading || (!currentMediaUrl && !!localPreview)}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isNew ? "Create Product" : "Save Changes"}
          </Button>
          <Button 
            variant="outline" 
            type="button" 
            disabled={mutation.isPending}
            onClick={() => navigate({ to: "/admin" })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
