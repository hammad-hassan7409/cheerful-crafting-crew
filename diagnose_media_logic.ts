import { supabase } from "./src/integrations/supabase/client";

async function checkStorage() {
  console.log("Checking storage buckets...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error("Error listing buckets:", bucketsError);
  } else {
    console.log("Buckets found:", buckets.map(b => b.name));
  }

  const { data: products, error: productsError } = await supabase.from("products").select("name, media_url, media_type");
  if (productsError) {
    console.error("Error fetching products:", productsError);
  } else {
    console.log("Products in DB:", products);
  }
}

// Since I can't run this TS directly easily without a complex setup in this turn,
// I'll use the browser tool to inspect the LIVE runtime state.
