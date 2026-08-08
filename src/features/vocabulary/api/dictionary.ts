export interface DictionaryDefinition {
  partOfSpeech: string | null;
  text: string;
}

export interface DictionaryLookupResult {
  word: string;
  sourceLanguage: string;
  definitionLanguage: string;
  definitions: DictionaryDefinition[];
  sourceUrl: string;
}

interface WiktionaryDefinitionItem {
  definition?: string;
}

interface WiktionaryPartOfSpeech {
  partOfSpeech?: string;
  definitions?: WiktionaryDefinitionItem[];
}

type WiktionaryResponse = Record<string, WiktionaryPartOfSpeech[]>;

const dictionaryCache = new Map<string, DictionaryLookupResult>();


function htmlToText(value: string): string {
  if (typeof document !== 'undefined') {
    const element = document.createElement('div');
    element.innerHTML = value;
    return (element.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDefinitions(
  entries: WiktionaryPartOfSpeech[],
): DictionaryDefinition[] {
  const seen = new Set<string>();
  const definitions: DictionaryDefinition[] = [];

  for (const entry of entries) {
    for (const item of entry.definitions || []) {
      if (!item.definition) continue;

      const text = htmlToText(item.definition);
      const fingerprint = text.toLocaleLowerCase();

      if (!text || seen.has(fingerprint)) continue;

      seen.add(fingerprint);
      definitions.push({
        partOfSpeech: entry.partOfSpeech || null,
        text,
      });

      if (definitions.length >= 3) break;
    }

    if (definitions.length >= 3) break;
  }

  return definitions;
}

export async function lookupWordDefinition({
  word,
  sourceLanguage,
  definitionLanguage,
  signal,
}: {
  word: string;
  sourceLanguage: string;
  definitionLanguage: string;
  signal?: AbortSignal;
}): Promise<DictionaryLookupResult> {
  const cacheKey = `${definitionLanguage}:${sourceLanguage}:${word}`;
  const cached = dictionaryCache.get(cacheKey);
  if (cached) return cached;

  const lowerWord = word.toLocaleLowerCase(sourceLanguage);
  const candidates = Array.from(new Set([word, lowerWord]));
  let lastSourceUrl = `https://${definitionLanguage}.wiktionary.org/wiki/${encodeURIComponent(word)}`;

  for (const candidate of candidates) {
    const encodedWord = encodeURIComponent(candidate);
    const endpoint = `https://${definitionLanguage}.wiktionary.org/api/rest_v1/page/definition/${encodedWord}?redirect=true&origin=*`;
    const sourceUrl = `https://${definitionLanguage}.wiktionary.org/wiki/${encodedWord}`;
    lastSourceUrl = sourceUrl;

    const response = await fetch(endpoint, {
      signal,
      headers: {
        'Api-User-Agent': 'LanguageLearningApp/0.1 (word popup dictionary)',
      },
    });

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      throw new Error(`Dictionary lookup failed (${response.status}).`);
    }

    const data = (await response.json()) as WiktionaryResponse;
    const definitions = extractDefinitions(data[sourceLanguage] || []);

    if (definitions.length > 0) {
      const result = {
        word: candidate,
        sourceLanguage,
        definitionLanguage,
        definitions,
        sourceUrl,
      };
      dictionaryCache.set(cacheKey, result);
      return result;
    }
  }

  const result = {
    word,
    sourceLanguage,
    definitionLanguage,
    definitions: [],
    sourceUrl: lastSourceUrl,
  };
  dictionaryCache.set(cacheKey, result);
  return result;
}
