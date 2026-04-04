import { CardDetail } from "@/components/card-detail";
import { fetchCard } from "@/lib/api";

export default async function CardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const card = await fetchCard(cardId);

  return (
    <main>
      <CardDetail card={card} />
    </main>
  );
}
