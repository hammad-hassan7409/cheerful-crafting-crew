import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ path: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let filePath: string = data.path;
    
    // Improved path extraction logic
    console.log("[MediaFn] Original path:", filePath);
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
            // Check if it's a signed URL or public URL with storage path
            // Example: .../storage/v1/object/sign/product-media/filename.mp4
            const signIndex = url.pathname.indexOf('/sign/product-media/');
            if (signIndex !== -1) {
              filePath = url.pathname.substring(signIndex + '/sign/product-media/'.length);
            } else {
              filePath = parts[parts.length - 1]!;
            }
          }
        }
      } catch (e) {
        console.error("[MediaFn] Error parsing media URL:", e);
      }
    }
    console.log("[MediaFn] Extracted filePath:", filePath);
    
    // Clean up query parameters and URL encoding
    filePath = decodeURIComponent(filePath.split('?')[0]!);
    
    if (!filePath) {
      throw new Error("Invalid media path provided");
    }
    
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("product-media")
      .createSignedUrl(filePath, 21600); // 6 hours to reduce re-fetching and 403s during long sessions

    if (error || !signedData?.signedUrl) {
      console.error("[MediaFn] Signed URL error:", error, "Path:", filePath);
      if (error?.message?.includes('Object not found') || (error as any)?.status === 404) {
        return null;
      }
      throw new Error(`Failed to generate access to media: ${error?.message || 'Unknown error'}`);
    }

    return signedData.signedUrl;
  });




