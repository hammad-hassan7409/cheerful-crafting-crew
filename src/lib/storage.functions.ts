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
          // Extract the filename from the URL
          const url = new URL(p.media_url);
          const pathParts = url.pathname.split("product-media/");
          const filePath = pathParts[pathParts.length - 1];
          if (filePath) {
            // Clean up query params and decode
            const cleanPath = decodeURIComponent(filePath.split('?')[0]!);
            usedPaths.add(cleanPath);
          }
        } catch (e) {
          console.error("Error parsing media URL for storage usage:", p.media_url, e);
        }
      }
    });

    // 2. List all files in storage
    const { data: files, error } = await supabaseAdmin.storage
      .from("product-media")
      .list("", { limit: 5000 }); // Increase limit to be safer

    if (error) {
      console.error("Error listing storage files:", error);
      return { totalBytes: 0, count: 0, formattedSize: "0 Bytes", remainingBytes: 0, remainingFormatted: "256 GB" };
    }

    // 3. Find orphaned files (files in storage but not linked to any product)
    // IMPORTANT: Only delete files older than 2 hours to avoid race conditions during upload
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));
    
    const orphanedFiles = files?.filter(file => {
      if (usedPaths.has(file.name)) return false;
      
      // Check if file is old enough to be considered truly orphaned
      const createdDate = file.created_at ? new Date(file.created_at) : null;
      if (!createdDate) return true; // If no date, assume it's safe to delete if orphaned
      
      return createdDate < twoHoursAgo;
    }) || [];
    
    // 4. Cleanup: Delete truly orphaned files
    if (orphanedFiles.length > 0) {
      console.log(`Cleaning up ${orphanedFiles.length} truly orphaned storage files`);
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
