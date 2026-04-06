import { CardDetail } from "@/components/card-detail";
import { RealTimeRefresher } from "@/components/real-time-refresher";
import { fetchCard } from "@/lib/api";
import { getApiBaseUrl, getHumanActorId } from "@/lib/config";

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
      <RealTimeRefresher cardId={cardId} />
      <CardDetail card={card} humanActorId={humanActorId} />
    </main>
  );
}
