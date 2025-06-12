import { cn } from "../lib/utils";
export default function SettingsCard({
  title,
  icon,
  children,
  className,
}) {
  return (
    <div className={cn("bg-card border rounded-lg p-6 space-y-4", className)}>
      <div className="flex items-center space-x-3 pb-2 border-b">
        <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      {children}
    </div>
  );
}
