import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { environnement } from "./config/environnement";
import { baseDeDonnees } from "./config/baseDeDonnees";
import { routeurPrincipal } from "./routes";
import { limiteGenerale, refuserMethodesInconnues } from "./middlewares/securite";

const application = express();

application.disable("x-powered-by");
application.use(
  helmet({
    contentSecurityPolicy: environnement.estProduction,
    crossOriginResourcePolicy: { policy: "cross-origin" },
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
application.use(limiteGenerale);

application.use("/api", routeurPrincipal);

application.use((_requete, reponse) => {
  reponse.status(404).json({ succes: false, message: "Route introuvable." });
});

async function demarrerServeur() {
  await baseDeDonnees.$connect();
  application.listen(environnement.port, () => {
    console.log(`API MateMedical sur http://localhost:${environnement.port}`);
  });
}

demarrerServeur().catch((erreur) => {
  console.error("Impossible de démarrer l'API. Vérifiez PostgreSQL et backend/.env");
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
