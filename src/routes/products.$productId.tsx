import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, ShieldAlert, ArrowLeft, Play, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { getSignedUrl } from "@/lib/media.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/products/$productId")({
  component: ProductDetailPage,
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
      {type === "image" && <div className="absolute inset-0 z-10 bg-transparent" />}
      {children}
    </div>
  );
}

function ProductDetailPage() {
  const { productId } = useParams({ from: "/products/$productId" });
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const fetchSignedUrl = useServerFn(getSignedUrl);

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

  useEffect(() => {
    let active = true;
    if (product?.media_url) {
      fetchSignedUrl({ data: { path: product.media_url } }).then(url => {
        if (active) setSignedUrl(url);
      });
    }
    return () => { active = false; };
  }, [product?.media_url, fetchSignedUrl]);

  const handleSendToEditor = useCallback(() => {
    if (!product) return;
    const phoneNumber = settings?.["whatsapp_number"] || "923021937758";
    // Only product name as per requirement
    const message = encodeURIComponent(product.name);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  }, [product, settings]);

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
            <div className="aspect-video bg-muted rounded-3xl overflow-hidden border border-border/40 relative shadow-2xl">
              <ProtectedMedia type={product.media_type as "video" | "image"}>
                {signedUrl ? (
                  product.media_type === "video" ? (
                    <video
                      src={signedUrl}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      muted
                      playsInline
                      controlsList="nodownload"
                    />
                  ) : (
                    <img
                      src={signedUrl}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  </div>
                )}
              </ProtectedMedia>
            </div>
            
            <div className="flex items-center gap-2 px-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                {product.media_type === "video" ? "Video Production" : "Graphic Design"}
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
                <ImageIcon className="h-4 w-4 text-primary" />
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
