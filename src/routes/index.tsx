import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn, Play, Image as ImageIcon, ExternalLink, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
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

function Index() {
  const navigate = useNavigate();

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

  const handleSendToEditor = (productName: string) => {
    const phoneNumber = "03021937758";
    const message = encodeURIComponent(productName);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

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
                {categoryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative flex flex-col rounded-2xl border border-border/50 bg-card/50 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="aspect-[16/9] relative w-full overflow-hidden bg-muted">
                      {product.media_type === "video" ? (
                        <VideoPreview mediaUrl={product.media_url} />
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="h-full w-full cursor-zoom-in relative group/image">
                              <img
                                src={product.media_url}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-white drop-shadow-lg" />
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none">
                            <img 
                              src={product.media_url} 
                              alt={product.name} 
                              className="h-full w-full object-contain rounded-lg"
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <div className="absolute top-4 right-4 z-10">
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="secondary" size="icon" className="rounded-xl h-12 w-12 hover:bg-primary hover:text-white transition-colors">
                                <Play className="h-5 w-5 fill-current" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl bg-black border-white/10 p-0 overflow-hidden">
                              <DialogHeader className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
                                <DialogTitle className="text-white font-bold">{product.name}</DialogTitle>
                              </DialogHeader>
                              <video
                                src={product.media_url}
                                className="w-full aspect-video bg-black"
                                controls
                                autoPlay
                                playsInline
                                preload="auto"
                              />
                            </DialogContent>
                          </Dialog>
                        ) : null}
                      </div>

                      <Button
                        className="w-full mt-6 h-12 bg-primary hover:bg-primary/80 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 flex items-center justify-center gap-2"
                        onClick={() => handleSendToEditor(product.name)}
                      >
                        Send to Editor
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
          <div className="flex gap-6">
            <Button variant="ghost" size="sm" className="text-xs uppercase tracking-widest font-bold" asChild>
              <a href="https://wa.me/03021937758" target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}