import { createServerFn } from "@tanstack/react-start";

export const getStorageUsage = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: files, error } = await supabaseAdmin.storage
      .from("product-media")
      .list("", { limit: 1000 });

    if (error) {
      console.error("Error listing storage files:", error);
      return { totalBytes: 0, count: 0, formattedSize: "0 Bytes", remainingBytes: 0, remainingFormatted: "256 GB" };
    }

    const totalBytes = files?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0;
    const limitBytes = 1024 * 1024 * 1024 * 256; // 256GB
    const remainingBytes = Math.max(0, limitBytes - totalBytes);
    
    return {
      totalBytes,
      count: files?.length || 0,
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
