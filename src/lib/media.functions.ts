import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ path: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let filePath: string = data.path;
    
    console.log("[MediaFn] Raw input path:", filePath);

    // If it's already a full URL, we need to extract the path within the bucket
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        // Look for the bucket name in the path
        const bucketName = 'product-media';
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.indexOf(bucketName);
        
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          filePath = pathParts.slice(bucketIndex + 1).join('/');
          console.log("[MediaFn] Extracted path from URL:", filePath);
        }
      } catch (e) {
        console.error("[MediaFn] Error parsing media URL:", e);
      }
    }
    
    // Clean up query parameters and URL encoding
    filePath = filePath.split('?')[0]!;
    filePath = decodeURIComponent(filePath);
    
    // Final cleanup: remove bucket name if it's still there and any leading slashes
    filePath = filePath.replace(/^.*?product-media\//, '').replace(/^\/+/, '');
    
    console.log("[MediaFn] Final cleaned path for signing:", filePath);
    
    if (!filePath) {
      console.error("[MediaFn] No valid file path extracted");
      return null;
    }
    
    try {
      // Use a generous expiration (6 hours = 21600 seconds)
      const { data: signedData, error } = await supabaseAdmin.storage
        .from("product-media")
        .createSignedUrl(filePath, 21600);

      if (error) {
        console.error("[MediaFn] Supabase signing error:", error.message, "Path:", filePath);
        return null;
      }
      
      if (!signedData?.signedUrl) {
        console.error("[MediaFn] No signed URL returned for path:", filePath);
        return null;
      }

      return signedData.signedUrl;
    } catch (err) {
      console.error("[MediaFn] Unexpected error during signing:", err);
      return null;
    }
  });
