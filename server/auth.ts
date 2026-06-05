import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcrypt";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function registerUser(email: string, password: string, name: string) {
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) throw new Error(`Auth error: ${authError.message}`);

  // Create user profile in database
  const { error: dbError } = await supabase.from("users").insert({
    id: authData.user.id,
    email,
    name,
    password_hash: hashedPassword,
    is_active: false, // Admin must approve
    created_at: new Date().toISOString(),
  });

  if (dbError) throw new Error(`DB error: ${dbError.message}`);

  return authData.user;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(`Login failed: ${error.message}`);

  // Check if user is active
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!user?.is_active) {
    throw new Error("User account is not active. Contact administrator.");
  }

  return data;
}

export async function logoutUser(sessionId: string) {
  const { error } = await supabase.auth.admin.deleteSession(sessionId);
  if (error) throw new Error(`Logout failed: ${error.message}`);
}
