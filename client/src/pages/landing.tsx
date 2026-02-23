import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutGrid, Users, Shield, Zap, ArrowRight, Rocket } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Launchpad</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/api/login">
              <Button data-testid="button-login">Sign In</Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-3.5 h-3.5" />
              Employee Productivity Hub
            </div>
            <h1 className="text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-[1.1]">
              Your apps,{" "}
              <span className="text-primary">one place.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              A personalised launchpad for your team. Access all your business applications, 
              tools, and resources from a single, beautiful dashboard.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/api/login">
                <Button size="lg" data-testid="button-get-started">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                SSO Enabled
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                Per-employee personalisation
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative rounded-xl border bg-card p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Email", color: "bg-blue-500", icon: "M" },
                  { name: "Calendar", color: "bg-green-500", icon: "C" },
                  { name: "Teams", color: "bg-purple-500", icon: "T" },
                  { name: "SharePoint", color: "bg-teal-500", icon: "S" },
                  { name: "Power BI", color: "bg-yellow-500", icon: "P" },
                  { name: "Finance", color: "bg-red-500", icon: "F" },
                ].map((app) => (
                  <div key={app.name} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background border">
                    <div className={`w-10 h-10 rounded-lg ${app.color} flex items-center justify-center text-white font-semibold text-sm`}>
                      {app.icon}
                    </div>
                    <span className="text-xs font-medium">{app.name}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -top-3 -right-3 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-serif font-bold mb-3">Built for your organisation</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Everything your team needs to stay productive, all in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: LayoutGrid,
                title: "App Tiles",
                desc: "Embed URLs for any web application as beautiful, clickable tiles. Organise by category for quick access.",
              },
              {
                icon: Users,
                title: "Personalised",
                desc: "Each employee sees a tailored dashboard with the apps and tools most relevant to their role.",
              },
              {
                icon: Shield,
                title: "Secure & Managed",
                desc: "Single sign-on authentication, admin controls, and deploy via Intune to managed Windows PCs.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-6 space-y-4 bg-background">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Launchpad
          </div>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
