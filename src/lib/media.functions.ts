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
        const pathParts = url.pathname.split('/product-media/');
        if (pathParts.length > 1) {
          filePath = pathParts[pathParts.length - 1]!;
        }
      } catch (e) {
        console.error("Error parsing media URL:", e);
      }
    }
    
    // Clean up query parameters if they exist in the path
    filePath = filePath.split('?')[0]!;

    
    if (!filePath) {
      throw new Error("Invalid media path provided");
    }
    
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("product-media")
      .createSignedUrl(decodeURIComponent(filePath), 3600); // 1 hour

    if (error || !signedData?.signedUrl) {
      console.error("Error generating signed URL:", error);
      throw new Error("Failed to generate access to media");
    }

    return signedData.signedUrl;
  });


