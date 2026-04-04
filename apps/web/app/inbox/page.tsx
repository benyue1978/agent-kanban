import { InboxList } from "@/components/inbox-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchInbox } from "@/lib/api";
import { getHumanActorId, humanActorConfigurationMessage } from "@/lib/config";

export default async function InboxPage() {
  const humanActorId = getHumanActorId();

  if (humanActorId === null) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 md:px-8">
        <section className="flex flex-col gap-3">
          <Badge variant="outline">Inbox</Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-6xl">
            Browser inbox needs an explicit human actor.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {humanActorConfigurationMessage}
          </p>
        </section>
      </main>
    );
  }

  const items = await fetchInbox(humanActorId);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_320px]">
        <div className="flex flex-col gap-3">
          <Badge variant="outline">Inbox</Badge>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-6xl">
            Human mentions become an explicit review queue.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            This slice keeps inbox behavior small and deterministic: mentions become inbox items, humans acknowledge them, then jump into the card to review or send work back.
          </p>
        </div>
        <Card className="border-primary/15 bg-white/70">
          <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
            <div className="space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
                Current Human Actor
              </div>
              <div className="font-mono text-lg text-foreground">{humanActorId}</div>
            </div>
            <div className="text-sm leading-6 text-muted-foreground">
              {items.length} mention{items.length === 1 ? "" : "s"} in queue.
            </div>
          </CardContent>
        </Card>
      </section>

      <InboxList actorId={humanActorId} items={items} />
    </main>
  );
}
