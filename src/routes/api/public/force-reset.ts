import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

export const Route = createFileRoute('/api/public/force-reset')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const email = "ammarhassan1888@gmail.com";
          const newPassword = "#Cricket";

          const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          if (listError) throw listError;

          const user = data.users.find(u => u.email === email);
          if (!user) throw new Error("User not found");

          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
          );

          if (updateError) {
             // Try fallback if #Cricket is weak
             const { error: fallbackError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { password: "#Cricket123!Hassan" }
             );
             if (fallbackError) throw fallbackError;
             return new Response("Reset to #Cricket123!Hassan (Backend rejected #Cricket as too weak)");
          }

          return new Response("Reset to #Cricket successfully");
        } catch (err: any) {
          return new Response("Error: " + err.message, { status: 500 });
        }
      }
    }
  }
})
