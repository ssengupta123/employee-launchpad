import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { TileCard } from "@/components/tile-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { CopilotWidget } from "@/components/copilot-widget";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LogOut, Settings, Pin, LayoutGrid, ArrowLeft, Loader2, SlidersHorizontal } from "lucide-react";
const reasonLogo = "/reason-group-logo.png";
import type { TileWithCategory, Category, UserTile } from "@shared/schema";
import { Link } from "wouter";
import { DynamicIcon } from "@/components/dynamic-icon";

const SKELETON_IDS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"];

function TilesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {SKELETON_IDS.map((id) => (
        <Skeleton key={id} className="h-72 rounded-xl" />
      ))}
    </div>
  );
}

function EmptyTilesState({ search, onClearSearch }: Readonly<{ search: string; onClearSearch: () => void }>) {
  const message = search
    ? `No results for "${search}". Try a different search term.`
    : "No applications have been added yet. Contact your administrator to get started.";
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <Search className="w-9 h-9 text-primary/40" />
      </div>
      <h3 className="font-semibold text-xl">No apps found</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">{message}</p>
      {search && (
        <Button variant="outline" className="mt-4" onClick={onClearSearch} data-testid="button-clear-search">
          Clear search
        </Button>
      )}
    </div>
  );
}

function TilesGrid({ tiles, pinnedTileIds, onTogglePin, onLaunch }: Readonly<{
  tiles: TileWithCategory[];
  pinnedTileIds: Set<string>;
  onTogglePin: (id: string) => void;
  onLaunch: (tile: TileWithCategory) => void;
}>) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground" data-testid="text-results-count">
          {tiles.length} {tiles.length === 1 ? "app" : "apps"} available
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            pinned={pinnedTileIds.has(tile.id)}
            onTogglePin={onTogglePin}
            onLaunch={onLaunch}
          />
        ))}
      </div>
    </>
  );
}

function EmbeddedContent({ loading, iframeUrl, title }: Readonly<{ loading: boolean; iframeUrl: string | null; title: string }>) {
  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting...</p>
        </div>
      </div>
    );
  }
  if (iframeUrl) {
    return (
      <iframe
        src={iframeUrl}
        className="absolute inset-0 w-full h-full border-0"
        title={title}
        allow="clipboard-read; clipboard-write; fullscreen; autoplay; camera; microphone"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals allow-popups-to-escape-sandbox"
        data-testid="iframe-embedded-app"
      />
    );
  }
  return null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeTile, setActiveTile] = useState<TileWithCategory | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loadingSsoToken, setLoadingSsoToken] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "category">("name");

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
      globalThis.location.href = "/api/login";
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
        setTimeout(() => { globalThis.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update pin", variant: "destructive" });
    },
  });

  const pinnedTileIds = new Set(userTiles.filter((ut) => ut.pinned).map((ut) => ut.tileId));

  const filteredTiles = tiles
    .filter((tile) => {
      const matchesSearch =
        !search ||
        tile.title.toLowerCase().includes(search.toLowerCase()) ||
        tile.description?.toLowerCase().includes(search.toLowerCase());

      if (activeCategory === "pinned") return matchesSearch && pinnedTileIds.has(tile.id);
      if (activeCategory === "all") return matchesSearch;
      return matchesSearch && tile.categoryId === activeCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "category") return (a.category?.name || "").localeCompare(b.category?.name || "");
      return 0;
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
        <header className="shrink-0 border-b bg-[#0a1628] z-50">
          <div className="flex items-center gap-3 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setActiveTile(null); setIframeUrl(null); }}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            <div className="h-5 w-px bg-white/10" />
            {activeTile.icon.startsWith("/") || activeTile.icon.startsWith("http") ? (
              <div className="w-7 h-7 rounded-md shrink-0 overflow-hidden">
                <img src={activeTile.icon} alt={activeTile.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeTile.color + "30", color: activeTile.color }}
              >
                <DynamicIcon name={activeTile.icon} className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="font-medium text-sm truncate text-white" data-testid="text-embedded-app-title">{activeTile.title}</span>
          </div>
        </header>
        <div className="flex-1 relative">
          <EmbeddedContent loading={loadingSsoToken} iframeUrl={iframeUrl} title={activeTile.title} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={reasonLogo} alt="Reason Group" className="h-8 object-contain" data-testid="img-dashboard-logo" />
            <div className="hidden sm:block h-6 w-px bg-border" />
            <span className="text-sm font-semibold tracking-wide text-muted-foreground hidden sm:block">Launchpad</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2.5 px-2" data-testid="button-user-menu">
                  <Avatar className="w-8 h-8 border">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold" data-testid="text-user-name">{displayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
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

      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-welcome">
            {getGreeting()}, {user.firstName || "there"}
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Your one-stop shop for productivity apps, workflows, and tools.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search apps, tools, and workflows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-base"
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "category")}>
                <SelectTrigger className="w-[140px] h-11" data-testid="select-sort">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            className="rounded-full"
            data-testid="button-category-all"
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
            All Apps
            <span className="ml-1.5 text-xs opacity-60">{tiles.length}</span>
          </Button>
          {pinnedTiles.length > 0 && (
            <Button
              variant={activeCategory === "pinned" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("pinned")}
              className="rounded-full"
              data-testid="button-category-pinned"
            >
              <Pin className="w-3.5 h-3.5 mr-1.5" />
              Pinned
              <span className="ml-1.5 text-xs opacity-60">{pinnedTiles.length}</span>
            </Button>
          )}
          {categories.map((cat) => {
            const count = tiles.filter(t => t.categoryId === cat.id).length;
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="rounded-full"
                data-testid={`button-category-${cat.id}`}
              >
                {cat.name}
                <span className="ml-1.5 text-xs opacity-60">{count}</span>
              </Button>
            );
          })}
        </div>

        {tilesLoading || userTilesLoading ? (
          <TilesLoadingSkeleton />
        ) : filteredTiles.length === 0 ? (
          <EmptyTilesState search={search} onClearSearch={() => setSearch("")} />
        ) : (
          <TilesGrid
            tiles={filteredTiles}
            pinnedTileIds={pinnedTileIds}
            onTogglePin={(id) => togglePinMutation.mutate(id)}
            onLaunch={openTileEmbedded}
          />
        )}
      </main>

      <footer className="border-t bg-background mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={reasonLogo} alt="Reason Group" className="h-4 object-contain opacity-40" data-testid="img-footer-logo" />
            <span>Launchpad</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Reason Group</span>
        </div>
      </footer>

      <CopilotWidget />
    </div>
  );
}
