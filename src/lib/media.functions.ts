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
        const pathname = url.pathname;
        const bucketToken = `/${bucketName}/`;
        const index = pathname.indexOf(bucketToken);
        
        if (index !== -1) {
          filePath = pathname.substring(index + bucketToken.length);
        } else {
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
    
    const pathWithoutQuery = filePath.split('?')[0];
    filePath = decodeURIComponent(pathWithoutQuery!);
    filePath = filePath.replace(/^.*?product-media\//, '').replace(/^\/+/, '');
    
    if (!filePath) return null;
    
    try {
      const { data: signedData, error } = await supabaseAdmin.storage
        .from("product-media")
        .createSignedUrl(filePath, 21600);

      return signedData?.signedUrl || null;
    } catch (err) {
      return null;
    }
  });
