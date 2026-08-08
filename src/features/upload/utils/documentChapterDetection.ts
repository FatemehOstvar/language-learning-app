import type {
  BatchBookDraft,
  BatchBookSource,
  BatchChapterDraft,
} from '@/features/upload/model/types';
import { getDocumentType, getFileTitle } from '@/features/upload/utils/fileUtils';
import type { DocumentSlice } from '@/shared/utils/documentSlice';

function makeId(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

interface DetectedChapter {
  title: string;
  slice: DocumentSlice;
}

interface DetectionResult {
  chapters: DetectedChapter[];
  source: BatchBookSource;
}

function cleanTitle(value: string, fallback: string): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}

function dedupeStarts<T extends { start: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.start)) return false;
    seen.add(item.start);
    return true;
  });
}

async function detectPdfChapters(file: File): Promise<DetectionResult> {
  const pdfjs = await import('pdfjs-dist');
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const totalPages = pdf.numPages;
  const outline = await pdf.getOutline();

  type OutlineItem = {
    title?: string;
    dest?: string | unknown[] | null;
    items?: OutlineItem[];
  };

  async function resolvePage(item: OutlineItem): Promise<number | null> {
    try {
      let destination = item.dest;
      if (typeof destination === 'string') {
        destination = await pdf.getDestination(destination);
      }
      if (!Array.isArray(destination) || destination.length === 0) return null;

      const ref = destination[0] as { num?: number; gen?: number } | number;
      if (typeof ref === 'number') {
        return Math.max(1, Math.min(totalPages, ref + 1));
      }

      const pageIndex = await pdf.getPageIndex(ref);
      return pageIndex + 1;
    } catch {
      return null;
    }
  }

  async function resolveLevel(items: OutlineItem[]): Promise<Array<{ title: string; start: number }>> {
    const resolved = await Promise.all(
      items.map(async (item, index) => {
        const start = await resolvePage(item);
        if (start === null) return null;
        return {
          title: cleanTitle(item.title ?? '', `Chapter ${index + 1}`),
          start,
        };
      }),
    );

    return dedupeStarts(
      resolved
        .filter((item): item is { title: string; start: number } => Boolean(item))
        .sort((a, b) => a.start - b.start),
    );
  }

  async function collectLeaves(items: OutlineItem[]): Promise<OutlineItem[]> {
    const leaves: OutlineItem[] = [];
    for (const item of items) {
      if (item.items && item.items.length > 0) {
        leaves.push(...(await collectLeaves(item.items)));
      } else {
        leaves.push(item);
      }
    }
    return leaves;
  }

  let starts: Array<{ title: string; start: number }> = [];
  let detectedBy: BatchBookSource['detectedBy'] = 'pdf-manual';

  if (outline && outline.length > 0) {
    const topLevel = await resolveLevel(outline as OutlineItem[]);
    if (topLevel.length >= 2) {
      starts = topLevel;
    } else {
      const leaves = await collectLeaves(outline as OutlineItem[]);
      const leafLevel = await resolveLevel(leaves);
      starts = leafLevel.length >= 2 ? leafLevel : topLevel;
    }

    if (starts.length >= 2) detectedBy = 'pdf-outline';
  }

  if (starts.length < 2) {
    const headingStarts: Array<{ title: string; start: number }> = [];
    const seenHeadingLabels = new Set<string>();
    const chapterHeading = /^(?:chapter|kapitel|part|teil|book|buch)\s+(?:\d+|[ivxlcdm]+)(?:\b|[.:\-–—])/i;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines = new Map<number, Array<{ x: number; text: string }>>();

      for (const item of content.items) {
        if (!(item && typeof item === 'object' && 'str' in item)) continue;
        const text = String(item.str ?? '').replace(/\s+/g, ' ').trim();
        if (!text) continue;
        const transform = 'transform' in item && Array.isArray(item.transform)
          ? item.transform
          : null;
        const x = transform ? Number(transform[4] ?? 0) : 0;
        const y = transform ? Math.round(Number(transform[5] ?? 0) / 3) * 3 : 0;
        lines.set(y, [...(lines.get(y) ?? []), { x, text }]);
      }

      const topLines = Array.from(lines.entries())
        .sort(([a], [b]) => b - a)
        .slice(0, 8)
        .map(([, parts]) =>
          parts
            .sort((a, b) => a.x - b.x)
            .map((part) => part.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
        )
        .filter(Boolean);

      const headingIndex = topLines.findIndex((line) => chapterHeading.test(line));
      if (headingIndex !== -1) {
        const heading = topLines[headingIndex];
        const headingKey = heading.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
        if (!seenHeadingLabels.has(headingKey)) {
          seenHeadingLabels.add(headingKey);
          const nextLine = topLines[headingIndex + 1] ?? '';
          const title =
            heading.length < 36 && nextLine && nextLine.length < 72
              ? `${heading}: ${nextLine}`
              : heading;
          headingStarts.push({
            title: cleanTitle(title, `Chapter ${headingStarts.length + 1}`),
            start: pageNumber,
          });
        }
      }

      page.cleanup?.();
    }

    const dedupedHeadings = dedupeStarts(headingStarts);
    if (dedupedHeadings.length >= 2) {
      starts = dedupedHeadings;
      detectedBy = 'pdf-headings';
    }
  }

  if (starts.length < 2 && detectedBy === 'pdf-manual') {
    starts = [{ title: getFileTitle(file.name), start: 1 }];
  }

  const chapters = starts.map((item, index) => ({
    title: item.title,
    slice: {
      kind: 'pdf-pages' as const,
      startPage: item.start,
      endPage: (starts[index + 1]?.start ?? totalPages + 1) - 1,
    },
  }));

  return {
    chapters,
    source: {
      file,
      type: 'pdf',
      unitCount: totalPages,
      detectedBy,
    },
  };
}

function normalizeHref(value: string): string {
  const raw = value.split('#')[0] ?? '';
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Keep the original href if it contains malformed percent escapes.
  }

  const parts: string[] = [];
  for (const part of decoded.replace(/^\/+/, '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join('/');
}

function hrefMatches(sectionHref: string, tocHref: string): boolean {
  const section = normalizeHref(sectionHref);
  const toc = normalizeHref(tocHref);
  return section === toc || section.endsWith(`/${toc}`) || toc.endsWith(`/${section}`);
}

async function detectEpubChapters(file: File): Promise<DetectionResult> {
  const epubjs = await import('epubjs');
  const book = epubjs.default(await file.arrayBuffer());

  type SpineItem = { href?: string; linear?: boolean };
  type TocItem = { label?: string; href?: string; subitems?: TocItem[] };
  type EpubStart = {
    title: string;
    start: number;
    fragment: string | undefined;
    order: number;
  };

  try {
    await book.ready;

    const sections: SpineItem[] = [];
    book.spine.each((section: SpineItem) => {
      if (section.linear !== false) sections.push(section);
    });

    if (sections.length === 0) {
      throw new Error('No readable EPUB sections were found.');
    }

    const navigation = await book.loaded.navigation;
    const toc = (navigation?.toc ?? []) as TocItem[];

    const parseHref = (href: string | undefined) => {
      const [path = '', rawFragment] = (href ?? '').split('#');
      let fragment: string | undefined;
      if (rawFragment) {
        try {
          fragment = decodeURIComponent(rawFragment);
        } catch {
          fragment = rawFragment;
        }
      }
      return { path, fragment };
    };

    const sectionIndexForHref = (href: string | undefined): number | null => {
      if (!href) return null;
      const { path } = parseHref(href);
      const index = sections.findIndex((section) =>
        section.href ? hrefMatches(section.href, path) : false,
      );
      return index >= 0 ? index : null;
    };

    function collectLevels(items: TocItem[], depth = 0, levels: TocItem[][] = []): TocItem[][] {
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(...items);
      for (const item of items) {
        if (item.subitems?.length) collectLevels(item.subitems, depth + 1, levels);
      }
      return levels;
    }

    const mapItems = (items: TocItem[]): EpubStart[] => {
      const mapped = items
        .map((item, order) => {
          const start = sectionIndexForHref(item.href);
          if (start === null) return null;
          const { fragment } = parseHref(item.href);
          return {
            title: cleanTitle(item.label ?? '', `Chapter ${order + 1}`),
            start,
            fragment,
            order,
          };
        })
        .filter((item): item is EpubStart => Boolean(item))
        .sort((a, b) => a.start - b.start || a.order - b.order);

      const seen = new Set<string>();
      return mapped.filter((item) => {
        const key = `${item.start}#${item.fragment ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const mappedLevels = collectLevels(toc)
      .map((items) => mapItems(items))
      .filter((items) => items.length >= 2);
    const partLike = /^(?:part|teil|book|buch)\b/i;
    const chapterLike = /^(?:chapter|kapitel)\b/i;

    let starts: EpubStart[] = [];
    const chapterLevel = mappedLevels.find(
      (items) =>
        items.filter((item) => chapterLike.test(item.title)).length >=
        Math.max(1, Math.ceil(items.length / 2)),
    );

    if (chapterLevel) {
      starts = chapterLevel;
    } else {
      starts =
        mappedLevels.find(
          (items, index) =>
            index === mappedLevels.length - 1 ||
            items.filter((item) => partLike.test(item.title)).length <
              Math.ceil(items.length / 2),
        ) ?? [];
    }

    let detectedBy: BatchBookSource['detectedBy'] = 'epub-toc';

    if (starts.length < 2) {
      detectedBy = 'epub-spine';
      starts = sections.map((section, index) => ({
        title: cleanTitle(
          getFileTitle((section.href ?? '').split('/').pop() ?? ''),
          `Chapter ${index + 1}`,
        ),
        start: index,
        fragment: undefined,
        order: index,
      }));
    }

    const chapters = starts.map((item, index) => {
      const next = starts[index + 1];
      const nextInSameSection = Boolean(next && next.start === item.start);
      return {
        title: item.title,
        slice: {
          kind: 'epub-spine' as const,
          startIndex: item.start,
          endIndex: next
            ? nextInSameSection
              ? item.start
              : Math.max(item.start, next.start - 1)
            : sections.length - 1,
          startFragment: item.fragment,
          endFragment: nextInSameSection ? next?.fragment : undefined,
        },
      };
    });

    return {
      chapters,
      source: {
        file,
        type: 'epub',
        unitCount: sections.length,
        detectedBy,
      },
    };
  } finally {
    book.destroy();
  }
}

export async function detectDocumentChapters(file: File): Promise<DetectionResult> {
  const type = getDocumentType(file);
  return type === 'pdf' ? detectPdfChapters(file) : detectEpubChapters(file);
}

export async function createSingleDocumentBookDraft(
  file: File,
  title = getFileTitle(file.name),
): Promise<BatchBookDraft> {
  const detected = await detectDocumentChapters(file);
  const chapters: BatchChapterDraft[] = detected.chapters.map((chapter) => ({
    id: makeId('chapter'),
    title: chapter.title,
    file,
    slice: chapter.slice,
  }));

  return {
    id: makeId('book'),
    title,
    sourceKey: title.toLowerCase(),
    chapters,
    audioFiles: [],
    audioOffset: 0,
    sourceDocument: detected.source,
  };
}

export function applyPdfChapterStarts(
  book: BatchBookDraft,
  rawStarts: number[],
): BatchBookDraft {
  const source = book.sourceDocument;
  if (!source || source.type !== 'pdf') return book;

  const starts = Array.from(
    new Set(
      rawStarts
        .map((value) => Math.trunc(value))
        .filter((value) => value >= 1 && value <= source.unitCount),
    ),
  ).sort((a, b) => a - b);

  if (starts.length === 0) starts.push(1);

  const titleByStart = new Map<number, string>();
  for (const chapter of book.chapters) {
    if (chapter.slice?.kind === 'pdf-pages') {
      titleByStart.set(chapter.slice.startPage, chapter.title);
    }
  }

  const chapters: BatchChapterDraft[] = starts.map((startPage, index) => ({
    id: makeId('chapter'),
    title: titleByStart.get(startPage) ?? `Chapter ${index + 1}`,
    file: source.file,
    slice: {
      kind: 'pdf-pages',
      startPage,
      endPage: (starts[index + 1] ?? source.unitCount + 1) - 1,
    },
  }));

  return {
    ...book,
    chapters,
    sourceDocument: {
      ...source,
      detectedBy: 'pdf-manual',
    },
  };
}

