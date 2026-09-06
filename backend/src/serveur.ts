import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { environnement } from "./config/environnement";
import { baseDeDonnees } from "./config/baseDeDonnees";
import { routeurPrincipal } from "./routes";
import { limiteGenerale, refuserMethodesInconnues, verifierOrigine } from "./middlewares/securite";
import { attacherSocketIo } from "./temps-reel/diffuseur";

const application = express();
application.set("trust proxy", 1);
application.disable("x-powered-by");
application.use(
  helmet({
    contentSecurityPolicy: environnement.estProduction,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
application.use(
  cors({
    origin: environnement.urlFrontend,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
application.use(cookieParser());
application.use(express.json({ limit: "1mb" }));
application.use(refuserMethodesInconnues);
application.use(verifierOrigine);
application.use(limiteGenerale);

application.use("/api", routeurPrincipal);

application.use((_requete, reponse) => {
  reponse.status(404).json({ succes: false, message: "Route introuvable." });
});

application.use(
  (erreur: unknown, _requete: express.Request, reponse: express.Response, _suivant: express.NextFunction) => {
    if (environnement.estProduction) {
      reponse.status(500).json({ succes: false, message: "Erreur interne." });
      return;
    }
    reponse.status(500).json({
      succes: false,
      message: erreur instanceof Error ? erreur.message : "Erreur interne.",
    });
  },
);

async function demarrerServeur() {
  await baseDeDonnees.$connect();
  const serveurHttp = createServer(application);
  attacherSocketIo(serveurHttp);
  serveurHttp.listen(environnement.port, () => {
    console.log(`API MateMedical sur http://localhost:${environnement.port}`);
  });
}

demarrerServeur().catch((erreur) => {
  console.error("Impossible de démarrer l'API. Vérifiez PostgreSQL et backend/.env");
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
