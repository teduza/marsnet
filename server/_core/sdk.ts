import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";
import * as cookie from "cookie";
import { COOKIE_NAME } from "@shared/const";

const supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey);

export const sdk = {
  async authenticateRequest(req: { headers: { cookie?: string } }) {
    try {
      const cookies = cookie.parse(req.headers.cookie || "");
      const token = cookies[COOKIE_NAME];

      if (!token) return null;

      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) return null;

      // Fetch additional user data from our users table
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id) // This assumes the id in our table matches Supabase auth id
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
