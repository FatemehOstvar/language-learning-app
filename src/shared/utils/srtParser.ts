export interface SrtCue {
  index: number;
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
}

function timeToSeconds(time: string): number {
  // Format: HH:MM:SS,mmm
  const [hms, ms] = time.split(',');
  const [h, m, s] = hms.split(':').map(Number);
  return h * 3600 + m * 60 + s + Number(ms) / 1000;
}

export function parseSrt(content: string): SrtCue[] {
  const cues: SrtCue[] = [];
  // Normalize line endings and split into blocks
  const blocks = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    const index = parseInt(lines[0].trim(), 10);
    if (isNaN(index)) continue;

    const timeLine = lines[1].trim();
    const arrowIdx = timeLine.indexOf('-->');
    if (arrowIdx === -1) continue;

    const startRaw = timeLine.slice(0, arrowIdx).trim();
    const endRaw = timeLine.slice(arrowIdx + 3).trim();
    const startTime = timeToSeconds(startRaw);
    const endTime = timeToSeconds(endRaw);

    const text = lines.slice(2).join(' ').trim();

    cues.push({ index, startTime, endTime, text });
  }

  return cues;
}
