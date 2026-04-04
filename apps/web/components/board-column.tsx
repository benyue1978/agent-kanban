import type { CardListItem, CardStateValue } from "@agent-kanban/contracts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CardTile } from "@/components/card-tile";

export function BoardColumn({
  cards,
  description,
  state,
}: {
  cards: CardListItem[];
  description: string;
  state: CardStateValue;
}) {
  return (
    <section className="flex min-w-[300px] flex-1 flex-col gap-4 rounded-[2rem] border border-border/60 bg-white/55 p-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.42)] backdrop-blur-xl">
      <header className="flex flex-col gap-3 px-2 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground">{state}</h2>
            <Badge variant="secondary">{cards.length}</Badge>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </header>
      <Separator />
      <div className="flex flex-1 flex-col gap-3">
        {cards.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-border/80 bg-background/70 px-4 py-8 text-sm text-muted-foreground">
            No cards in {state.toLowerCase()} right now.
          </div>
        ) : (
          cards.map((card) => <CardTile key={card.id} card={card} />)
        )}
      </div>
    </section>
  );
}
