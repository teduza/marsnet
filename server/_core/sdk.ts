import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";
import * as cookie from "cookie";
import { COOKIE_NAME } from "@shared/const";

let supabase: any = null;
if (ENV.supabaseUrl && ENV.supabaseServiceRoleKey) {
  try {
    supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey);
  } catch (err) {
    console.warn("[Supabase] Failed to initialize client:", err.message);
  }
}

export const sdk = {
  async authenticateRequest(req: { headers: { cookie?: string } }) {
    try {
      const cookies = cookie.parse(req.headers.cookie || "");
      const token = cookies[COOKIE_NAME];

      if (!token) return null;

      // Special case for dev/test mode
      if (token === "mock-session-id") {
        return {
          id: 1,
          email: "admin@marsnet.internal",
          name: "Administrator",
          role: "admin",
          isActive: true,
          openId: "admin",
        };
      }

      if (!supabase) return null;

      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) return null;

      // Fetch additional user data from our users table
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) return null;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        isActive: profile.is_active,
        openId: profile.open_id || user.id,
      };
    } catch (err) {
      console.error("Authentication error:", err);
      return null;
    }
  }
};
