import { createWorker, type Worker } from 'tesseract.js';

export async function processImage(imageFile: File, _preprocess = false): Promise<string> {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();
  return text;
}

export async function tileImage(imageFile: File): Promise<Blob[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([imageFile]);

      const width = img.width;
      const height = img.height;
      const tileHeight = 1000;
      const overlap = 200;

      const tiles: Blob[] = [];
      let y = 0;

      const processTiles = async () => {
        while (y < height) {
          const currentTileHeight = Math.min(tileHeight, height - y);
          canvas.width = width;
          canvas.height = currentTileHeight;
          ctx.drawImage(img, 0, y, width, currentTileHeight, 0, 0, width, currentTileHeight);

          const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.9));
          if (blob) tiles.push(blob);

          y += (tileHeight - overlap);
          if (y >= height) break;
        }
        resolve(tiles);
      };
      processTiles();
    };
    img.src = URL.createObjectURL(imageFile);
  });
}

export async function preprocessAndOCR(imageBlob: Blob): Promise<{ text: string, confidence: number }> {
  const worker: Worker = await createWorker('eng');
  const result = await worker.recognize(imageBlob);
  await worker.terminate();
  return { text: result.data.text, confidence: result.data.confidence };
}
