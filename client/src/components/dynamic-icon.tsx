import * as LucideIcons from "lucide-react";

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as any)[name] || LucideIcons.Globe;
  return <Icon className={className} />;
}
