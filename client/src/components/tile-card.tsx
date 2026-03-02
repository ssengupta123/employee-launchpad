import type { TileWithCategory } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";

function isImageIcon(iconName: string) {
  return iconName.startsWith("/") || iconName.startsWith("http://") || iconName.startsWith("https://");
}

function getIcon(iconName: string) {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.Globe;
}

interface TileCardProps {
  readonly tile: TileWithCategory;
  readonly pinned?: boolean;
  readonly onTogglePin?: (tileId: string) => void;
  readonly onLaunch?: (tile: TileWithCategory) => void;
  readonly showPinButton?: boolean;
}

export function TileCard({ tile, pinned, onTogglePin, onLaunch, showPinButton = true }: TileCardProps) {
  const useImage = isImageIcon(tile.icon);
  const Icon = useImage ? null : getIcon(tile.icon);
  const tileColor = tile.color || "#2AABB3";

  const handleClick = () => {
    if (onLaunch) {
      onLaunch(tile);
    }
  };

  return (
    <Card
      className="group relative cursor-pointer transition-all duration-200 hover-elevate bg-background overflow-hidden flex flex-col"
      onClick={handleClick}
      data-testid={`tile-card-${tile.id}`}
    >
      <div className="relative h-44 overflow-hidden">
        {tile.imageUrl ? (
          <img
            src={tile.imageUrl}
            alt={tile.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${tileColor}20 0%, ${tileColor}08 100%)`,
            }}
          >
            {useImage ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm">
                <img src={tile.icon} alt={tile.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: tileColor + "20", color: tileColor }}
              >
                {Icon && <Icon className="w-8 h-8" />}
              </div>
            )}
          </div>
        )}

        {showPinButton && onTogglePin && (
          <Button
            size="icon"
            variant="secondary"
            className={`absolute top-2 right-2 h-8 w-8 shadow-sm ${
              pinned
                ? "text-primary bg-background/90 backdrop-blur-sm"
                : "invisible group-hover:visible bg-background/80 backdrop-blur-sm text-muted-foreground"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(tile.id);
            }}
            data-testid={`button-pin-${tile.id}`}
          >
            <Pin className={`w-3.5 h-3.5 ${pinned ? "fill-current" : ""}`} />
          </Button>
        )}

        {tile.category && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-3 text-xs font-medium bg-background/90 backdrop-blur-sm shadow-sm no-default-active-elevate"
          >
            {tile.category.name}
          </Badge>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-1.5">
          {useImage ? (
            <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden border border-border/50">
              <img src={tile.icon} alt={tile.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: tileColor + "15", color: tileColor }}
            >
              {Icon && <Icon className="w-4.5 h-4.5" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate" data-testid={`text-tile-title-${tile.id}`}>
              {tile.title}
            </h3>
          </div>
        </div>

        {tile.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mt-1 flex-1">{tile.description}</p>
        )}

        <div className="flex items-center justify-end mt-3 pt-2 border-t border-border/40">
          <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Open app <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Card>
  );
}
