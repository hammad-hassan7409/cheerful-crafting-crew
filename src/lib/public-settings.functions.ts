import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPublicSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("key, value");
    
    if (error) {
      console.error("Error fetching settings via admin:", error);
      return {};
    }

    const settingsMap: Record<string, any> = {};
    data.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  });
