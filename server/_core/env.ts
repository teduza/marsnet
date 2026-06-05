import "dotenv/config";

export const ENV = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  jwtSecret: process.env.JWT_SECRET || "marsnet-default-secret-key",
  ownerOpenId: process.env.OWNER_OPEN_ID || "admin",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || "",
};

if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
  console.warn("Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing in environment variables.");
}
