import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ path: z.string() }).parse(data))
  .handler(async ({ data }) => {
    // We import supabaseAdmin inside the handler to keep it server-side
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Path might be a full URL if it was already saved that way
    let filePath = data.path;
    if (filePath.includes("product-media/")) {
      const parts = filePath.split("product-media/");
      filePath = parts[parts.length - 1];
    }
    
    if (!filePath) {
      throw new Error("Invalid media path provided");
    }
    
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("product-media")
      .createSignedUrl(decodeURIComponent(filePath), 3600); // 1 hour

    if (error) {
      console.error("Error generating signed URL:", error);
      throw new Error("Failed to generate access to media");
    }

    return signedData.signedUrl;
  });

