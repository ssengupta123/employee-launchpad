import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { TileCard } from "@/components/tile-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, LogOut, Settings, Pin, LayoutGrid, ArrowLeft, Loader2 } from "lucide-react";
import reasonLogo from "@assets/Reason_Group_Logo_CMYK_(1)_1772061462381.png";
import type { TileWithCategory, Category, UserTile } from "@shared/schema";
import { Link } from "wouter";
import { DynamicIcon } from "@/components/dynamic-icon";

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all" | "pinned">("all");
  const [activeTile, setActiveTile] = useState<TileWithCategory | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loadingSsoToken, setLoadingSsoToken] = useState(false);

  const openTileEmbedded = useCallback(async (tile: TileWithCategory) => {
    setActiveTile(tile);
    setLoadingSsoToken(true);
    try {
      const res = await apiRequest("POST", "/api/sso-token", { targetUrl: tile.url });
      const data = await res.json();
      if (data.token) {
        const url = new URL(tile.url);
        url.searchParams.set("sso_token", data.token);
        setIframeUrl(url.toString());
      } else {
        setIframeUrl(tile.url);
      }
    } catch {
      setIframeUrl(tile.url);
    } finally {
      setLoadingSsoToken(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [authLoading, user]);

  const { data: tiles = [], isLoading: tilesLoading } = useQuery<TileWithCategory[]>({
    queryKey: ["/api/tiles"],
    enabled: !!user,
  });

  const { data: userTiles = [], isLoading: userTilesLoading } = useQuery<UserTile[]>({
    queryKey: ["/api/user-tiles"],
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  const { data: isAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const togglePinMutation = useMutation({
    mutationFn: async (tileId: string) => {
      const existing = userTiles.find((ut) => ut.tileId === tileId);
      if (existing?.pinned) {
        await apiRequest("DELETE", `/api/user-tiles/${tileId}`);
      } else {
        await apiRequest("POST", "/api/user-tiles", { tileId, pinned: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tiles"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update pin", variant: "destructive" });
    },
  });

  const pinnedTileIds = new Set(userTiles.filter((ut) => ut.pinned).map((ut) => ut.tileId));

  const filteredTiles = tiles.filter((tile) => {
    const matchesSearch =
      !search ||
      tile.title.toLowerCase().includes(search.toLowerCase()) ||
      tile.description?.toLowerCase().includes(search.toLowerCase());

    if (activeCategory === "pinned") return matchesSearch && pinnedTileIds.has(tile.id);
    if (activeCategory === "all") return matchesSearch;
    return matchesSearch && tile.categoryId === activeCategory;
  });

  const pinnedTiles = tiles.filter((t) => pinnedTileIds.has(t.id));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src={reasonLogo} alt="Reason Group" className="h-10 object-contain" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase() || "U";

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";

  if (activeTile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="shrink-0 border-b bg-background/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-3 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setActiveTile(null); setIframeUrl(null); }}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            <div className="h-5 w-px bg-border" />
            {activeTile.icon.startsWith("/") || activeTile.icon.startsWith("http") ? (
              <div className="w-7 h-7 rounded-md shrink-0 overflow-hidden">
                <img src={activeTile.icon} alt={activeTile.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeTile.color + "18", color: activeTile.color }}
              >
                <DynamicIcon name={activeTile.icon} className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="font-medium text-sm truncate" data-testid="text-embedded-app-title">{activeTile.title}</span>
          </div>
        </header>
        <div className="flex-1 relative">
          {loadingSsoToken ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Connecting...</p>
              </div>
            </div>
          ) : iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="absolute inset-0 w-full h-full border-0"
              title={activeTile.title}
              allow="clipboard-read; clipboard-write; fullscreen; autoplay; camera; microphone"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals allow-popups-to-escape-sandbox"
              data-testid="iframe-embedded-app"
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={reasonLogo} alt="Reason Group" className="h-8 object-contain" />
            <span className="text-lg font-semibold tracking-tight hidden sm:block">Launchpad</span>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2" data-testid="button-user-menu">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium" data-testid="text-user-name">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdmin?.isAdmin && (
                  <Link href="/admin">
                    <DropdownMenuItem data-testid="link-admin">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuItem
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-welcome">
            Welcome back, {user.firstName || "there"}
          </h1>
          <p className="text-muted-foreground mt-1">Access your applications and tools below.</p>
        </div>

        {pinnedTiles.length > 0 && activeCategory !== "pinned" && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Pin className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Pinned Apps</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {pinnedTiles.map((tile) => (
                <TileCard
                  key={tile.id}
                  tile={tile}
                  pinned
                  onTogglePin={(id) => togglePinMutation.mutate(id)}
                  onLaunch={(t) => openTileEmbedded(t)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Button
              variant={activeCategory === "all" ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              data-testid="button-category-all"
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              All Apps
            </Button>
            <Button
              variant={activeCategory === "pinned" ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveCategory("pinned")}
              data-testid="button-category-pinned"
            >
              <Pin className="w-3.5 h-3.5 mr-1.5" />
              Pinned
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {tilesLoading || userTilesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : filteredTiles.length === 0 ? (
            <div className="text-center py-16">
              <LayoutGrid className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg">No apps found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search ? "Try adjusting your search." : "No apps have been assigned to you yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredTiles.map((tile) => (
                <TileCard
                  key={tile.id}
                  tile={tile}
                  pinned={pinnedTileIds.has(tile.id)}
                  onTogglePin={(id) => togglePinMutation.mutate(id)}
                  onLaunch={(t) => openTileEmbedded(t)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
