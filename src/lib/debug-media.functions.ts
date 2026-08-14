import { createServerFn } from "@tanstack/react-start";
import { getSignedUrl } from "@/lib/media.functions";

export const getSignedUrlWrapper = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    if (typeof data !== 'object' || data === null || !('path' in data) || typeof (data as any).path !== 'string') {
      throw new Error("Invalid input");
    }
    return data as { path: string };
  })
  .handler(async ({ data }) => {
    try {
      return await getSignedUrl({ data });
    } catch (error) {
      console.error("Signed URL Error:", error);
      return null;
    }
  });
