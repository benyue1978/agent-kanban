import Link from "next/link";
import type { CardListItem } from "@agent-kanban/contracts";
import { ArrowUpRight, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stateTone: Record<CardListItem["state"], string> = {
  New: "text-slate-600",
  Ready: "text-amber-700",
  "In Progress": "text-sky-700",
  Done: "text-emerald-700",
};

export function CardTile({ card }: { card: CardListItem }) {
  return (
    <Link href={`/cards/${card.id}`} className="group block">
      <Card
        className={cn(
          "transition-all duration-200 shadow-none border-border bg-surface/50 hover:bg-surface backdrop-blur-none",
          card.state === "Done" && "opacity-80"
        )}
      >
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <span>{card.id}</span>
                <CircleDot className={cn("size-3", stateTone[card.state])} />
              </div>
              <h3 className="text-pretty text-base font-semibold tracking-[-0.02em] text-foreground">
                {card.title}
              </h3>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{card.state}</Badge>
            <Badge variant="muted">
              {card.owner === null ? "Unassigned" : `Owner ${card.owner.displayName ?? card.owner.id}`}
            </Badge>
            <Badge variant="secondary">
              {card.priority === null ? "Priority none" : `Priority ${card.priority}`}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
