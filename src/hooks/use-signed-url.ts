import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSignedUrl } from "@/lib/media.functions";

// Simple in-memory cache for signed URLs
const urlCache: Record<string, { url: string; expires: number }> = {};
const CACHE_DURATION = 110 * 60 * 1000; // 110 minutes (signed URLs last 2 hours)

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
      setIsLoading(false);
      return;
    }

    // Check if path is already a valid signed URL or public URL that shouldn't be signed
    // We only want to sign if it doesn't look like a signed URL already
    const isAlreadySigned = path.includes('/sign/') || 
                            path.includes('token=') || 
                            (path.startsWith('http') && path.includes('.supabase.co/storage/v1/object/'));
    
    // But even if it looks signed, we might want to re-sign if it's nearing expiration
    // For now, if it's already a full URL, we'll try to use it directly first
    // If it fails, the error handler in VideoPlayer/Image should ideally trigger a retry
    if (isAlreadySigned && path.startsWith('http')) {
      setUrl(path);
      setIsLoading(false);
      return;
    }

    // Check cache
    const cached = urlCache[path];
    if (cached && cached.expires > Date.now()) {
      setUrl(cached.url);
      setIsLoading(false);
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
          setUrl(signedUrl);
        } else {
          // If signing fails but we have a path, maybe it's a public URL?
          // We'll set it as is as a fallback
          setUrl(path);
        }
      })
      .catch((err) => {
        console.error("[useSignedUrl] Signing failed:", err);
        if (active) setUrl(path); // Fallback to raw path
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
