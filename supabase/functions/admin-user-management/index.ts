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

    // Verify admin caller
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

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
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

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create_user": {
        const { email, password, full_name, username, role, phone } = body;
        if (!email || !password || !full_name) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name, username: username || undefined },
          phone: phone || undefined,
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Assign role if provided
        if (role && newUser?.user) {
          await adminClient.from("user_roles").insert({
            user_id: newUser.user.id,
            role,
          });
        }

        // Log admin action
        await adminClient.from("admin_actions").insert({
          admin_id: caller.id,
          target_user_id: newUser?.user?.id,
          action_type: "create_user",
          details: { email, full_name, role },
        });

        return new Response(JSON.stringify({ success: true, user_id: newUser?.user?.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_password": {
        const { user_id, new_password } = body;
        if (!user_id || !new_password) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: resetError } = await adminClient.auth.admin.updateUserById(user_id, {
          password: new_password,
        });

        if (resetError) {
          return new Response(JSON.stringify({ error: resetError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient.from("admin_actions").insert({
          admin_id: caller.id,
          target_user_id: user_id,
          action_type: "reset_password",
          details: {},
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_invitation": {
        const { email: inviteEmail } = body;
        if (!inviteEmail) {
          return new Response(JSON.stringify({ error: "Missing email" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(inviteEmail);

        if (inviteError) {
          return new Response(JSON.stringify({ error: inviteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient.from("admin_actions").insert({
          admin_id: caller.id,
          action_type: "send_invitation",
          details: { email: inviteEmail },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        const { user_id: deleteUserId } = body;
        if (!deleteUserId) {
          return new Response(JSON.stringify({ error: "Missing user_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Prevent self-deletion
        if (deleteUserId === caller.id) {
          return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(deleteUserId);

        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient.from("admin_actions").insert({
          admin_id: caller.id,
          target_user_id: deleteUserId,
          action_type: "delete_user",
          details: {},
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
