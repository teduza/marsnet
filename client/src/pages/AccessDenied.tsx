import { ShieldX } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Your account has not been approved or has been deactivated. Please contact your system administrator to request access.
        </p>
        <a
          href={getLoginUrl()}
          className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-accent text-secondary-foreground font-medium py-2.5 px-6 rounded-lg transition-all duration-150 btn-press text-sm"
        >
          Try a different account
        </a>
      </div>
    </div>
  );
}
