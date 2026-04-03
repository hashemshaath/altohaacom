import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { userId } = await authenticateRequest(req);
    const adminClient = getServiceClient();

    const { action, ...params } = await req.json();

    // Self-service: delete own account (no admin check needed)
    if (action === "delete_own_account") {
      if (params.confirmation !== "DELETE") {
        return jsonResponse({ error: "Invalid confirmation" }, 400);
      }
      await adminClient.from("profiles").delete().eq("user_id", userId);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;
      return jsonResponse({ success: true });
    }

    // Admin actions require supervisor role
    const { data: adminRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "supervisor");

    if (!adminRoles || adminRoles.length === 0) {
      throw new Error("Forbidden");
    }

    switch (action) {
      case "list_users": {
        const { page = 1, per_page = 20 } = params;
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: per_page });
        if (error) throw error;
        return jsonResponse({ users: data.users, total: (data as any).total || data.users.length });
      }

      case "update_user": {
        const { user_id, updates } = params;
        if (!user_id) throw new Error("user_id required");
        const { data, error } = await adminClient.auth.admin.updateUserById(user_id, updates);
        if (error) throw error;
        return jsonResponse({ user: data.user });
      }

      case "delete_user": {
        const { user_id } = params;
        if (!user_id) throw new Error("user_id required");
        const { data: protectedProfile } = await adminClient
          .from("profiles").select("username").eq("user_id", user_id).single();
        if (protectedProfile?.username === "hshaath") {
          throw new Error("Forbidden");
        }
        const { error } = await adminClient.auth.admin.deleteUser(user_id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      case "ban_user":
      case "unban_user": {
        const { user_id } = params;
        if (!user_id) throw new Error("user_id required");
        const banDuration = action === "ban_user" ? "876000h" : "none";
        const { error } = await adminClient.auth.admin.updateUserById(user_id, { ban_duration: banDuration });
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      case "invite_user": {
        const { email } = params;
        if (!email) throw new Error("email required");
        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email);
        if (error) throw error;
        return jsonResponse({ user: data.user });
      }

      case "get_user": {
        const { user_id } = params;
        if (!user_id) throw new Error("user_id required");
        const { data, error } = await adminClient.auth.admin.getUserById(user_id);
        if (error) throw error;
        return jsonResponse({ user: data.user });
      }

      case "reset_password": {
        const { user_id, new_password } = params;
        if (!user_id || !new_password) throw new Error("user_id and new_password required");
        const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password });
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("Admin user management error:", err);
    return errorResponse(err);
  }
});
