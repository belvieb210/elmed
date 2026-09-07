/** Couleurs de fond typiques du bandeau accueil (à rendre transparentes). */
const BLEUS_BANDEAU = [
  { r: 79, g: 116, b: 255 }, // #4f74ff
  { r: 91, g: 99, b: 245 }, // #5b63f5
  { r: 37, g: 65, b: 183 }, // bleu maquette
  { r: 61, g: 90, b: 254 },
  { r: 70, g: 100, b: 230 },
];

function estBlancOuGrisClair(r: number, g: number, b: number, a: number) {
  if (a < 20) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max >= 232 && max - min <= 28;
}

function estBleuBandeau(r: number, g: number, b: number, a: number) {
  if (a < 20) return true;
  return BLEUS_BANDEAU.some((bleu) => {
    const dr = r - bleu.r;
    const dg = g - bleu.g;
    const db = b - bleu.b;
    return dr * dr + dg * dg + db * db <= 55 * 55;
  });
}

function estFondARetirer(r: number, g: number, b: number, a: number) {
  return estBlancOuGrisClair(r, g, b, a) || estBleuBandeau(r, g, b, a);
}

/**
 * Retire le fond uni (blanc / bleu bandeau) connecté aux bords,
 * pour que le produit se pose sur le bleu du hero.
 */
export function retirerFondImageCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const total = width * height;
  const visite = new Uint8Array(total);
  const file: number[] = [];

  const pousserSiFond = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (visite[i]) return;
    const o = i * 4;
    if (!estFondARetirer(data[o], data[o + 1], data[o + 2], data[o + 3])) return;
    visite[i] = 1;
    file.push(i);
  };

  for (let x = 0; x < width; x += 1) {
    pousserSiFond(x, 0);
    pousserSiFond(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    pousserSiFond(0, y);
    pousserSiFond(width - 1, y);
  }

  while (file.length) {
    const i = file.pop()!;
    const o = i * 4;
    data[o + 3] = 0;
    const x = i % width;
    const y = (i - x) / width;
    pousserSiFond(x + 1, y);
    pousserSiFond(x - 1, y);
    pousserSiFond(x, y + 1);
    pousserSiFond(x, y - 1);
  }

  ctx.putImageData(imageData, 0, 0);
}

/** Redimensionne + retire le fond pour une image d’accueil hero. */
export function preparerImageAccueilFichier(
  fichier: File,
  maxCote = 1000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error("Lecture image impossible."));
    lecteur.onload = () => {
      const dataUrl = lecteur.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("Lecture image impossible."));
        return;
      }

      const image = new Image();
      image.onload = () => {
        const ratio = Math.min(1, maxCote / Math.max(image.width, image.height));
        const largeur = Math.max(1, Math.round(image.width * ratio));
        const hauteur = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = largeur;
        canvas.height = hauteur;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(image, 0, 0, largeur, hauteur);
        try {
          retirerFondImageCanvas(canvas);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(dataUrl);
        }
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    };
    lecteur.readAsDataURL(fichier);
  });
}
