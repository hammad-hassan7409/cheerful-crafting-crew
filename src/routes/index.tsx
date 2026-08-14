import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn, Play, Image as ImageIcon, ExternalLink, ChevronRight, Loader2, ShieldAlert, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { getSignedUrl } from "@/lib/media.functions";
import { useServerFn } from "@tanstack/react-start";


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

function ProtectedMedia({ children, type = "video" }: { children: ReactNode; type?: "video" | "image" }) {
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toast.error("Downloads are disabled to protect AR EDITZ samples.", {
      icon: <ShieldAlert className="h-4 w-4" />,
    });
  }, []);

  return (
    <div 
      className="relative h-full w-full select-none"
      onContextMenu={handleContextMenu}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Invisible guard overlay for images to prevent "Save as" dragging */}
      {type === "image" && <div className="absolute inset-0 z-10 bg-transparent" />}
      
      {children}
    </div>
  );
}

function VideoPreview({ mediaUrl }: { mediaUrl: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const fetchSignedUrl = useServerFn(getSignedUrl);

  useEffect(() => {
    let active = true;
    fetchSignedUrl({ data: { path: mediaUrl } }).then(url => {
      if (active) setSignedUrl(url);
    });
    return () => { active = false; };
  }, [mediaUrl, fetchSignedUrl]);


  return (
    <ProtectedMedia type="video">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10 transition-opacity duration-300">
          <div className="flex flex-col items-center gap-3 w-3/4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Initializing</span>
            <Progress value={progress} className="h-1 bg-white/10" />
          </div>
        </div>
      )}
      {signedUrl && (
        <video
          src={signedUrl}
          className={`h-full w-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          muted
          playsInline
          loop
          preload="metadata"
          controlsList="nodownload"
          onProgress={(e) => {
            const video = e.currentTarget;
            if (video.buffered.length > 0) {
              const buffered = video.buffered.end(video.buffered.length - 1);
              const duration = video.duration;
              if (duration > 0) {
                setProgress((buffered / duration) * 100);
              }
            }
          }}
          onLoadedData={() => {
            setIsLoading(false);
            setProgress(100);
          }}
          onMouseEnter={(e) => !isLoading && e.currentTarget.play()}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }
          }}
        />
      )}
      {!isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="h-14 w-14 rounded-full bg-primary/90 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-xl">
            <Play className="fill-current h-6 w-6 ml-1" />
          </div>
        </div>
      )}
    </ProtectedMedia>
  );
}

function VideoDialog({ mediaUrl, productName }: { mediaUrl: string; productName: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const fetchSignedUrl = useServerFn(getSignedUrl);

  useEffect(() => {
    let active = true;
    fetchSignedUrl({ data: { path: mediaUrl } }).then(url => {
      if (active) setSignedUrl(url);
    });
    return () => { active = false; };
  }, [mediaUrl, fetchSignedUrl]);


  return (
    <Dialog onOpenChange={(open) => {
      if (!open) {
        setIsLoading(true);
        setProgress(0);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-xl h-12 w-12 hover:bg-primary hover:text-white transition-colors">
          <Play className="h-5 w-5 fill-current" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-black border-white/10 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{productName}</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <ProtectedMedia type="video">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4 w-1/2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-xs font-bold uppercase tracking-tighter text-white/60">Buffering Preview</span>
                  <Progress value={progress} className="h-1 bg-white/10" />
                </div>
              </div>
            )}
            {signedUrl && (
              <video
                src={signedUrl}
                className={`w-full aspect-video bg-black transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                controls
                autoPlay
                playsInline
                preload="auto"
                controlsList="nodownload"
                onProgress={(e) => {
                  const video = e.currentTarget;
                  if (video.buffered.length > 0) {
                    const buffered = video.buffered.end(video.buffered.length - 1);
                    const duration = video.duration;
                    if (duration > 0) {
                      setProgress((buffered / duration) * 100);
                    }
                  }
                }}
                onLoadedData={() => {
                  setIsLoading(false);
                  setProgress(100);
                }}
              />
            )}
          </ProtectedMedia>
        </div>
      </DialogContent>
    </Dialog>
  );
}



function Index() {
  const navigate = useNavigate();

  // Capture deterrence
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // This is a common trigger point for screenshot tools on some OSs 
        // or just general deterrence when leaving the tab.
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Deter common shortcut for screenshots/save (though we can't stop OS level)
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

      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="mb-20 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
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

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {categoryProducts.map((product: any) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    whatsappNumber={settings?.["whatsapp_number"]}
                  />
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
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const fetchSignedUrl = useServerFn(getSignedUrl);

  useEffect(() => {
    let active = true;
    fetchSignedUrl({ data: { path: product.media_url } }).then(url => {
      if (active) setSignedUrl(url);
    });
    return () => { active = false; };
  }, [product.media_url, fetchSignedUrl]);

  const handleSendToEditor = useCallback((productName: string) => {
    const phoneNumber = whatsappNumber || "923021937758";
    const message = encodeURIComponent(`Hi, I am interested in "${productName}". Can you provide more details?`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  }, [whatsappNumber]);

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-border/50 bg-card/50 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden"
    >
      <div className="aspect-[16/9] relative w-full overflow-hidden bg-muted">
        {product.media_type === "video" ? (
          <VideoPreview mediaUrl={product.media_url} />
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <button className="h-full w-full cursor-zoom-in relative group/image">
                <ProtectedMedia type="image">
                  {signedUrl && (
                    <img
                      src={signedUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                </ProtectedMedia>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <ImageIcon className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none">
              <ProtectedMedia type="image">
                {signedUrl && (
                  <img 
                    src={signedUrl} 
                    alt={product.name} 
                    className="h-full w-full object-contain rounded-lg"
                  />
                )}
              </ProtectedMedia>
            </DialogContent>
          </Dialog>
        )}
        
        <div className="absolute top-4 right-4 z-20">
          <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest border border-white/10">
            {product.media_type === "video" ? "Video Edit" : "Design"}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Project Sample</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-primary">RS. {product.discounted_price}</span>
            <span className="text-sm text-muted-foreground line-through opacity-60 italic">
              RS. {product.original_price}
            </span>
          </div>
          
          {product.media_type === "video" ? (
            <VideoDialog mediaUrl={product.media_url} productName={product.name} />
          ) : null}
        </div>

        <Button
          className="w-full mt-6 h-12 bg-primary hover:bg-primary/80 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 flex items-center justify-center gap-2"
          onClick={() => handleSendToEditor(product.name)}
        >
          Send to Editor
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
