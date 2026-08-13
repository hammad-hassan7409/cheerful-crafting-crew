import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OWNER_EMAIL = "ammarhassan1888@gmail.com";

// Placeholder for remaining admin-related server functions if needed,
// but for now we are removing the "create new admin" functionality as requested.
// We keep the file to avoid breaking imports that might expect it, 
// but we will remove the unused exports.

export const listAdminUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    // Only return the main owner for now as other admins are being removed from UI
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
