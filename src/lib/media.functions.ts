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
        // Supabase storage URLs can be:
        // /storage/v1/object/public/bucket/path
        // /storage/v1/object/sign/bucket/path
        // /storage/v1/object/authenticated/bucket/path
        const bucketToken = '/product-media/';
        const index = url.pathname.indexOf(bucketToken);
        
        if (index !== -1) {
          filePath = url.pathname.substring(index + bucketToken.length);
        } else {
          // Fallback for different URL structures
          const parts = url.pathname.split('/');
          const bucketIndex = parts.indexOf('product-media');
          if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
            filePath = parts.slice(bucketIndex + 1).join('/');
          } else {
            filePath = parts[parts.length - 1]!;
          }
        }
        console.log('[MediaFn] Extracted path from URL:', filePath);
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
      .createSignedUrl(decodedPath, 3600, { download: false }); // 1 hour

    if (error || !signedData?.signedUrl) {
      console.error("[MediaFn] Error generating signed URL for path:", decodedPath, error);
      
      // If the error is that the object was not found, return null instead of throwing
      // This allows the UI to handle the missing media gracefully
      if (error?.message?.includes('Object not found') || (error as any)?.status === 404 || (error as any)?.code === 'NoSuchKey') {
        console.warn(`[MediaFn] Media file not found: ${decodedPath}`);
        return null;
      }
      
      throw new Error(`Failed to generate access to media: ${error?.message || 'Unknown error'}`);
    }

    return signedData.signedUrl;
  });


