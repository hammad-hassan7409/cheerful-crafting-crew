import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSignedUrl } from "@/lib/media.functions";

// Simple in-memory cache for signed URLs
const urlCache: Record<string, { url: string; expires: number }> = {};
const CACHE_DURATION = 50 * 60 * 1000; // 50 minutes (signed URLs last 1 hour)

/**
 * Hook to get a signed URL for a private media file with client-side caching
 * to prevent redundant server function calls.
 */
export function useSignedUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchSignedUrl = useServerFn(getSignedUrl);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }

    // If it's already a public URL that seems to work, just use it
    if (path.includes('/storage/v1/object/public/')) {
      setUrl(path);
      return;
    }

    // Check cache
    const cached = urlCache[path];
    if (cached && cached.expires > Date.now()) {
      setUrl(cached.url);
      return;
    }

    let active = true;
    setIsLoading(true);

    fetchSignedUrl({ data: { path } })
      .then((signedUrl: string | null) => {
        if (!active) return;
        
        if (signedUrl) {
          urlCache[path] = {
            url: signedUrl,
            expires: Date.now() + CACHE_DURATION,
          };
        }
        
        setUrl(signedUrl);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, fetchSignedUrl]);

  return { url, isLoading };
}
