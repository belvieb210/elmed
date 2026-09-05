import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { PageAccueil } from "@/composants/accueil/PageAccueil";

export default function PageRacine() {
  return (
    <MiseEnPageClient>
      <PageAccueil />
    </MiseEnPageClient>
  );
}
