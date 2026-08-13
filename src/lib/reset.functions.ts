import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const forceResetPassword = createServerFn({ method: "POST" })
  .handler(async () => {
    const email = "ammarhassan1888@gmail.com";
    const newPassword = "#Cricket";

    console.log(`Force resetting password for ${email}...`);

    // 1. Get user by email using listUsers and filtering manually
    const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
      throw new Error("Failed to list users: " + listError.message);
    }

    const user = data.users.find(u => u.email === email);
    
    if (!user) {
      console.error("User not found:", email);
      throw new Error("User not found");
    }

    // 2. Update password via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Update password error:", updateError);
      // Return a structured error so we can see if it's "weak_password"
      return { 
        success: false, 
        message: updateError.message,
        code: (updateError as any).code 
      };
    }

    console.log("Password reset successful");
    return { success: true, message: "Password reset to #Cricket successfully" };
  });
