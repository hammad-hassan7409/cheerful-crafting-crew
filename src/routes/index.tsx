import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn, Image as ImageIcon, ExternalLink, ChevronRight, Loader2, ShieldAlert, MessageSquare, ZoomIn, ZoomOut, RotateCcw, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useCallback, type ReactNode, memo } from "react";
import { toast } from "sonner";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    title: "AR EDITZ | Video & Poster Edits",
    meta: [
      { name: "description", content: "Professional video editing and poster design services by AR EDITZ." },
      { property: "og:title", content: "AR EDITZ" },
      { property: "og:description", content: "Professional video editing and poster design services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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




function ImageZoomDialog({ signedUrl, productName }: { signedUrl: string | null; productName: string }) {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <ProtectedMedia 
        scale={zoom} 
        onScaleChange={setZoom}
        isZoomEnabled={true}
      >

        {signedUrl && (
          <img 
            src={signedUrl} 
            alt={productName} 
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
          />
        )}
      </ProtectedMedia>
      
      {/* Zoom Controls for Desktop in Dialog */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(prev => Math.max(prev - 0.25, 1))}
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
          onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
          disabled={zoom >= 3}
          className="h-10 w-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(1)}
          disabled={zoom === 1}
          className="h-10 w-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function Index() {
  const navigate = useNavigate();

  // Capture deterrence
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Deterrence logic can go here
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        toast.warning("Printing and saving are disabled to protect AR EDITZ samples.", {
          icon: <ShieldAlert className="h-4 w-4" />,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      const settingsMap: Record<string, any> = {};
      data.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      return settingsMap;
    },
  });

  const handleSendToEditor = useCallback((productName: string) => {
    const phoneNumber = settings?.["whatsapp_number"] || "923021937758";
    const message = encodeURIComponent(`Hi, I am interested in "${productName}". Can you provide more details?`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  }, [settings]);

  if (categoriesLoading || productsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section / Header */}
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
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => navigate({ to: "/login" })}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Owner Access
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20">
        <div className="mb-12 md:mb-20 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 md:mb-6">
            Creative <span className="text-primary italic">Editing</span> Showcase
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A curated portfolio of professional video edits and poster designs. 
            Browse samples and contact the editor for your next project.
          </p>
        </div>

        {categories?.map((category) => {
          const categoryProducts = products?.filter((p) => p.category_id === category.id);
          if (!categoryProducts || categoryProducts.length === 0) return null;

          return (
            <section key={category.id} className="mb-24">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-1 w-12 bg-primary rounded-full" />
                <h2 className="text-3xl font-bold tracking-tight uppercase">
                  {category.name}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {categoryProducts.map((product: any) => (
                  <Link 
                    key={product.id} 
                    to="/products/$productId" 
                    params={{ productId: product.id }}
                    className="block outline-none"
                  >
                    <ProductCard 
                      product={product} 
                      whatsappNumber={settings?.["whatsapp_number"]}
                    />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {(!products || products.length === 0) && (
          <div className="flex h-[40vh] flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xl font-medium text-muted-foreground">Portfolio is being curated.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border/40 py-12 bg-card/30">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-black text-white italic">AR</span>
            </div>
            <span className="font-bold tracking-tight">EDITZ</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AR EDITZ. All creative rights reserved.
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" className="text-xs uppercase tracking-widest font-bold" asChild>
              <a href={`https://wa.me/${settings?.["whatsapp_number"] || "923021937758"}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs uppercase tracking-widest font-bold" asChild>
              <a href={settings?.["tiktok_url"] || "https://www.tiktok.com/@ammar.editz8"} target="_blank" rel="noreferrer">
                TikTok
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, whatsappNumber }: { product: any; whatsappNumber?: string }) {
  const { url: signedUrl } = useSignedUrl(product.media_url);

  const handleSendToEditor = useCallback((productName: string) => {
    const phoneNumber = whatsappNumber || "923021937758";
    const message = encodeURIComponent(`Hi, I am interested in "${productName}". Can you provide more details?`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  }, [whatsappNumber]);

  return (
    <div
      className="group relative flex flex-col rounded-xl border border-border/50 bg-card/50 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden h-full"
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-muted flex items-center justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <button className="h-full w-full cursor-zoom-in relative group/image flex items-center justify-center">
              <ProtectedMedia>
                {signedUrl && (
                  product.media_type === "video" ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-110"
                        muted
                        playsInline
                        preload="auto"
                        key={signedUrl}
                      >
                        <source src={signedUrl} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/80 flex items-center justify-center shadow-xl border border-white/20">
                          <Play className="h-4 w-4 md:h-5 md:w-5 text-white fill-current" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={signedUrl}
                      alt={product.name}
                      className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-110"
                    />
                  )
                )}

              </ProtectedMedia>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                {product.media_type === "video" ? (
                  <Play className="h-8 w-8 text-white drop-shadow-lg" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-white drop-shadow-lg" />
                )}
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/90 border-white/10 flex items-center justify-center">
            <ImageZoomDialog signedUrl={signedUrl} productName={product.name} />
          </DialogContent>
        </Dialog>
        
        <div className="absolute top-2 right-2 z-20">
          <span className="px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md text-[8px] font-bold uppercase tracking-widest border border-white/10">
            {product.media_type === "video" ? "Video" : "Design"}
          </span>
        </div>
      </div>

      <div className="p-3 md:p-4 flex flex-col flex-1">
        <div className="mb-2 md:mb-3">
          <h3 className="text-sm md:text-base font-bold mb-0.5 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Project Sample</p>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base md:text-lg font-black text-primary">RS. {product.discounted_price}</span>
            <span className="text-[10px] md:text-xs text-muted-foreground line-through opacity-60 italic">
              RS. {product.original_price}
            </span>
          </div>

          <Button
            className="w-full h-8 md:h-10 bg-primary hover:bg-primary/80 text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 flex items-center justify-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSendToEditor(product.name);
            }}
          >
            Send
            <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
