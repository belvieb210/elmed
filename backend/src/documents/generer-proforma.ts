import PDFDocument from "pdfkit";
import { bleuFiligrane, bleuProforma, infosElmed } from "./infos-elmed";

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
  lignes: LigneProforma[];
  montantTotal: number;
  titreDocument?: string;
};

function formaterMontant(montant: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(montant);
}

function dessinerMicroscope(doc: PDFKit.PDFDocument, x: number, y: number) {
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

function dessinerEntete(doc: PDFKit.PDFDocument, donnees: DonneesProforma) {
  doc.fillColor(bleuProforma).font("Helvetica-Bold").fontSize(26);
  doc.text(infosElmed.nom, 36, 38, { width: 200 });

  doc.font("Helvetica").fontSize(8);
  doc.text(infosElmed.activite1, 36, 70, { width: 220 });
  doc.text(infosElmed.activite2, 36, 81, { width: 220 });
  doc.text(`RCCM : ${infosElmed.rccm}`, 36, 96, { width: 240 });
  doc.text(`Id. Nat. ${infosElmed.idNational}`, 36, 107, { width: 240 });
  doc.text(infosElmed.adresse, 36, 122, { width: 240 });
  doc.text(`Tél. : ${infosElmed.telephone}`, 36, 133, { width: 240 });

  dessinerMicroscope(doc, 268, 42);

  doc.font("Helvetica").fontSize(10);
  doc.text(`Kin , le ${donnees.dateTexte}`, 360, 42, { width: 200, align: "right" });

  doc.roundedRect(430, 64, 130, 28, 2).fill(bleuProforma);
  doc.fillColor("white").font("Helvetica-Bold").fontSize(14);
  doc.text(donnees.titreDocument ?? "PROFORMA", 430, 71, { width: 130, align: "center" });

  doc.fillColor(bleuProforma).font("Helvetica").fontSize(11);
  doc.text(`N° ${donnees.numero}`, 360, 100, { width: 200, align: "right" });
}

export function genererProformaPdf(donnees: DonneesProforma): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const morceaux: Buffer[] = [];
    doc.on("data", (morceau: Buffer) => morceaux.push(morceau));
    doc.on("end", () => resolve(Buffer.concat(morceaux)));
    doc.on("error", reject);

    dessinerEntete(doc, donnees);

    doc.fillColor(bleuProforma).font("Helvetica").fontSize(11);
    doc.text(`Client (e)  ${donnees.nomClient}`, 36, 165, { width: 523 });
    doc.moveTo(108, 178).lineTo(559, 178).strokeColor(bleuProforma).lineWidth(0.6).stroke();

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
    const yTotal = yDepart + hauteurEntete + nombreLignes * hauteurLigne;
    const yBas = yTotal + 24;

    doc.save();
    doc.fillColor(bleuFiligrane).opacity(0.22);
    doc.rotate(-28, { origin: [297, 480] });
    doc.font("Helvetica-Bold").fontSize(72);
    doc.text("ELMED", 80, 430, { width: 430, align: "center" });
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

    largeurs.slice(0, 3).reduce((abscisse, largeur) => {
      const suivante = abscisse + largeur;
      doc.moveTo(suivante, yDepart).lineTo(suivante, yBas).stroke();
      return suivante;
    }, x);

    doc.moveTo(x, yTotal).lineTo(x + largeurTable, yTotal).stroke();
    doc.font("Helvetica-Bold").fontSize(11).fillColor(bleuProforma);
    doc.text("TOTAL GENERAL  →", x + 8, yTotal + 7, { width: largeurs[0] + largeurs[1] + largeurs[2] - 16, align: "right" });
    doc.text(formaterMontant(donnees.montantTotal), colonnes[3] + 4, yTotal + 7, {
      width: largeurs[3] - 8,
      align: "right",
    });

    if (donnees.lignes.length > nombreLignes) {
      doc.addPage();
      dessinerEntete(doc, donnees);
      doc.font("Helvetica").fontSize(10).fillColor(bleuProforma);
      doc.text("Suite des articles", 36, 170);
      donnees.lignes.slice(nombreLignes).forEach((ligne, index) => {
        const y = 195 + index * 18;
        doc.fillColor("#1a365d").font("Helvetica").fontSize(9);
        doc.text(`${ligne.quantite}  ${ligne.designation}    ${formaterMontant(ligne.prixTotal)}`, 36, y, { width: 523 });
      });
    }

    doc.font("Helvetica-Oblique").fontSize(11).fillColor(bleuProforma);
    doc.text(infosElmed.merci, 36, 780, { width: 523, align: "center" });

    doc.end();
  });
}
