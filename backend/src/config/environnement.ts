import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const jwtSecret = process.env.JWT_SECRET ?? "";
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET manquant ou trop court (minimum 32 caractères) dans backend/.env");
}

export const environnement = {
  port: Number(process.env.PORT_API ?? 4000),
  urlFrontend: process.env.URL_FRONTEND ?? "http://localhost:3000",
  jwtSecret,
  jwtExpiration: process.env.JWT_EXPIRATION ?? "8h",
  nodeEnv: process.env.NODE_ENV ?? "development",
  estProduction: process.env.NODE_ENV === "production",
};

export const optionsCookieJeton = {
  httpOnly: true,
  secure: environnement.estProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 8 * 60 * 60 * 1000,
};

export const optionsCookieInvite = {
  ...optionsCookieJeton,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
