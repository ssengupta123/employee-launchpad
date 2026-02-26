import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutGrid, Users, Shield, ArrowRight, Lock, Monitor, Sparkles } from "lucide-react";
const reasonLogo = "/reason-group-logo.png";

const PREVIEW_APPS = [
  { name: "Finance Hub", color: "#22C55E", icon: "F", delay: 0 },
  { name: "Outlook", color: "#0078D4", icon: "O", delay: 100 },
  { name: "Teams", color: "#6264A7", icon: "T", delay: 200 },
  { name: "SharePoint", color: "#038387", icon: "S", delay: 300 },
  { name: "Power BI", color: "#F2C811", icon: "P", delay: 400 },
  { name: "Dynamics", color: "#002050", icon: "D", delay: 500 },
  { name: "Planner", color: "#31752F", icon: "P", delay: 600 },
  { name: "OneNote", color: "#7719AA", icon: "N", delay: 700 },
  { name: "Viva", color: "#0E7A0D", icon: "V", delay: 800 },
];

function AnimatedTile({ app, index }: { app: typeof PREVIEW_APPS[0]; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300 + app.delay);
    return () => clearTimeout(timer);
  }, [app.delay]);

  return (
    <div
      className={`flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white/[0.07] border border-white/[0.08] backdrop-blur-sm transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
        style={{ backgroundColor: app.color }}
      >
        {app.icon}
      </div>
      <span className="text-[11px] font-medium text-white/80 truncate w-full text-center">{app.name}</span>
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={reasonLogo} alt="Reason Group" className="h-8 object-contain brightness-0 invert" data-testid="img-logo" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href="/api/login">
              <Button
                size="sm"
                className="bg-white text-[#0a1628] hover:bg-white/90 font-semibold px-5"
                data-testid="button-login"
              >
                Sign In
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2137] to-[#0a2a2d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(183_62%_43%_/_0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(183_62%_43%_/_0.08),_transparent_50%)]" />

        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/8 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`space-y-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] text-primary text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Reason Group Application Hub
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-serif font-bold tracking-tight leading-[1.08] text-white">
                All your tools,{" "}
                <span className="bg-gradient-to-r from-primary to-[hsl(195,70%,55%)] bg-clip-text text-transparent">
                  one launchpad.
                </span>
              </h1>

              <p className="text-lg text-white/60 max-w-lg leading-relaxed">
                Access every business application from a single personalised dashboard.
                Secure, managed, and tailored to your role.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a href="/api/login">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 h-12 text-base shadow-lg shadow-primary/20"
                    data-testid="button-get-started"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary/70" />
                  Microsoft SSO
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary/70" />
                  Embedded Apps
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary/70" />
                  Per-user Personalisation
                </div>
              </div>
            </div>

            <div className={`hidden lg:block transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 rounded-2xl blur-sm" />
                <div className="relative rounded-2xl border border-white/[0.1] bg-white/[0.03] backdrop-blur-md p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                    <span className="ml-3 text-xs text-white/30 font-mono">launchpad.reasongroup.com.au</span>
                  </div>

                  <div className="flex items-center gap-3 mb-5 px-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/90">My Applications</div>
                      <div className="text-[10px] text-white/40">9 apps available</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {PREVIEW_APPS.map((app, i) => (
                      <AnimatedTile key={app.name} app={app} index={i} />
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-white/30">Pinned: 3 apps</span>
                    <span className="text-[10px] text-primary/60 font-medium">View All</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/5 to-transparent dark:from-[#0a1628]/30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-3">Why Launchpad</p>
            <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-4">Built for enterprise teams</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A centralised hub designed for how Reason Group works.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutGrid,
                title: "Unified Access",
                desc: "Every web application your team needs, organised into categories and accessible with a single click. Apps open embedded — no tab switching.",
              },
              {
                icon: Users,
                title: "Personalised Experience",
                desc: "Each employee gets a tailored view. Pin your most-used apps, filter by category, and find what you need instantly.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                desc: "Microsoft Entra ID single sign-on, admin-managed tiles, and seamless authentication across all embedded applications.",
              },
            ].map((feature) => (
              <div key={feature.title} className="group relative p-8 rounded-2xl border bg-card hover:border-primary/20 transition-colors duration-300" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-serif font-bold">Ready to get started?</h2>
          <p className="text-muted-foreground">
            Sign in with your Reason Group Microsoft account to access your personalised dashboard.
          </p>
          <a href="/api/login">
            <Button size="lg" className="mt-4 px-10 h-12 text-base font-semibold" data-testid="button-cta-sign-in">
              Sign In with Microsoft
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      <footer className="py-8 px-6 border-t bg-card/30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={reasonLogo} alt="Reason Group" className="h-5 object-contain" data-testid="img-footer-logo" />
            <span className="text-xs">Launchpad</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} Reason Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
