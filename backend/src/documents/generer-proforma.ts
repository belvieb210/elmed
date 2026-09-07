import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import {
  bleuFiligrane,
  bleuProforma,
  obtenirInfosEntreprise,
  type InfosEntreprise,
} from "./infos-elmed";

export type LigneProforma = {
  quantite: number;
  designation: string;
  prixUnitaire: number;
  prixTotal: number;
};

export type DonneesProforma = {
  numero: string;
  dateTexte: string;
  nomClient: string;
  numeroClient?: string | null;
  numeroVisite?: string | null;
  numeroDossier?: string | null;
  lignes: LigneProforma[];
  montantTotal: number;
  montantPaye?: number;
  resteAPayer?: number;
  titreDocument?: string;
  statutPaiement?: string;
  libellePaiement?: string;
  libelleModePaiement?: string;
};

function formaterMontant(montant: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant)} $`;
}

const LOGO_DEFAUT_FICHIER = path.resolve(__dirname, "../../assets/logo-microscope.png");

function cheminLogoPublic(urlRelative: string) {
  const relatif = urlRelative.replace(/^\//, "");
  const candidats = [
    path.resolve(process.cwd(), "assets", path.basename(relatif)),
    path.resolve(process.cwd(), "../frontend/public", relatif),
    path.resolve(process.cwd(), "frontend/public", relatif),
    LOGO_DEFAUT_FICHIER,
  ];
  return candidats.find((fichier) => fs.existsSync(fichier)) ?? null;
}

/** Résout le logo facture : data URL, fichier local, ou microscope par défaut. */
function resoudreImageLogo(logoUrl?: string | null): Buffer | string | null {
  if (logoUrl?.startsWith("data:image/")) {
    const base64 = logoUrl.split(",")[1];
    if (base64) return Buffer.from(base64, "base64");
  }

  if (logoUrl?.startsWith("/")) {
    const local = cheminLogoPublic(logoUrl);
    if (local) return local;
  }

  if (logoUrl && fs.existsSync(logoUrl)) return logoUrl;

  if (fs.existsSync(LOGO_DEFAUT_FICHIER)) return LOGO_DEFAUT_FICHIER;
  return null;
}

function dessinerLogoFacture(doc: PDFKit.PDFDocument, infos: InfosEntreprise, x: number, y: number) {
  const image = resoudreImageLogo(infos.logoUrl);
  if (image) {
    try {
      doc.image(image, x, y, { fit: [78, 78], align: "center", valign: "center" });
      return;
    } catch {
      /* repli schéma trait */
    }
  }

  // Repli : pictogramme trait (si fichier logo absent)
  doc.save();
  doc.strokeColor(bleuProforma).lineWidth(2.2);
  doc.circle(x + 28, y + 10, 7).stroke();
  doc.moveTo(x + 28, y + 17).lineTo(x + 28, y + 36).stroke();
  doc.moveTo(x + 16, y + 36).lineTo(x + 40, y + 36).stroke();
  doc.moveTo(x + 28, y + 36).lineTo(x + 18, y + 58).stroke();
  doc.moveTo(x + 18, y + 58).lineTo(x + 42, y + 58).stroke();
  doc.roundedRect(x + 10, y + 58, 36, 8, 2).stroke();
  doc.circle(x + 18, y + 48, 4).stroke();
  doc.restore();
}

function dessinerEntete(doc: PDFKit.PDFDocument, donnees: DonneesProforma, infos: InfosEntreprise) {
  doc.fillColor(bleuProforma).font("Helvetica-Bold").fontSize(26);
  doc.text(infos.nom, 36, 38, { width: 200 });

  doc.font("Helvetica").fontSize(8);
  doc.text(infos.activite1, 36, 70, { width: 220 });
  doc.text(infos.activite2, 36, 81, { width: 220 });
  doc.text(`RCCM : ${infos.rccm}`, 36, 96, { width: 240 });
  doc.text(`Id. Nat. ${infos.idNational}`, 36, 107, { width: 240 });
  doc.text(infos.adresse, 36, 122, { width: 240 });
  doc.text(`Tél. : ${infos.telephone}`, 36, 133, { width: 240 });

  dessinerLogoFacture(doc, infos, 255, 32);

  doc.font("Helvetica").fontSize(10);
  doc.text(`${infos.ville} , le ${donnees.dateTexte}`, 360, 42, { width: 200, align: "right" });

  doc.roundedRect(430, 64, 130, 28, 2).fill(bleuProforma);
  doc.fillColor("white").font("Helvetica-Bold").fontSize(14);
  doc.text(donnees.titreDocument ?? "PROFORMA", 430, 71, { width: 130, align: "center" });

  doc.fillColor(bleuProforma).font("Helvetica").fontSize(11);
  doc.text(`N° ${donnees.numero}`, 360, 100, { width: 200, align: "right" });
}

function finaliserPdf(dessiner: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const morceaux: Buffer[] = [];
    doc.on("data", (morceau: Buffer) => morceaux.push(morceau));
    doc.on("end", () => resolve(Buffer.concat(morceaux)));
    doc.on("error", reject);
    dessiner(doc);
    doc.end();
  });
}

function dessinerPageFacture(doc: PDFKit.PDFDocument, donnees: DonneesProforma, infos: InfosEntreprise) {
  dessinerEntete(doc, donnees, infos);

  doc.fillColor(bleuProforma).font("Helvetica").fontSize(11);
  doc.text(`Client (e)  ${donnees.nomClient}`, 36, 160, { width: 523 });
  doc.moveTo(108, 173).lineTo(559, 173).strokeColor(bleuProforma).lineWidth(0.6).stroke();
  const references = [
    donnees.numeroClient ? `N° client ${donnees.numeroClient}` : null,
    donnees.numeroVisite ? `Visite ${donnees.numeroVisite}` : null,
    donnees.numeroDossier ? `Dossier ${donnees.numeroDossier}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (references) {
    doc.font("Helvetica").fontSize(8);
    doc.text(references, 36, 176, { width: 523 });
  }

  doc.font("Helvetica-Oblique").fontSize(11);
  doc.text("doit pour ce qui suit :", 36, 188, { width: 523, align: "center" });

  const x = 36;
  const largeurs = [52, 261, 105, 105];
  const colonnes = [x, x + largeurs[0], x + largeurs[0] + largeurs[1], x + largeurs[0] + largeurs[1] + largeurs[2]];
  const largeurTable = largeurs.reduce((somme, valeur) => somme + valeur, 0);
  const yDepart = 214;
  const hauteurEntete = 22;
  const hauteurLigne = 22;
  const nombreLignes = 18;
  const hauteurTotal = 36;
  const yTotal = yDepart + hauteurEntete + nombreLignes * hauteurLigne;
  const yBas = yTotal + hauteurTotal;

  doc.save();
  doc.fillColor(bleuFiligrane).opacity(0.22);
  doc.rotate(-28, { origin: [297, 480] });
  doc.font("Helvetica-Bold").fontSize(72);
  doc.text(infos.nom, 80, 430, { width: 430, align: "center" });
  doc.restore();

  doc.lineWidth(2).strokeColor(bleuProforma).rect(x, yDepart, largeurTable, yBas - yDepart).stroke();
  doc.lineWidth(0.8);

  doc.rect(x, yDepart, largeurTable, hauteurEntete).stroke();
  const titres = ["Qté", "Désignation", "Prix Unit", "Prix Total"];
  titres.forEach((titre, index) => {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(bleuProforma);
    doc.text(titre, colonnes[index] + 4, yDepart + 6, { width: largeurs[index] - 8, align: "center" });
  });

  for (let index = 0; index < nombreLignes; index += 1) {
    const y = yDepart + hauteurEntete + index * hauteurLigne;
    doc.strokeColor(bleuProforma).moveTo(x, y).lineTo(x + largeurTable, y).stroke();
    const ligne = donnees.lignes[index];
    if (!ligne) continue;
    doc.font("Helvetica").fontSize(9).fillColor("#1a365d");
    doc.text(String(ligne.quantite), colonnes[0] + 4, y + 6, { width: largeurs[0] - 8, align: "center" });
    const designation =
      ligne.designation.length > 46 ? `${ligne.designation.slice(0, 45)}…` : ligne.designation;
    doc.text(designation, colonnes[1] + 6, y + 6, { width: largeurs[1] - 10 });
    doc.text(formaterMontant(ligne.prixUnitaire), colonnes[2] + 4, y + 6, { width: largeurs[2] - 8, align: "right" });
    doc.text(formaterMontant(ligne.prixTotal), colonnes[3] + 4, y + 6, { width: largeurs[3] - 8, align: "right" });
  }

  doc.strokeColor(bleuProforma);
  doc.moveTo(colonnes[1], yDepart).lineTo(colonnes[1], yTotal).stroke();
  doc.moveTo(colonnes[2], yDepart).lineTo(colonnes[2], yBas).stroke();
  doc.moveTo(colonnes[3], yDepart).lineTo(colonnes[3], yBas).stroke();

  doc.moveTo(x, yTotal).lineTo(x + largeurTable, yTotal).stroke();

  const largeurFusion = largeurs[0] + largeurs[1];
  const paye = donnees.montantPaye ?? 0;
  const reste = donnees.resteAPayer ?? Math.max(0, donnees.montantTotal - paye);
  const payee = donnees.statutPaiement === "PAYE";
  const afficherPaiement =
    paye > 0 || reste > 0 || Boolean(donnees.libellePaiement || donnees.libelleModePaiement);

  if (afficherPaiement) {
    doc.font("Helvetica").fontSize(7).fillColor(bleuProforma);
    doc.text(
      `Montant payé : ${formaterMontant(paye)}   Reste à payer : ${formaterMontant(reste)}`,
      x + 5,
      yTotal + 6,
      { width: largeurFusion - 10, align: "left" },
    );
    if (donnees.libellePaiement || donnees.libelleModePaiement) {
      doc.font("Helvetica-Bold").fontSize(7).fillColor(payee ? "#047857" : "#c2410c");
      doc.text(
        `Paiement : ${donnees.libellePaiement ?? "En attente"}${
          donnees.libelleModePaiement ? ` — ${donnees.libelleModePaiement}` : ""
        }`,
        x + 5,
        yTotal + 19,
        { width: largeurFusion - 10, align: "left" },
      );
    }
  }

  doc.font("Helvetica-Bold").fontSize(9).fillColor(bleuProforma);
  doc.text("TOTAL GENERAL →", colonnes[2] + 2, yTotal + 12, {
    width: largeurs[2] - 4,
    align: "right",
  });
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text(formaterMontant(donnees.montantTotal), colonnes[3] + 4, yTotal + 11, {
    width: largeurs[3] - 8,
    align: "right",
  });

  if (donnees.lignes.length > nombreLignes) {
    doc.addPage();
    dessinerEntete(doc, donnees, infos);
    doc.font("Helvetica").fontSize(10).fillColor(bleuProforma);
    doc.text("Suite des articles", 36, 170);
    donnees.lignes.slice(nombreLignes).forEach((ligne, index) => {
      const y = 195 + index * 18;
      doc.fillColor("#1a365d").font("Helvetica").fontSize(9);
      doc.text(`${ligne.quantite}  ${ligne.designation}    ${formaterMontant(ligne.prixTotal)}`, 36, y, {
        width: 523,
      });
    });
  }

  if (payee) {
    doc.save();
    doc.rotate(-18, { origin: [430, 620] });
    doc.lineWidth(3).strokeColor("#059669");
    doc.roundedRect(360, 590, 150, 46, 6).stroke();
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#059669");
    doc.text("PAYÉ", 360, 602, { width: 150, align: "center" });
    doc.restore();
  }

  doc.font("Helvetica-Oblique").fontSize(11).fillColor(bleuProforma);
  doc.text(infos.merci, 36, 780, { width: 523, align: "center" });
}

export async function genererProformaPdf(donnees: DonneesProforma): Promise<Buffer> {
  const infos = await obtenirInfosEntreprise();
  return finaliserPdf((doc) => dessinerPageFacture(doc, donnees, infos));
}

export async function genererFacturesGroupeesPdf(factures: DonneesProforma[]): Promise<Buffer> {
  const infos = await obtenirInfosEntreprise();
  return finaliserPdf((doc) => {
    factures.forEach((donnees, index) => {
      if (index > 0) doc.addPage();
      dessinerPageFacture(doc, donnees, infos);
    });
  });
}
