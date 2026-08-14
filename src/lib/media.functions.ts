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
        // Look for the bucket name in the path
        const bucketToken = '/product-media/';
        const index = url.pathname.indexOf(bucketToken);
        
        if (index !== -1) {
          filePath = url.pathname.substring(index + bucketToken.length);
        } else {
          // Fallback parsing for different URL structures
          const parts = url.pathname.split('/');
          const bucketIndex = parts.indexOf('product-media');
          if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
            filePath = parts.slice(bucketIndex + 1).join('/');
          } else {
            filePath = parts[parts.length - 1]!;
          }
        }
      } catch (e) {
        console.error("[MediaFn] Error parsing media URL:", e);
      }
    }
    
    // Clean up query parameters and URL encoding
    filePath = decodeURIComponent(filePath.split('?')[0]!);
    
    if (!filePath) {
      throw new Error("Invalid media path provided");
    }
    
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("product-media")
      .createSignedUrl(filePath, 7200); // 2 hours

    if (error || !signedData?.signedUrl) {
      console.error("[MediaFn] Signed URL error:", error, "Path:", filePath);
      if (error?.message?.includes('Object not found') || (error as any)?.status === 404) {
        return null;
      }
      throw new Error(`Failed to generate access to media: ${error?.message || 'Unknown error'}`);
    }

    return signedData.signedUrl;
  });




