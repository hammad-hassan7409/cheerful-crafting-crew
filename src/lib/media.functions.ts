import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ path: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let filePath: string = data.path;
    
    // Hardened path extraction logic
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        const bucketName = 'product-media';
        
        // Handle various URL formats (public, signed, or storage API)
        // 1. Check for /object/public/bucket/path
        // 2. Check for /object/sign/bucket/path
        // 3. Check for bucket name in path
        const pathname = url.pathname;
        const bucketToken = `/${bucketName}/`;
        const index = pathname.indexOf(bucketToken);
        
        if (index !== -1) {
          filePath = pathname.substring(index + bucketToken.length);
        } else {
          // Fallback: split and look for bucket index
          const parts = pathname.split('/');
          const bucketIndex = parts.indexOf(bucketName);
          if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
            filePath = parts.slice(bucketIndex + 1).join('/');
          }
        }
      } catch (e) {
        console.error("[MediaFn] Error parsing media URL:", e);
      }
    }
    
    // Clean up query parameters and URL encoding
    const pathWithoutQuery = filePath.split('?')[0];
    filePath = decodeURIComponent(pathWithoutQuery!);
    
    // Remove bucket name if still present and leading slashes
    filePath = filePath.replace(/^.*?product-media\//, '').replace(/^\/+/, '');
    
    if (!filePath) {
      console.error("[MediaFn] No valid file path extracted for signing");
      return null;
    }
    
    try {
      const { data: signedData, error } = await supabaseAdmin.storage
        .from("product-media")
        .createSignedUrl(filePath, 21600); // 6 hours

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
