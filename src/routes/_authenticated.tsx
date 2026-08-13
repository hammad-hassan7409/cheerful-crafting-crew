import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ navigate }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw navigate({
        to: "/login",
        search: {
          redirect: window.location.pathname,
        },
      });
    }
  },
});
