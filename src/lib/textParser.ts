/**
 * Extract plain text from uploaded text-based lesson files (PDF, EPUB, TXT)
 * and split it into clean sentences for display.
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith('.pdf') || file.type === 'application/pdf';
  const isEpub = name.endsWith('.epub') || file.type === 'application/epub+zip';

  if (isPdf) return extractPdfText(file);
  if (isEpub) return extractEpubText(file);
  return file.text();
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const arrayBuffer = await file.arrayBuffer();
  // Use the bundled worker via a blob URL so it works in Vite without extra config
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }
  return pages.join('\n\n');
}

async function extractEpubText(file: File): Promise<string> {
  const epubjs = await import('epubjs');
  const arrayBuffer = await file.arrayBuffer();
  const book = epubjs.default(arrayBuffer);
  await book.ready;
  const spineAny = book.spine as unknown as { items?: Array<{ load?: (loader: typeof book.load) => Promise<Document>; unload?: () => void }> };
  const items = spineAny.items || [];

  const parts: string[] = [];
  for (const item of items) {
    if (item.load) {
      const doc = await item.load(book.load.bind(book));
      const text = doc?.body?.textContent || '';
      if (text) parts.push(text);
      if (item.unload) item.unload();
    }
  }
  return parts.join('\n\n');
}

/**
 * Normalize raw extracted text: collapse whitespace, fix common extraction
 * artifacts, and split into sentences. Each returned sentence is a string
 * ending with its terminal punctuation.
 */
export function normalizeAndSplitSentences(raw: string): string[] {
  const cleaned = raw
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Split on sentence-ending punctuation followed by whitespace + capital,
  // or on double newlines (paragraph breaks). Keep the delimiter.
  const parts = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z\u00C0-\u017F])|(?<=\n)\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Ensure each sentence ends with a period for consistent highlighting
  return parts.map((s) => {
    if (/[.!?]$/.test(s)) return s;
    return s + '.';
  });
}
