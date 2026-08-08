export type DocumentSlice =
  | {
      kind: 'pdf-pages';
      startPage: number;
      endPage: number;
    }
  | {
      kind: 'epub-spine';
      startIndex: number;
      endIndex: number;
      startFragment?: string;
      endFragment?: string;
    };

const PDF_PREFIX = 'll-pdf=';
const EPUB_PREFIX = 'll-epub=';

export function encodeDocumentSliceHash(slice: DocumentSlice | undefined): string {
  if (!slice) return '';

  if (slice.kind === 'pdf-pages') {
    return `#${PDF_PREFIX}${slice.startPage}-${slice.endPage}`;
  }

  const params = new URLSearchParams();
  if (slice.startFragment) params.set('s', slice.startFragment);
  if (slice.endFragment) params.set('e', slice.endFragment);
  const suffix = params.toString();
  return `#${EPUB_PREFIX}${slice.startIndex}-${slice.endIndex}${suffix ? `&${suffix}` : ''}`;
}

export function parseDocumentSliceFromUrl(url: string | null | undefined): DocumentSlice | undefined {
  if (!url) return undefined;

  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return undefined;

  const hash = url.slice(hashIndex + 1);

  if (hash.startsWith(PDF_PREFIX)) {
    const [rawStart, rawEnd] = hash.slice(PDF_PREFIX.length).split('-');
    const startPage = Number.parseInt(rawStart, 10);
    const endPage = Number.parseInt(rawEnd, 10);

    if (
      Number.isFinite(startPage) &&
      Number.isFinite(endPage) &&
      startPage >= 1 &&
      endPage >= startPage
    ) {
      return { kind: 'pdf-pages', startPage, endPage };
    }
  }

  if (hash.startsWith(EPUB_PREFIX)) {
    const [rangePart, ...paramParts] = hash.slice(EPUB_PREFIX.length).split('&');
    const [rawStart, rawEnd] = rangePart.split('-');
    const startIndex = Number.parseInt(rawStart, 10);
    const endIndex = Number.parseInt(rawEnd, 10);

    if (
      Number.isFinite(startIndex) &&
      Number.isFinite(endIndex) &&
      startIndex >= 0 &&
      endIndex >= startIndex
    ) {
      const params = new URLSearchParams(paramParts.join('&'));
      const startFragment = params.get('s')?.trim() || undefined;
      const endFragment = params.get('e')?.trim() || undefined;
      return {
        kind: 'epub-spine',
        startIndex,
        endIndex,
        startFragment,
        endFragment,
      };
    }
  }

  return undefined;
}

export function stripDocumentSliceFromUrl(url: string): string {
  const hashIndex = url.indexOf('#');
  return hashIndex === -1 ? url : url.slice(0, hashIndex);
}

export function formatDocumentSlice(slice: DocumentSlice | undefined): string | null {
  if (!slice) return null;

  if (slice.kind === 'pdf-pages') {
    return slice.startPage === slice.endPage
      ? `p. ${slice.startPage}`
      : `pp. ${slice.startPage}–${slice.endPage}`;
  }

  const start = slice.startIndex + 1;
  const end = slice.endIndex + 1;
  return start === end ? `section ${start}` : `sections ${start}–${end}`;
}
