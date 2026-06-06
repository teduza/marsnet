import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Shield, Lock } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const devLogin = trpc.auth.devLogin.useMutation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  const handleDevLogin = async () => {
    try {
      await devLogin.mutateAsync();
      await refresh();
      setLocation("/");
    } catch (err) {
      console.error("Dev login failed:", err);
    }
  };

  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.93 0.01 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.93 0.01 250) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">MARSNet</h1>
          <p className="text-sm text-muted-foreground mt-1">Corporate Secure Messenger</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Access is restricted to approved employees only.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {loginUrl !== "#" && (
              <a
                href={loginUrl}
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-all duration-150 btn-press"
              >
                Sign in with Manus
              </a>
            )}

            <button
              onClick={handleDevLogin}
              disabled={devLogin.isPending}
              className="flex items-center justify-center gap-2 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2.5 px-4 rounded-lg transition-all duration-150 btn-press"
            >
              {devLogin.isPending ? "Connecting..." : "Test Mode Access"}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            No public registration. Contact your administrator to request access.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          © {new Date().getFullYear()} MARSNet — Internal Use Only
        </p>
      </div>
    </div>
  );
}
