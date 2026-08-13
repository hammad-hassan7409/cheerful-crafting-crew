import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const createAdminUser = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        ownerEmail: z.string(),
        ownerPassword: z.string(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    // 1. Verify owner credentials
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: data.ownerEmail,
      password: data.ownerPassword,
    });

    if (authError || authData.user?.email !== "ammarhassan1888@gmail.com") {
      throw new Error("Invalid owner credentials. Only the main owner can create admins.");
    }

    // 2. Create the new admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (createError) {
      throw new Error(createError.message);
    }

    if (!newUser.user) {
      throw new Error("Failed to create user.");
    }

    // 3. Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "admin",
      });

    if (roleError) {
      // Cleanup user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error("Failed to assign admin role: " + roleError.message);
    }

    return { success: true, userId: newUser.user.id };
  });
