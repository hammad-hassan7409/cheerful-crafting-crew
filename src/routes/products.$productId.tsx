import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPublicSettings } from "@/lib/public-settings.functions";

import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  MessageSquare, 
  ShieldAlert, 
  ArrowLeft, 
  Image as ImageIcon,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { useSignedUrl } from "@/hooks/use-signed-url";

export const Route = createFileRoute("/products/$productId")({
  component: ProductDetailPage,
});

function ProtectedMedia({ 
  children, 
  scale = 1,
  onScaleChange,
  isZoomEnabled = false
}: { 
  children: ReactNode; 
  scale?: number;
  onScaleChange?: (scale: number) => void;
  isZoomEnabled?: boolean;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [internalRef, setInternalRef] = useState<HTMLDivElement | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toast.error("Downloads are disabled to protect AR EDITZ samples.", {
      icon: <ShieldAlert className="h-4 w-4" />,
    });
  }, []);

  // Pinch to zoom logic
  useEffect(() => {
    if (!internalRef || !isZoomEnabled) return;

    let initialDist = 0;
    let initialScale = scale;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2 && e.touches[0] && e.touches[1]) {
        initialDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        initialScale = scale;
      } else if (e.touches.length === 1 && scale > 1 && e.touches[0]) {
        setIsDragging(true);
        setStartPos({
          x: e.touches[0].pageX - offset.x,
          y: e.touches[0].pageY - offset.y
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist > 0 && e.touches[0] && e.touches[1]) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const newScale = Math.min(Math.max(1, (dist / initialDist) * initialScale), 3);
        onScaleChange?.(newScale);
      } else if (e.touches.length === 1 && isDragging && scale > 1 && e.touches[0]) {
        e.preventDefault();
        const newX = e.touches[0].pageX - startPos.x;
        const newY = e.touches[0].pageY - startPos.y;
        
        // Bounds checking
        const limitX = (scale - 1) * (internalRef.clientWidth / 2);
        const limitY = (scale - 1) * (internalRef.clientHeight / 2);
        
        setOffset({
          x: Math.min(Math.max(newX, -limitX), limitX),
          y: Math.min(Math.max(newY, -limitY), limitY)
        });
      }
    };

    const handleTouchEnd = () => {
      initialDist = 0;
      setIsDragging(false);
    };

    internalRef.addEventListener("touchstart", handleTouchStart, { passive: false });
    internalRef.addEventListener("touchmove", handleTouchMove, { passive: false });
    internalRef.addEventListener("touchend", handleTouchEnd);

    return () => {
      internalRef.removeEventListener("touchstart", handleTouchStart);
      internalRef.removeEventListener("touchmove", handleTouchMove);
      internalRef.removeEventListener("touchend", handleTouchEnd);
    };
  }, [internalRef, scale, onScaleChange, isZoomEnabled, isDragging, startPos, offset]);

  // Reset offset when scale returns to 1
  useEffect(() => {
    if (scale === 1) {
      setOffset({ x: 0, y: 0 });
    }
  }, [scale]);

  return (
    <div 
      ref={setInternalRef}
      className="relative h-full w-full select-none overflow-hidden touch-none"
      onContextMenu={handleContextMenu}
      onDragStart={(e) => e.preventDefault()}
    >
      <div 
        className="w-full h-full transition-transform duration-200 ease-out flex items-center justify-center"
        style={{ 
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
}


function ProductDetailPage() {
  const { productId } = useParams({ from: "/products/$productId" });
  const [zoom, setZoom] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const fetchPublicSettings = useServerFn(getPublicSettings);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchPublicSettings(),
  });


  const { url: signedUrl, isLoading: signedUrlLoading } = useSignedUrl(product?.media_url);

  const handleSendToEditor = useCallback(() => {
    if (!product) return;
    const phoneNumber = settings?.["whatsapp_number"] || "923021937758";
    // Only product name as per requirement
    const message = encodeURIComponent(product.name);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  }, [product, settings]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 1));
  const handleResetZoom = () => setZoom(1);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Button asChild>
          <Link to="/">Go Back Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <span className="text-xl font-black text-white italic">AR</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              EDITZ
            </span>
          </Link>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gallery
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Media Section */}
          <div className="space-y-4">
            <div className="w-full bg-muted rounded-3xl overflow-hidden border border-border/40 relative shadow-2xl group/media min-h-[300px] flex items-center justify-center">
              <ProtectedMedia 
                scale={zoom}
                onScaleChange={setZoom}
                isZoomEnabled={product.media_type === "image"}
              >
                {signedUrl ? (
                  product.media_type === "video" ? (
                    <VideoPlayer 
                      src={signedUrl} 
                      className="w-full" 
                    />
                  ) : (
                    <img
                      src={signedUrl}
                      alt={product.name}
                      className="max-w-full max-h-[70vh] w-auto h-auto block object-contain"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 w-full gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                      Preparing Stream...
                    </p>
                  </div>
                )}
              </ProtectedMedia>


              {/* Zoom Controls */}
              {signedUrl && product.media_type === "image" && (

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    className="h-10 w-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                  <div className="w-12 text-center text-[10px] font-bold text-white uppercase tracking-widest">
                    {Math.round(zoom * 100)}%
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="h-10 w-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                  <div className="w-[1px] h-6 bg-white/10 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetZoom}
                    disabled={zoom === 1}
                    className="h-10 w-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 px-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                {product.media_type === "video" ? "Video Editing" : "Graphic Design"}
              </span>

              <span className="px-3 py-1 rounded-full bg-white/5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest border border-white/10">
                Premium Sample
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              {product.name}
            </h1>
            
            <div className="flex flex-col mb-8">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-black text-primary">RS. {product.discounted_price}</span>
                <span className="text-lg text-muted-foreground line-through opacity-60 italic">
                  RS. {product.original_price}
                </span>
              </div>
              <p className="text-sm text-primary font-bold uppercase tracking-tighter italic">
                Special Offer Price
              </p>
            </div>

            <div className="bg-card/30 border border-border/40 rounded-3xl p-8 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                {product.media_type === "video" ? <Play className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                Description
              </h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">
                {product.description || "No description provided for this product."}
              </p>
            </div>

            <Button
              className="w-full h-16 text-lg bg-primary hover:bg-primary/80 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:shadow-primary/40 flex items-center justify-center gap-3 mt-auto"
              onClick={handleSendToEditor}
            >
              Contact for Inquiries (Send to Editor)
              <MessageSquare className="h-6 w-6" />
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-4 font-medium uppercase tracking-widest opacity-50">
              Trusted Editing Services by AR EDITZ
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
