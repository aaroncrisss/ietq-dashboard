import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "accent";
}

export function KPICard({ title, value, icon: Icon, trend, variant = "default" }: KPICardProps) {
  return (
    <Card className={`relative overflow-hidden border-0 shadow-glass backdrop-blur-glass ${
      variant === "accent" 
        ? "bg-gradient-accent text-accent-foreground" 
        : "bg-gradient-glass"
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${variant === "accent" ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
              {title}
            </p>
            <p className="text-3xl font-bold animate-count-up">
              {value}
            </p>
            {trend && (
              <p className={`text-xs ${variant === "accent" ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`rounded-xl p-3 ${
            variant === "accent" 
              ? "bg-accent-foreground/20" 
              : "bg-primary/10"
          }`}>
            <Icon className={`h-6 w-6 ${
              variant === "accent" 
                ? "text-accent-foreground" 
                : "text-primary"
            }`} />
          </div>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-full ${
        variant === "accent" 
          ? "bg-accent-foreground/30" 
          : "bg-gradient-primary"
      }`} />
    </Card>
  );
}
