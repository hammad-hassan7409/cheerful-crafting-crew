import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const forceResetPassword = createServerFn({ method: "POST" })
  .handler(async () => {
    const email = "ammarhassan1888@gmail.com";
    const targetPassword = "#Cricket";
    const secureFallback = "#Cricket123!Hassan";

    console.log(`Force resetting password for ${email}...`);

    const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError || !data.users) {
      throw new Error("Failed to list users");
    }

    const user = data.users.find(u => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }

    // Try setting it to #Cricket first
    const { error: primaryError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: targetPassword }
    );

    if (!primaryError) {
      console.log("Password successfully reset to #Cricket");
      return { success: true, message: "Password reset to #Cricket successfully", password: targetPassword };
    }

    console.warn("Target password #Cricket rejected, using secure fallback...");
    
    // Fallback to the secure one if #Cricket is blocked by the provider's policy
    const { error: fallbackError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: secureFallback }
    );

    if (fallbackError) {
      throw fallbackError;
    }

    return { 
      success: true, 
      message: "Backend blocked #Cricket (too weak). Reset to #Cricket123!Hassan instead.",
      password: secureFallback 
    };
  });
