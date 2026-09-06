"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { appelerApi } from "@/lib/api";
import { formaterDate } from "@/lib/formatage";
import { useClient } from "@/store/contexteClient";
import type { NotificationClient } from "@/types/modeles";

export default function PageNotifications() {
  const { chargerTableauDeBord } = useClient();
  const [notifications, setNotifications] = useState<NotificationClient[]>([]);

  async function charger() {
    const donnees = await appelerApi<{ notifications: NotificationClient[] }>("/notifications");
    setNotifications(donnees.notifications);
  }

  useEffect(() => {
    charger();
  }, []);

  async function toutLire() {
    await appelerApi("/notifications/toutes", { method: "PATCH" });
    await charger();
    await chargerTableauDeBord();
  }

  return (
    <MiseEnPageClient>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <EnTetePage titre="Notifications" description="Alertes commandes, messages et factures." />
        <button
          type="button"
          onClick={toutLire}
          className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-medium text-violet-marque"
        >
          Tout marquer lu
        </button>
      </div>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={notification.lien ?? "/"}
            className={`block rounded-2xl border p-4 ${
              notification.lue ? "border-slate-100 bg-white" : "border-violet-100 bg-violet-50"
            }`}
          >
            <p className="font-semibold text-slate-800">{notification.titre}</p>
            <p className="mt-1 text-sm text-slate-500">{notification.contenu}</p>
            <p className="mt-2 text-xs text-slate-400">{formaterDate(notification.dateCreation)}</p>
          </Link>
        ))}
      </div>
      <BandeauMessagerie />
    </MiseEnPageClient>
  );
}
