import {
  Pause,
  Play,
  ScrollText,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { formatTime } from '@/lib/formatTime';

interface CompactAudioControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  disabled?: boolean;
  autoScroll?: boolean;
  onTogglePlay: () => void;
  onSkip: (seconds: number) => void;
  onSeek: (seconds: number) => void;
  onToggleAutoScroll?: () => void;
  className?: string;
}

const iconButton =
  'flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40';

export function CompactAudioControls({
  currentTime,
  duration,
  isPlaying,
  disabled = false,
  autoScroll,
  onTogglePlay,
  onSkip,
  onSeek,
  onToggleAutoScroll,
  className = '',
}: CompactAudioControlsProps) {
  const canSeek = !disabled && duration > 0;

  return (
    <div
      className={`flex h-8 items-center gap-0.5 rounded-lg border border-slate-200 bg-white/95 px-1 shadow-sm backdrop-blur ${className}`}
    >
      <button
        type="button"
        onClick={() => onSkip(-10)}
        disabled={disabled}
        aria-label="Go back 10 seconds"
        title="Back 10 seconds"
        className={iconButton}
      >
        <SkipBack className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onTogglePlay}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        className={iconButton}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="ml-px h-3.5 w-3.5" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onSkip(10)}
        disabled={disabled}
        aria-label="Go forward 10 seconds"
        title="Forward 10 seconds"
        className={iconButton}
      >
        <SkipForward className="h-3.5 w-3.5" />
      </button>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        disabled={!canSeek}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="Audio position"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        className="h-0.5 min-w-14 flex-1 cursor-pointer accent-slate-500 disabled:cursor-not-allowed"
      />

      <span className="hidden shrink-0 font-mono text-[9px] leading-none tabular-nums text-slate-400 sm:block">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {onToggleAutoScroll && (
        <button
          type="button"
          onClick={onToggleAutoScroll}
          aria-label="Toggle automatic scrolling"
          aria-pressed={autoScroll}
          title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          className={`${iconButton} ml-0.5 ${
            autoScroll ? 'bg-slate-100 text-slate-700' : ''
          }`}
        >
          <ScrollText className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
