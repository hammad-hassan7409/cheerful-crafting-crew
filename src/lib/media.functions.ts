import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ path: z.string() }).parse(data))
  .handler(async ({ data }) => {
    // We import supabaseAdmin inside the handler to keep it server-side
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Path might be a full URL if it was already saved that way
    let filePath: string = data.path;
    
    console.log('[MediaFn] Processing path:', filePath);
    
    // If it's a full URL, we need to extract the path within the bucket
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        // The path in Supabase Storage URLs is typically /storage/v1/object/public/bucket-name/filename
        // or /storage/v1/object/authenticated/bucket-name/filename
        const pathParts = url.pathname.split('/product-media/');
        if (pathParts.length > 1) {
          filePath = pathParts[pathParts.length - 1]!;
        } else {
          // If the split failed, maybe the bucket name is different in the URL
          const parts = url.pathname.split('/');
          filePath = parts[parts.length - 1]!;
        }
      } catch (e) {
        console.error("[MediaFn] Error parsing media URL:", e);
      }
    }
    
    // Clean up query parameters if they exist in the path
    filePath = filePath.split('?')[0]!;
    
    // Decode the path because it might be URL encoded (e.g. spaces as %20)
    // Supabase storage methods expect the raw path
    const decodedPath = decodeURIComponent(filePath);
    
    console.log('[MediaFn] Final decoded path:', decodedPath);
    
    if (!decodedPath) {
      throw new Error("Invalid media path provided");
    }
    
    // Use service role client to ensure we can always generate signed URLs for legitimate media
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("product-media")
      .createSignedUrl(decodedPath, 3600); // 1 hour

    if (error || !signedData?.signedUrl) {
      console.error("[MediaFn] Error generating signed URL for path:", decodedPath, error);
      
      // Fallback: If signing fails but the bucket is public, we might be able to use the public URL
      // However, we strictly follow the signed URL requirement for protection.
      throw new Error(`Failed to generate access to media: ${error?.message || 'Unknown error'}`);
    }

    return signedData.signedUrl;
  });


