import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  LayoutGrid,
  FolderOpen,
  Globe,
} from "lucide-react";
import { DynamicIcon } from "@/components/dynamic-icon";
const reasonLogo = "/reason-group-logo.png";
import type { Tile, Category } from "@shared/schema";
import { Link } from "wouter";

const TILE_SKELETON_IDS = ["ts-1", "ts-2", "ts-3", "ts-4"];
const CAT_SKELETON_IDS = ["cs-1", "cs-2", "cs-3"];

function getSubmitLabel(isPending: boolean, isEditing: boolean): string {
  if (isPending) return "Saving...";
  return isEditing ? "Update" : "Create";
}

const ICON_OPTIONS = [
  "Globe", "LayoutGrid", "Mail", "Calendar", "Users", "FileText",
  "BarChart3", "Settings", "Database", "Shield", "Briefcase",
  "Calculator", "CreditCard", "MessageSquare", "Phone", "Video",
  "Cloud", "Folder", "Home", "Bookmark", "Star", "Heart",
  "Zap", "Target", "Award", "TrendingUp", "PieChart", "Activity",
];

const COLOR_OPTIONS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#F97316",
  "#EAB308", "#22C55E", "#14B8A6", "#06B6D4", "#6366F1",
  "#0EA5E9", "#D946EF",
];

function TileForm({
  tile,
  categories,
  onSubmit,
  isPending,
  onClose,
}: Readonly<{
  tile?: Tile | null;
  categories: Category[];
  onSubmit: (data: any) => void;
  isPending: boolean;
  onClose: () => void;
}>) {
  const [title, setTitle] = useState(tile?.title || "");
  const [description, setDescription] = useState(tile?.description || "");
  const [url, setUrl] = useState(tile?.url || "");
  const [icon, setIcon] = useState(tile?.icon || "Globe");
  const [color, setColor] = useState(tile?.color || "#3B82F6");
  const [categoryId, setCategoryId] = useState(tile?.categoryId || "");
  const [isGlobal, setIsGlobal] = useState(tile?.isGlobal ?? true);
  const [openInNewTab, setOpenInNewTab] = useState(tile?.openInNewTab ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || null,
      url,
      icon,
      color,
      categoryId: categoryId || null,
      isGlobal,
      openInNewTab,
      sortOrder: tile?.sortOrder || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="input-tile-title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none" data-testid="input-tile-description" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} required type="url" placeholder="https://" data-testid="input-tile-url" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icon</Label>
          <Select value={icon} onValueChange={setIcon}>
            <SelectTrigger data-testid="select-tile-icon"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger data-testid="select-tile-category"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Colour</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-md border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="global">Available to all users</Label>
          <p className="text-xs text-muted-foreground">Show this tile for everyone</p>
        </div>
        <Switch id="global" checked={isGlobal} onCheckedChange={setIsGlobal} data-testid="switch-tile-global" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="newTab">Open in new tab</Label>
          <p className="text-xs text-muted-foreground">Launch in a new browser tab</p>
        </div>
        <Switch id="newTab" checked={openInNewTab} onCheckedChange={setOpenInNewTab} data-testid="switch-tile-newtab" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending} data-testid="button-tile-submit">
          {getSubmitLabel(isPending, !!tile)}
        </Button>
      </div>
    </form>
  );
}

function CategoryForm({
  category,
  onSubmit,
  isPending,
  onClose,
}: Readonly<{
  category?: Category | null;
  onSubmit: (data: any) => void;
  isPending: boolean;
  onClose: () => void;
}>) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [icon, setIcon] = useState(category?.icon || "Folder");
  const [color, setColor] = useState(category?.color || "#3B82F6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description: description || null, icon, color, sortOrder: category?.sortOrder || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="catName">Name</Label>
        <Input id="catName" value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-category-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="catDesc">Description</Label>
        <Textarea id="catDesc" value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none" data-testid="input-category-description" />
      </div>
      <div className="space-y-2">
        <Label>Icon</Label>
        <Select value={icon} onValueChange={setIcon}>
          <SelectTrigger data-testid="select-category-icon"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ICON_OPTIONS.map((i) => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Colour</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-md border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending} data-testid="button-category-submit">
          {getSubmitLabel(isPending, !!category)}
        </Button>
      </div>
    </form>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [tileDialogOpen, setTileDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingTile, setEditingTile] = useState<Tile | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: isAdmin, isLoading: adminLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const { data: tiles = [], isLoading: tilesLoading } = useQuery<Tile[]>({
    queryKey: ["/api/admin/tiles"],
    enabled: !!user && isAdmin?.isAdmin,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      globalThis.location.href = "/api/login";
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!adminLoading && isAdmin && !isAdmin.isAdmin) {
      globalThis.location.href = "/";
    }
  }, [adminLoading, isAdmin]);

  const createTileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/tiles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tiles"] });
      setTileDialogOpen(false);
      setEditingTile(null);
      toast({ title: "Tile created successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { globalThis.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/tiles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tiles"] });
      setTileDialogOpen(false);
      setEditingTile(null);
      toast({ title: "Tile updated successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { globalThis.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTileMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/tiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tiles"] });
      toast({ title: "Tile deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({ title: "Category created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({ title: "Category updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src={reasonLogo} alt="Reason Group" className="h-10 object-contain" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <img src={reasonLogo} alt="Reason Group" className="h-8 object-contain" />
            <span className="text-lg font-semibold tracking-tight">Admin Panel</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="tiles">
          <TabsList className="mb-6">
            <TabsTrigger value="tiles" data-testid="tab-tiles">
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              App Tiles
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tiles" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold">App Tiles</h2>
                <p className="text-sm text-muted-foreground">Manage the applications available on the launchpad.</p>
              </div>
              <Dialog open={tileDialogOpen} onOpenChange={(open) => { setTileDialogOpen(open); if (!open) setEditingTile(null); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-tile">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Tile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTile ? "Edit Tile" : "Add New Tile"}</DialogTitle>
                  </DialogHeader>
                  <TileForm
                    tile={editingTile}
                    categories={categories}
                    onSubmit={(data) => {
                      if (editingTile) {
                        updateTileMutation.mutate({ id: editingTile.id, data });
                      } else {
                        createTileMutation.mutate(data);
                      }
                    }}
                    isPending={createTileMutation.isPending || updateTileMutation.isPending}
                    onClose={() => { setTileDialogOpen(false); setEditingTile(null); }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {tilesLoading && (
              <div className="space-y-3">
                {TILE_SKELETON_IDS.map((id) => (
                  <Skeleton key={id} className="h-16 rounded-lg" />
                ))}
              </div>
            )}
            {!tilesLoading && tiles.length === 0 && (
              <Card className="p-12 text-center bg-background">
                <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-lg">No tiles yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Add your first application tile to get started.</p>
              </Card>
            )}
            {!tilesLoading && tiles.length > 0 && (
              <div className="space-y-2">
                {tiles.map((tile) => (
                  <Card key={tile.id} className="p-4 flex items-center justify-between gap-4 bg-background" data-testid={`admin-tile-${tile.id}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: tile.color + "18", color: tile.color }}
                      >
                        <DynamicIcon name={tile.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{tile.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{tile.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {tile.isGlobal && <Badge variant="secondary" className="no-default-active-elevate text-[10px]">Global</Badge>}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingTile(tile); setTileDialogOpen(true); }}
                        data-testid={`button-edit-tile-${tile.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" data-testid={`button-delete-tile-${tile.id}`}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{tile.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove this tile from all users' dashboards.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTileMutation.mutate(tile.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold">Categories</h2>
                <p className="text-sm text-muted-foreground">Organise app tiles into groups.</p>
              </div>
              <Dialog open={categoryDialogOpen} onOpenChange={(open) => { setCategoryDialogOpen(open); if (!open) setEditingCategory(null); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-category">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                  </DialogHeader>
                  <CategoryForm
                    category={editingCategory}
                    onSubmit={(data) => {
                      if (editingCategory) {
                        updateCategoryMutation.mutate({ id: editingCategory.id, data });
                      } else {
                        createCategoryMutation.mutate(data);
                      }
                    }}
                    isPending={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    onClose={() => { setCategoryDialogOpen(false); setEditingCategory(null); }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {categoriesLoading && (
              <div className="space-y-3">
                {CAT_SKELETON_IDS.map((id) => (
                  <Skeleton key={id} className="h-14 rounded-lg" />
                ))}
              </div>
            )}
            {!categoriesLoading && categories.length === 0 && (
              <Card className="p-12 text-center bg-background">
                <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-lg">No categories yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Create categories to organise your app tiles.</p>
              </Card>
            )}
            {!categoriesLoading && categories.length > 0 && (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <Card key={cat.id} className="p-4 flex items-center justify-between gap-4 bg-background" data-testid={`admin-category-${cat.id}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.color + "18", color: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{cat.name}</p>
                        {cat.description && <p className="text-xs text-muted-foreground truncate">{cat.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingCategory(cat); setCategoryDialogOpen(true); }}
                        data-testid={`button-edit-category-${cat.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" data-testid={`button-delete-category-${cat.id}`}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>Tiles in this category will become uncategorised.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCategoryMutation.mutate(cat.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
