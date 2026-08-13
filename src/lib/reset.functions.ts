import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const forceResetPassword = createServerFn({ method: "POST" })
  .handler(async () => {
    const email = "ammarhassan1888@gmail.com";
    const newPassword = "#Cricket";

    console.log(`Force resetting password for ${email}...`);

    // 1. Get user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
      throw new Error("Failed to list users");
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error("User not found");
      throw new Error("User not found");
    }

    // 2. Update password
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Update password error:", updateError);
      throw updateError;
    }

    console.log("Password reset successful");
    return { success: true, message: "Password reset to #Cricket successfully" };
  });
