import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  className?: string;
};

function getInitials(name?: string | null, displayName?: string | null): string {
  const n = displayName || name || "?";
  const parts = n.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

function getAvatarColor(name?: string | null): string {
  const colors = [
    "bg-blue-600",
    "bg-violet-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
    "bg-indigo-600",
    "bg-teal-600",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const dotSizeMap = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

export default function UserAvatar({
  name,
  displayName,
  avatarUrl,
  isOnline,
  size = "md",
  showStatus = false,
  className,
}: Props) {
  const initials = getInitials(name, displayName);
  const colorClass = getAvatarColor(name || displayName);

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-medium text-white overflow-hidden",
          sizeMap[size],
          !avatarUrl && colorClass
        )}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name ?? ""} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            dotSizeMap[size],
            isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
          )}
        />
      )}
    </div>
  );
}
