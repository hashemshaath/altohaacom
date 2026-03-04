import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { action, ...params } = await req.json();

    // Self-service: delete own account (no admin check needed)
    if (action === "delete_own_account") {
      const { confirmation } = params;
      if (confirmation !== "DELETE") {
        return new Response(JSON.stringify({ error: "Invalid confirmation" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete user data first (profile, wallet, etc. will cascade or be cleaned)
      await adminClient.from("profiles").delete().eq("user_id", caller.id);

      // Delete auth user
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(caller.id);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin actions require supervisor role
    const { data: adminRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "supervisor");

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: list users
    if (action === "list_users") {
      const { page = 1, per_page = 20 } = params;
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: per_page });
      if (error) throw error;
      return new Response(JSON.stringify({ users: data.users, total: (data as any).total || data.users.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: update user
    if (action === "update_user") {
      const { user_id, updates } = params;
      if (!user_id) throw new Error("user_id required");
      const { data, error } = await adminClient.auth.admin.updateUserById(user_id, updates);
      if (error) throw error;
      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: delete user
    if (action === "delete_user") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id required");
      // Protect primary admin account
      const { data: protectedProfile } = await adminClient
        .from("profiles")
        .select("username")
        .eq("user_id", user_id)
        .single();
      if (protectedProfile?.username === "hshaath") {
        return new Response(JSON.stringify({ error: "Cannot delete primary admin account" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: ban/unban user
    if (action === "ban_user" || action === "unban_user") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id required");
      const banDuration = action === "ban_user" ? "876000h" : "none";
      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: banDuration,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: invite user
    if (action === "invite_user") {
      const { email } = params;
      if (!email) throw new Error("email required");
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email);
      if (error) throw error;
      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: get user by id
    if (action === "get_user") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id required");
      const { data, error } = await adminClient.auth.admin.getUserById(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: reset password
    if (action === "reset_password") {
      const { user_id, new_password } = params;
      if (!user_id || !new_password) throw new Error("user_id and new_password required");
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Admin user management error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
