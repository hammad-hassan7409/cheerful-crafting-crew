import { createServerFn } from "@tanstack/react-start";

export const getStorageUsage = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. Get all products to find which media files are actually in use
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("media_url");
    
    const usedPaths = new Set();
    products?.forEach(p => {
      if (p.media_url) {
        try {
          const url = new URL(p.media_url);
          const pathParts = url.pathname.split("product-media/");
            const filePath = pathParts[1];
            if (filePath) {
              usedPaths.add(decodeURIComponent(filePath));
            }
        } catch (e) {}
      }
    });

    // 2. List all files in storage
    const { data: files, error } = await supabaseAdmin.storage
      .from("product-media")
      .list("", { limit: 1000 });

    if (error) {
      console.error("Error listing storage files:", error);
      return { totalBytes: 0, count: 0, formattedSize: "0 Bytes", remainingBytes: 0, remainingFormatted: "256 GB" };
    }

    // 3. Find orphaned files (files in storage but not linked to any product)
    const orphanedFiles = files?.filter(file => !usedPaths.has(file.name)) || [];
    
    // 4. Cleanup: Delete orphaned files to keep storage accurate
    if (orphanedFiles.length > 0) {
      console.log(`Cleaning up ${orphanedFiles.length} orphaned storage files`);
      await supabaseAdmin.storage
        .from("product-media")
        .remove(orphanedFiles.map(f => f.name));
    }

    // 5. Recalculate based on active files only
    const activeFiles = files?.filter(file => usedPaths.has(file.name)) || [];
    const totalBytes = activeFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0;
    const limitBytes = 1024 * 1024 * 1024 * 256; // 256GB
    const remainingBytes = Math.max(0, limitBytes - totalBytes);
    
    return {
      totalBytes,
      count: activeFiles.length,
      formattedSize: formatBytes(totalBytes),
      remainingBytes,
      remainingFormatted: formatBytes(remainingBytes)
    };
  });

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
