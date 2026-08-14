import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category_id: z.string().uuid("Category is required"),
  media_url: z.string().min(1, "Please upload a media file"),
  media_type: z.enum(["image", "video"]),
  original_price: z.number().min(0),
  discounted_price: z.number().min(0),
  description: z.string().refine((val) => {
    if (!val) return true;
    const words = val.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length <= 500;
  }, "Maximum description length is 500 words"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getProduct(productId: string) {
  if (productId === "new") return null;
  const { data, error } = await supabase.from("products").select("*").eq("id", productId).single();
  if (error) throw error;
  return data;
}
