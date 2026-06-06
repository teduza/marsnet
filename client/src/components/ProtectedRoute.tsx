import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type Props = { children: React.ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      const loginUrl = getLoginUrl();
      if (loginUrl === "#") {
        // If OAuth is not configured, fallback to local login page
        if (location !== "/login") {
          setLocation("/login");
        }
      } else {
        window.location.href = loginUrl;
      }
      return;
    }
    
    if (user && !user.isActive) {
      setLocation("/access-denied");
    }
  }, [loading, isAuthenticated, user, setLocation, location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading MARSNet…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Return null while redirecting, or could return a simple message
    return null;
  }

  if (user && !user.isActive) {
    return null;
  }

  return <>{children}</>;
}
