import { CardDetail } from "@/components/card-detail";
import { fetchCard } from "@/lib/api";
import { getHumanActorId } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function CardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const card = await fetchCard(cardId);
  const humanActorId = getHumanActorId();

  return (
    <main>
      <CardDetail card={card} humanActorId={humanActorId} />
    </main>
  );
}
