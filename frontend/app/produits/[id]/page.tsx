import { PageDetailProduit } from "@/composants/produits/PageDetailProduit";

export default async function PageProduit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PageDetailProduit identifiantProduit={id} />;
}
