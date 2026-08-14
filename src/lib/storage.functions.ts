import { createServerFn } from "@tanstack/react-start";

export const getStorageUsage = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. List all files in storage bucket (the ultimate source of truth)
    const { data: files, error } = await supabaseAdmin.storage
      .from("product-media")
      .list("", { limit: 10000 });

    if (error) {
      console.error("Error listing storage files:", error);
      return { totalBytes: 0, count: 0, formattedSize: "0 Bytes", remainingBytes: 0, remainingFormatted: "256 GB" };
    }

    // 2. Calculate total usage from the actual files in the bucket
    const totalBytes = files?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0;
    const count = files?.length || 0;
    const limitBytes = 1024 * 1024 * 1024 * 256; // 256GB
    const remainingBytes = Math.max(0, limitBytes - totalBytes);

    // 3. Background cleanup (non-blocking)
    // We clean up files that aren't in the database AND are older than 2 hours
    const cleanupOrphaned = async () => {
      const { data: products } = await supabaseAdmin.from("products").select("media_url");
      const usedPaths = new Set();
      products?.forEach(p => {
        if (p.media_url) {
          try {
            const url = new URL(p.media_url);
            const pathParts = url.pathname.split("product-media/");
            const filePath = pathParts[pathParts.length - 1];
            if (filePath) {
              const cleanPath = decodeURIComponent(filePath.split('?')[0]!);
              usedPaths.add(cleanPath);
            }
          } catch (e) {}
        }
      });

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));
      const orphanedFiles = files?.filter(file => {
        if (usedPaths.has(file.name)) return false;
        const createdDate = file.created_at ? new Date(file.created_at) : null;
        return !createdDate || createdDate < twoHoursAgo;
      }) || [];

      if (orphanedFiles.length > 0) {
        await supabaseAdmin.storage.from("product-media").remove(orphanedFiles.map(f => f.name));
      }
    };

    // Trigger cleanup silently in the background
    cleanupOrphaned().catch(err => console.error("Storage cleanup failed:", err));

    return {
      totalBytes,
      count,
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