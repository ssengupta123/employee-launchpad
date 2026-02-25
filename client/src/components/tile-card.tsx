import type { TileWithCategory } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";
import * as LucideIcons from "lucide-react";

function isImageIcon(iconName: string) {
  return iconName.startsWith("/") || iconName.startsWith("http://") || iconName.startsWith("https://");
}

function getIcon(iconName: string) {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.Globe;
}

interface TileCardProps {
  tile: TileWithCategory;
  pinned?: boolean;
  onTogglePin?: (tileId: string) => void;
  onLaunch?: (tile: TileWithCategory) => void;
  showPinButton?: boolean;
}

export function TileCard({ tile, pinned, onTogglePin, onLaunch, showPinButton = true }: TileCardProps) {
  const useImage = isImageIcon(tile.icon);
  const Icon = useImage ? null : getIcon(tile.icon);

  const handleClick = () => {
    if (onLaunch) {
      onLaunch(tile);
    }
  };

  return (
    <Card
      className="group relative p-5 cursor-pointer transition-all duration-200 hover-elevate bg-background"
      onClick={handleClick}
      data-testid={`tile-card-${tile.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {useImage ? (
            <div className="w-11 h-11 rounded-lg shrink-0 overflow-hidden">
              <img src={tile.icon} alt={tile.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: tile.color + "18", color: tile.color }}
            >
              {Icon && <Icon className="w-5 h-5" />}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate" data-testid={`text-tile-title-${tile.id}`}>
                {tile.title}
              </h3>
            </div>
            {tile.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{tile.description}</p>
            )}
            {tile.category && (
              <Badge variant="secondary" className="text-[10px] no-default-active-elevate">
                {tile.category.name}
              </Badge>
            )}
          </div>
        </div>
        {showPinButton && onTogglePin && (
          <Button
            size="icon"
            variant="ghost"
            className={`shrink-0 ${pinned ? "text-primary" : "invisible group-hover:visible text-muted-foreground"}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(tile.id);
            }}
            data-testid={`button-pin-${tile.id}`}
          >
            <Pin className={`w-3.5 h-3.5 ${pinned ? "fill-current" : ""}`} />
          </Button>
        )}
      </div>
    </Card>
  );
}
