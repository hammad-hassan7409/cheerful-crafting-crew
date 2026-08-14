import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ path: z.string() }).parse(data))
  .handler(async ({ data }) => {
    // We import supabaseAdmin inside the handler to keep it server-side
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Path might be a full URL if it was already saved that way
    let filePath: string = data.path;
    
    // If it's a full URL, we need to extract the path within the bucket
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
            filePath = parts[parts.length - 1]!;
          }
        }
      } catch (e) {
        console.error("[MediaFn] Error parsing media URL:", e);
      }
    }
    
    // Clean up query parameters if they exist in the path
    filePath = filePath.split('?')[0]!;
    
    // Decode the path because it might be URL encoded
    const decodedPath = decodeURIComponent(filePath);
    
    if (!decodedPath) {
      throw new Error("Invalid media path provided");
    }
    
    // Use service role client to ensure we can always generate signed URLs for legitimate media
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("product-media")
      .createSignedUrl(decodedPath, 7200); // 2 hours for stable viewing session

    if (error || !signedData?.signedUrl) {
      if (error?.message?.includes('Object not found') || (error as any)?.status === 404 || (error as any)?.code === 'NoSuchKey') {
        return null;
      }
      
      throw new Error(`Failed to generate access to media: ${error?.message || 'Unknown error'}`);
    }

    return signedData.signedUrl;
  });



