export const SERIES_FOLDER_SEPARATOR = ' › ';

export interface ParsedFolderName {
  rawName: string;
  seriesName: string | null;
  displayName: string;
}

export function makeSeriesFolderName(
  seriesName: string,
  bookName: string,
): string {
  const series = seriesName.trim();
  const book = bookName.trim();
  return series ? `${series}${SERIES_FOLDER_SEPARATOR}${book}` : book;
}

export function parseFolderName(name: string): ParsedFolderName {
  const rawName = name.trim();
  const separatorIndex = rawName.indexOf(SERIES_FOLDER_SEPARATOR);

  if (separatorIndex <= 0) {
    return {
      rawName,
      seriesName: null,
      displayName: rawName,
    };
  }

  const seriesName = rawName.slice(0, separatorIndex).trim();
  const displayName = rawName
    .slice(separatorIndex + SERIES_FOLDER_SEPARATOR.length)
    .trim();

  if (!seriesName || !displayName) {
    return {
      rawName,
      seriesName: null,
      displayName: rawName,
    };
  }

  return {
    rawName,
    seriesName,
    displayName,
  };
}

export function getFolderDisplayName(name: string): string {
  return parseFolderName(name).displayName;
}

export function getFolderPathLabel(name: string): string {
  const parsed = parseFolderName(name);
  return parsed.seriesName
    ? `${parsed.seriesName} / ${parsed.displayName}`
    : parsed.displayName;
}
