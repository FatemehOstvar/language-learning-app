export interface GermanMorphologyAnalysis {
  label: string;
  lemma: string | null;
  features: string[];
}

export interface GermanMorphologyDetail {
  label: string;
  value: string;
}

export interface GermanMorphologyResult {
  word: string;
  partOfSpeech: string | null;
  lemma: string | null;
  details: GermanMorphologyDetail[];
  analyses: GermanMorphologyAnalysis[];
  sourceUrl: string;
}

interface MediaWikiParseResponse {
  parse?: {
    title?: string;
    text?: {
      '*': string;
    };
  };
  error?: {
    code?: string;
    info?: string;
  };
}

const morphologyCache = new Map<string, GermanMorphologyResult>();

const BASE_FORM_HEADINGS = [
  'Substantiv',
  'Verb',
  'Adjektiv',
  'Adverb',
  'Pronomen',
  'Artikel',
  'Numerale',
  'Präposition',
  'Konjunktion',
  'Interjektion',
];

const INFLECTED_FORM_HEADINGS = [
  'Deklinierte Form',
  'Konjugierte Form',
  'Partizip I',
  'Partizip II',
  'Komparativ',
  'Superlativ',
];

function normalizeText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function headingText(element: Element): string {
  return normalizeText(element.textContent).replace(/\[Bearbeiten\]$/i, '').trim();
}

function isBaseFormHeading(value: string): boolean {
  return BASE_FORM_HEADINGS.some(
    (heading) => value === heading || value.startsWith(`${heading},`),
  );
}

function isInflectedHeading(value: string): boolean {
  return INFLECTED_FORM_HEADINGS.some(
    (heading) => value === heading || value.startsWith(`${heading},`),
  );
}

function germanSectionNodes(documentNode: Document): Element[] {
  // MediaWiki may wrap headings in layout divs. Selecting the semantic
  // elements directly keeps the parser independent of those wrappers.
  const elements = Array.from(
    documentNode.querySelectorAll('h2, h3, p, ul, table'),
  );
  const startIndex = elements.findIndex((element) => {
    if (element.tagName.toLowerCase() !== 'h2') return false;

    const text = headingText(element);
    return text.includes('(Deutsch)') || element.id === 'Deutsch';
  });

  if (startIndex < 0) return [];

  const nodes: Element[] = [];

  for (let index = startIndex + 1; index < elements.length; index += 1) {
    const element = elements[index];
    if (element.tagName.toLowerCase() === 'h2') break;
    nodes.push(element);
  }

  return nodes;
}

function extractLemmaFromElement(element: Element): string | null {
  const text = normalizeText(element.textContent);
  if (!text) return null;

  if (
    !text.includes('flektierte Form von') &&
    !/des (Substantivs|Verbs|Adjektivs)/i.test(text)
  ) {
    return null;
  }

  const links = Array.from(element.querySelectorAll('a'))
    .map((link) => normalizeText(link.textContent))
    .filter(Boolean);

  if (links.length > 0) {
    const candidate = links[links.length - 1];
    if (!candidate.includes('Flexion:')) return candidate;
  }

  const fromInflectedSentence = text.match(
    /flektierte Form von\s+([^.,;]+)/i,
  );
  if (fromInflectedSentence?.[1]) {
    return normalizeText(fromInflectedSentence[1]);
  }

  const fromFeature = text.match(
    /des (?:Substantivs|Verbs|Adjektivs)\s+([^.,;]+)/i,
  );
  return fromFeature?.[1] ? normalizeText(fromFeature[1]) : null;
}

function collectInflectedAnalyses(nodes: Element[]): GermanMorphologyAnalysis[] {
  const analyses: GermanMorphologyAnalysis[] = [];
  let currentHeading = '';
  let currentFeatures: string[] = [];
  let currentLemma: string | null = null;
  let awaitingGrammarList = false;

  const flush = () => {
    if (currentHeading && currentFeatures.length > 0) {
      analyses.push({
        label: currentHeading,
        lemma: currentLemma,
        features: Array.from(new Set(currentFeatures)).slice(0, 8),
      });
    }

    currentFeatures = [];
    currentLemma = null;
    awaitingGrammarList = false;
  };

  for (const node of nodes) {
    if (node.tagName.toLowerCase() === 'h3') {
      flush();
      const nextHeading = headingText(node);
      currentHeading = isInflectedHeading(nextHeading) ? nextHeading : '';
      continue;
    }

    if (!currentHeading) continue;

    const nodeText = normalizeText(node.textContent);
    const lemma = extractLemmaFromElement(node);
    if (lemma) currentLemma = lemma;

    if (nodeText.includes('Grammatische Merkmale')) {
      awaitingGrammarList = true;
      continue;
    }

    if (awaitingGrammarList && node.tagName.toLowerCase() === 'ul') {
      const items = Array.from(node.querySelectorAll(':scope > li'));
      for (const item of items) {
        const feature = normalizeText(item.textContent);
        if (!feature) continue;
        currentFeatures.push(feature);

        if (!currentLemma) {
          currentLemma = extractLemmaFromElement(item);
        }
      }
      awaitingGrammarList = false;
    }
  }

  flush();
  return analyses;
}

function collectRows(table: Element): string[][] {
  return Array.from(table.querySelectorAll('tr'))
    .map((row) =>
      Array.from(row.querySelectorAll(':scope > th, :scope > td'))
        .map((cell) => normalizeText(cell.textContent))
        .filter(Boolean),
    )
    .filter((row) => row.length > 0);
}

function findFirstTableAfter(
  nodes: Element[],
  headingIndex: number,
): Element | null {
  for (let index = headingIndex + 1; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (/^h[23]$/i.test(node.tagName)) return null;

    if (node.tagName.toLowerCase() === 'table') return node;
    const nestedTable = node.querySelector('table');
    if (nestedTable) return nestedTable;
  }

  return null;
}

function nounDetails(heading: string, table: Element | null): GermanMorphologyDetail[] {
  const details: GermanMorphologyDetail[] = [];
  const genderMatch = heading.match(/Substantiv,\s*([mfn])(?:\b|,)/i);
  const gender = genderMatch?.[1]?.toLowerCase();

  if (gender) {
    const genderLabel =
      gender === 'm' ? 'masculine' : gender === 'f' ? 'feminine' : 'neuter';
    details.push({ label: 'Gender', value: genderLabel });
  }

  if (!table) return details;

  const rows = collectRows(table);
  const nominative = rows.find((row) => row[0]?.toLowerCase() === 'nominativ');

  if (nominative) {
    if (nominative[1]) {
      details.push({ label: 'Singular', value: nominative[1] });
    }
    if (nominative[2] && nominative[2] !== '—') {
      details.push({ label: 'Plural', value: nominative[2] });
    }
  }

  return details;
}

function adjectiveDetails(table: Element | null): GermanMorphologyDetail[] {
  if (!table) return [];

  const rows = collectRows(table);
  const headerIndex = rows.findIndex(
    (row) =>
      row.some((cell) => cell === 'Positiv') &&
      row.some((cell) => cell === 'Komparativ') &&
      row.some((cell) => cell === 'Superlativ'),
  );

  if (headerIndex < 0 || !rows[headerIndex + 1]) return [];

  const header = rows[headerIndex];
  const values = rows[headerIndex + 1];

  return header
    .map((label, index) => ({ label, value: values[index] || '' }))
    .filter((detail) => detail.value);
}

function verbDetails(nodes: Element[], headingIndex: number): GermanMorphologyDetail[] {
  const details: GermanMorphologyDetail[] = [];
  const sectionText: string[] = [];

  for (let index = headingIndex + 1; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (/^h[23]$/i.test(node.tagName)) break;
    sectionText.push(normalizeText(node.textContent));
  }

  const text = sectionText.join(' ');
  const patterns: Array<[string, RegExp]> = [
    ['Present', /Präsens[^:]*:\s*([^,;\s]+)/i],
    ['Preterite', /Präteritum:\s*([^,;\s]+)/i],
    ['Participle II', /Partizip II:\s*([^,;\s]+)/i],
  ];

  for (const [label, pattern] of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      details.push({ label, value: match[1] });
    }
  }

  const table = findFirstTableAfter(nodes, headingIndex);
  if (table) {
    const rows = collectRows(table);
    const present = rows.find((row) => row[0] === 'Präsens');
    if (present?.[present.length - 1]) {
      const value = present[present.length - 1];
      if (!details.some((detail) => detail.label === 'Present')) {
        details.push({ label: 'Present', value });
      }
    }

    const preterite = rows.find((row) => row[0] === 'Präteritum');
    if (preterite?.[preterite.length - 1]) {
      const value = preterite[preterite.length - 1];
      if (!details.some((detail) => detail.label === 'Preterite')) {
        details.push({ label: 'Preterite', value });
      }
    }

    const perfectIndex = rows.findIndex((row) => row[0] === 'Perfekt');
    if (perfectIndex >= 0 && rows[perfectIndex + 1]) {
      const values = rows[perfectIndex + 1];
      if (values[0]) {
        details.push({ label: 'Participle II', value: values[0] });
      }
      if (values[1]) {
        details.push({ label: 'Auxiliary', value: values[1] });
      }
    }
  }

  const seen = new Set<string>();
  return details.filter((detail) => {
    const key = `${detail.label}:${detail.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectBaseForm(
  nodes: Element[],
): {
  partOfSpeech: string | null;
  details: GermanMorphologyDetail[];
} {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.tagName.toLowerCase() !== 'h3') continue;

    const heading = headingText(node);
    if (!isBaseFormHeading(heading)) continue;

    const table = findFirstTableAfter(nodes, index);
    let details: GermanMorphologyDetail[] = [];

    if (heading.startsWith('Substantiv')) {
      details = nounDetails(heading, table);
    } else if (heading.startsWith('Adjektiv')) {
      details = adjectiveDetails(table);
    } else if (heading.startsWith('Verb')) {
      details = verbDetails(nodes, index);
    }

    return {
      partOfSpeech: heading,
      details,
    };
  }

  return { partOfSpeech: null, details: [] };
}

export function translateGermanMorphologyFeature(
  feature: string,
  language: string,
): string {
  if (language !== 'en') return feature;

  const replacements: Array<[RegExp, string]> = [
    [/Nominativ/gi, 'nominative'],
    [/Genitiv/gi, 'genitive'],
    [/Dativ/gi, 'dative'],
    [/Akkusativ/gi, 'accusative'],
    [/Singular/gi, 'singular'],
    [/Plural/gi, 'plural'],
    [/Maskulinum/gi, 'masculine'],
    [/Femininum/gi, 'feminine'],
    [/Neutrum/gi, 'neuter'],
    [/alle Genera/gi, 'all genders'],
    [/starken Flexion/gi, 'strong declension'],
    [/schwachen Flexion/gi, 'weak declension'],
    [/gemischten Flexion/gi, 'mixed declension'],
    [/1\. Person/gi, '1st person'],
    [/2\. Person/gi, '2nd person'],
    [/3\. Person/gi, '3rd person'],
    [/Indikativ/gi, 'indicative'],
    [/Konjunktiv II/gi, 'subjunctive II'],
    [/Konjunktiv I/gi, 'subjunctive I'],
    [/Imperativ/gi, 'imperative'],
    [/Präsens/gi, 'present'],
    [/Präteritum/gi, 'preterite'],
    [/Partizip Perfekt/gi, 'past participle'],
    [/Partizip II/gi, 'past participle'],
    [/Aktiv/gi, 'active'],
    [/Positiv/gi, 'positive'],
    [/Komparativs/gi, 'comparative'],
    [/Komparativ/gi, 'comparative'],
    [/Superlativs/gi, 'superlative'],
    [/Superlativ/gi, 'superlative'],
    [/des Substantivs/gi, 'of noun'],
    [/des Verbs/gi, 'of verb'],
    [/des Adjektivs/gi, 'of adjective'],
    [/der /gi, 'of the '],
  ];

  return replacements.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    feature,
  );
}

export async function lookupGermanMorphology({
  word,
  signal,
}: {
  word: string;
  signal?: AbortSignal;
}): Promise<GermanMorphologyResult> {
  const cacheKey = word.trim();
  const cached = morphologyCache.get(cacheKey);
  if (cached) return cached;

  const encodedWord = encodeURIComponent(cacheKey);
  const sourceUrl = `https://de.wiktionary.org/wiki/${encodedWord}`;
  const endpoint =
    `https://de.wiktionary.org/w/api.php?origin=*&action=parse` +
    `&page=${encodedWord}&prop=text&format=json&redirects=1`;

  const response = await fetch(endpoint, {
    signal,
    headers: {
      'Api-User-Agent': 'LanguageLearningApp/0.2 (German morphology popup)',
    },
  });

  if (!response.ok) {
    throw new Error(`German morphology lookup failed (${response.status}).`);
  }

  const data = (await response.json()) as MediaWikiParseResponse;
  if (data.error || !data.parse?.text?.['*']) {
    const emptyResult: GermanMorphologyResult = {
      word: cacheKey,
      partOfSpeech: null,
      lemma: null,
      details: [],
      analyses: [],
      sourceUrl,
    };
    morphologyCache.set(cacheKey, emptyResult);
    return emptyResult;
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(data.parse.text['*'], 'text/html');
  const nodes = germanSectionNodes(documentNode);
  const baseForm = collectBaseForm(nodes);
  const analyses = baseForm.partOfSpeech ? [] : collectInflectedAnalyses(nodes);
  const lemma = analyses.find((analysis) => analysis.lemma)?.lemma || null;

  const result: GermanMorphologyResult = {
    word: data.parse.title || cacheKey,
    partOfSpeech: baseForm.partOfSpeech,
    lemma,
    details: baseForm.details,
    analyses,
    sourceUrl,
  };

  morphologyCache.set(cacheKey, result);
  return result;
}
