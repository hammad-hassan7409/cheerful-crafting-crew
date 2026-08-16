import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const updatePinOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => 
    z.object({ 
      productId: z.string(), 
      newOrder: z.number().int().min(0) 
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { productId, newOrder } = data;

    // Get current products to handle reordering
    const { data: products, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("id, pin_order, is_pinned")
      .order("pin_order", { ascending: true });

    if (fetchError) throw fetchError;

    const currentProduct = products.find(p => p.id === productId);
    const oldOrder = currentProduct?.pin_order || 0;

    // If clearing pin
    if (newOrder === 0) {
      await supabaseAdmin
        .from("products")
        .update({ is_pinned: false, pin_order: 0 })
        .eq("id", productId);
      return { success: true };
    }

    // Assign new order and adjust others
    // Logic: If we set a product to X, any product currently >= X should be shifted up
    // unless they were already after the old position (if it was pinned).
    
    // Simpler approach: 
    // 1. Remove the product from the pinned list
    // 2. Insert it at the new position
    // 3. Re-index everyone else
    
    let pinnedProducts = products.filter(p => p.is_pinned && p.id !== productId && p.pin_order! > 0);
    
    // Find where to insert
    const insertIndex = pinnedProducts.findIndex(p => p.pin_order! >= newOrder);
    
    if (insertIndex === -1) {
      pinnedProducts.push({ id: productId, pin_order: newOrder, is_pinned: true });
    } else {
      pinnedProducts.splice(insertIndex, 0, { id: productId, pin_order: newOrder, is_pinned: true });
    }

    // Update all pinned products with sequential orders starting from 1
    // to ensure no duplicates and consistent ordering
    const updates = pinnedProducts.map((p, index) => {
      return supabaseAdmin
        .from("products")
        .update({ is_pinned: true, pin_order: index + 1 })
        .eq("id", p.id);
    });

    await Promise.all(updates);

    return { success: true };
  });
