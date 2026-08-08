import type { DocumentSlice } from '@/shared/utils/documentSlice';

/**
 * Extract plain text from uploaded text-based lesson files (PDF, EPUB, TXT)
 * and split it into clean sentences for display.
 */

export async function extractTextFromFile(
  file: File,
  slice?: DocumentSlice,
): Promise<string> {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith('.pdf') || file.type === 'application/pdf';
  const isEpub = name.endsWith('.epub') || file.type === 'application/epub+zip';

  if (isPdf) return extractPdfText(
    file,
    slice?.kind === 'pdf-pages' ? slice : undefined,
  );
  if (isEpub) return extractEpubText(
    file,
    slice?.kind === 'epub-spine' ? slice : undefined,
  );
  return file.text();
}

async function extractPdfText(
  file: File,
  slice?: Extract<DocumentSlice, { kind: 'pdf-pages' }>,
): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const arrayBuffer = await file.arrayBuffer();
  // Use the bundled worker via a blob URL so it works in Vite without extra config
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  const startPage = Math.max(1, slice?.startPage ?? 1);
  const endPage = Math.min(pdf.numPages, slice?.endPage ?? pdf.numPages);
  for (let i = startPage; i <= endPage; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }
  return pages.join('\n\n');
}

interface EpubSectionLike {
  linear?: boolean;
  href?: string;
  document?: Document;
  contents?: Element;
  load: (loader: Function) => Promise<Document | Element>;
  unload: () => void;
}

function normalizeEpubWhitespace(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getEpubSectionRoot(
  loaded: Document | Element,
  section: EpubSectionLike,
): Element | null {
  if (loaded instanceof Document) {
    return loaded.body ?? loaded.documentElement;
  }

  if (loaded instanceof Element) {
    return loaded;
  }

  return (
    section.document?.body ??
    section.document?.documentElement ??
    section.contents ??
    null
  );
}

function findEpubFragmentElement(root: Element, fragment: string): Element | null {
  const doc = root.ownerDocument;
  const byId = doc?.getElementById(fragment) ?? null;
  if (byId && root.contains(byId)) return byId;

  return (
    Array.from(root.querySelectorAll('[name]')).find(
      (element) => element.getAttribute('name') === fragment,
    ) ?? null
  );
}

function sliceEpubRoot(
  root: Element,
  startFragment?: string,
  endFragment?: string,
): Element {
  if (!startFragment && !endFragment) return root;

  const doc = root.ownerDocument;
  if (!doc) return root;

  const startElement = startFragment
    ? findEpubFragmentElement(root, startFragment)
    : null;
  const endElement = endFragment
    ? findEpubFragmentElement(root, endFragment)
    : null;

  try {
    const range = doc.createRange();
    range.selectNodeContents(root);
    if (startElement) range.setStartBefore(startElement);
    if (endElement) range.setEndBefore(endElement);

    const wrapper = doc.createElement('div');
    wrapper.append(range.cloneContents());
    return wrapper;
  } catch {
    return root;
  }
}

function extractReadableEpubText(root: Element): string {
  const clone = root.cloneNode(true) as Element;
  clone
    .querySelectorAll('script, style, noscript, svg')
    .forEach((element) => element.remove());

  const blockSelector =
    'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, pre';

  const blocks = Array.from(clone.querySelectorAll(blockSelector))
    .filter((element) => {
      const parentBlock = element.parentElement?.closest(blockSelector);
      return parentBlock === null || parentBlock === undefined;
    })
    .map((element) => normalizeEpubWhitespace(element.textContent ?? ''))
    .filter(Boolean);

  if (blocks.length > 0) {
    return blocks.join('\n\n');
  }

  return normalizeEpubWhitespace(clone.textContent ?? '');
}

async function extractEpubText(
  file: File,
  slice?: Extract<DocumentSlice, { kind: 'epub-spine' }>,
): Promise<string> {
  const epubjs = await import('epubjs');
  const book = epubjs.default(await file.arrayBuffer());
  const sections: EpubSectionLike[] = [];

  try {
    await book.ready;

    // epub.js stores readable chapters in Spine.spineItems. The public each()
    // method iterates those Section objects without relying on missing typings.
    book.spine.each((section: EpubSectionLike) => {
      if (section.linear !== false) sections.push(section);
    });

    const parts: string[] = [];

    const startIndex = Math.max(0, slice?.startIndex ?? 0);
    const endIndex = Math.min(
      sections.length - 1,
      slice?.endIndex ?? sections.length - 1,
    );

    for (let index = startIndex; index <= endIndex; index += 1) {
      const section = sections[index];
      if (!section) continue;

      try {
        // At runtime epub.js Section.load() resolves to the section's root
        // Element (its `contents`), not necessarily a Document.
        const loaded = await section.load(book.load.bind(book));
        const root = getEpubSectionRoot(loaded, section);

        if (!root) {
          continue;
        }

        const slicedRoot = sliceEpubRoot(
          root,
          index === startIndex ? slice?.startFragment : undefined,
          index === endIndex ? slice?.endFragment : undefined,
        );
        const text = extractReadableEpubText(slicedRoot);
        if (text) {
          parts.push(text);
        }
      } catch (error) {
        console.warn(
          `Could not extract EPUB section ${section.href ?? ''}:`,
          error,
        );
      } finally {
        section.unload();
      }
    }

    return parts.join('\n\n');
  } finally {
    book.destroy();
  }
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
