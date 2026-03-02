import * as LucideIcons from "lucide-react";

export function DynamicIcon({ name, className }: Readonly<{ name: string; className?: string }>) {
  if (name.startsWith("/") || name.startsWith("http://") || name.startsWith("https://")) {
    return <img src={name} alt="" className={className} style={{ objectFit: "contain" }} />;
  }
  const Icon = (LucideIcons as any)[name] || LucideIcons.Globe;
  return <Icon className={className} />;
}
