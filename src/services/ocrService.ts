import { createWorker } from 'tesseract.js';

export async function processImage(imageFile: File): Promise<string> {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();
  return text;
}

export async function processImages(imageFiles: File[]): Promise<string[]> {
  const results: string[] = [];
  for (const file of imageFiles) {
    const text = await processImage(file);
    results.push(text);
  }
  return results;
}
