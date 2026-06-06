import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Shield, Lock, ExternalLink } from "lucide-react";

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-4 py-8 relative">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.93 0.01 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.93 0.01 250) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div /> {/* Spacer */}

      <div className="relative w-full max-w-sm z-10">
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
      </div>

      {/* Footer in teduza.com style */}
      <footer className="w-full max-w-4xl mt-12 z-10">
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground/60">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-semibold text-foreground/80">TEDUZA</span>
              <span className="opacity-30">|</span>
              <span>MARSNet Secure Communication</span>
            </div>
            <p>Protected by end-to-end encryption and private infrastructure.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="https://teduza.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              teduza.com <ExternalLink className="w-3 h-3" />
            </a>
            <div className="flex flex-col items-end">
              <span>© {new Date().getFullYear()} TEDUZA Group</span>
              <span>All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
