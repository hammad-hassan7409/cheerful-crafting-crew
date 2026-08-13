import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OWNER_EMAIL = "ammarhassan1888@gmail.com";

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

    if (authError || authData.user?.email !== OWNER_EMAIL) {
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
    const { error: roleError } = await (supabaseAdmin
      .from("user_roles" as any) as any)
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

export const deleteAdminUser = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        userIdToDelete: z.string().uuid(),
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

    if (authError || authData.user?.email !== OWNER_EMAIL) {
      throw new Error("Invalid owner credentials. Only the main owner can delete admins.");
    }

    // 2. Check if the user to delete is the owner themselves (prevent self-deletion)
    const { data: userToDelete, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(data.userIdToDelete);
    if (getUserError || !userToDelete.user) {
      throw new Error("Admin user not found.");
    }

    if (userToDelete.user.email === OWNER_EMAIL) {
      throw new Error("The main owner account cannot be deleted.");
    }

    // 3. Delete the user (cascades to user_roles due to DB schema)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.userIdToDelete);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return { success: true };
  });

export const listAdminUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    // We need to join auth.users with user_roles, but auth.users is not directly accessible via standard API.
    // However, since we are in a server function, we can use supabaseAdmin to fetch from user_roles 
    // and then potentially fetch user details if we had a way, but standard practice is to use a view or function.
    
    // For simplicity and since we are using service_role, we can fetch all from user_roles
    // and then use the admin API to get details for each user_id.
    
    const { data: roles, error: rolesError } = await (supabaseAdmin
      .from("user_roles" as any) as any)
      .select("user_id, role")
      .eq("role", "admin");

    if (rolesError) {
      throw new Error("Failed to fetch admin roles.");
    }

    const adminUsers = [];
    for (const role of roles) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(role.user_id);
      if (!userError && userData.user) {
        adminUsers.push({
          id: userData.user.id,
          email: userData.user.email,
        });
      }
    }

    return adminUsers;
  });
