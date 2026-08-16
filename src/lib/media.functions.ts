import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ path: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let filePath: string = data.path;
    
    // Improved path extraction logic
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        const bucketToken = '/product-media/';
        const index = url.pathname.indexOf(bucketToken);
        
        if (index !== -1) {
          filePath = url.pathname.substring(index + bucketToken.length);
        } else {
          const parts = url.pathname.split('/');
          const bucketIndex = parts.indexOf('product-media');
          if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
            filePath = parts.slice(bucketIndex + 1).join('/');
          } else {
            console.log("[MediaFn] Final fallback path extraction:", filePath);
          }
        }
      } catch (e) {
        console.error("[MediaFn] Error parsing media URL:", e);
      }
    }
    
    // Clean up query parameters and URL encoding
    const pathWithoutQuery = filePath.split('?')[0];
    filePath = decodeURIComponent(pathWithoutQuery!);
    
    // Remove bucket name and leading slashes
    filePath = filePath.replace(/.*product-media\//, '').replace(/^\/+/, '');
    
    if (!filePath) {
      console.error("[MediaFn] Empty filePath after cleaning");
      return null;
    }
    
    try {
      const { data: signedData, error } = await supabaseAdmin.storage
        .from("product-media")
        .createSignedUrl(filePath, 21600);

      if (error) {
        console.error("[MediaFn] Supabase signing error:", error.message, "Path:", filePath);
        return null;
      }
      
      return signedData?.signedUrl || null;
    } catch (err) {
      console.error("[MediaFn] Unexpected error during signing:", err);
      return null;
    }
  });
