import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-primary">
            AR EDITZ
          </Link>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/login" })}>
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {categories?.map((category) => {
          const categoryProducts = products?.filter((p) => p.category_id === category.id);
          if (!categoryProducts || categoryProducts.length === 0) return null;

          return (
            <section key={category.id} className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-foreground underline decoration-primary decoration-4 underline-offset-8">
                {category.name}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      {product.media_type === "video" ? (
                        <video
                          src={product.media_url}
                          className="h-full w-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={product.media_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">{product.name}</h3>
                      <div className="mb-4">
                        <span className="text-xl font-bold text-primary">RS. {product.discounted_price}</span>
                        <div className="text-sm text-muted-foreground line-through">
                          RS. {product.original_price}
                        </div>
                      </div>
                      <Button
                        className="w-full bg-primary font-bold hover:bg-primary/90"
                        onClick={() => handleSendToEditor(product.name)}
                      >
                        Send to Editor
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {(!products || products.length === 0) && (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}