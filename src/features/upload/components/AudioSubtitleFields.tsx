import type { RefObject } from 'react';
import { Captions, FileAudio } from 'lucide-react';
import FileDropzone from '@/features/upload/components/FileDropzone';
import {
  AUDIO_ACCEPT,
  SUBTITLE_ACCEPT,
} from '@/features/upload/config/uploadConfig';
import type { DragTarget } from '@/features/upload/model/types';

interface AudioSubtitleFieldsProps {
  audioFile: File | null;
  subtitleFile: File | null;
  dragging: DragTarget;
  disabled: boolean;
  audioInputRef: RefObject<HTMLInputElement>;
  subtitleInputRef: RefObject<HTMLInputElement>;
  onAudioFile: (file: File) => void;
  onSubtitleFile: (file: File) => void;
  onRemoveAudio: () => void;
  onRemoveSubtitle: () => void;
  onDraggingChange: (target: DragTarget) => void;
}

export default function AudioSubtitleFields({
  audioFile,
  subtitleFile,
  dragging,
  disabled,
  audioInputRef,
  subtitleInputRef,
  onAudioFile,
  onSubtitleFile,
  onRemoveAudio,
  onRemoveSubtitle,
  onDraggingChange,
}: AudioSubtitleFieldsProps) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-medium text-slate-800">Files</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Add the audio and its timed subtitle file.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FileDropzone
          label="Audio file"
          description="MP3, M4A, WAV, OGG, AAC, FLAC or WebM"
          icon={FileAudio}
          accent="emerald"
          file={audioFile}
          dragging={dragging === 'audio'}
          disabled={disabled}
          inputRef={audioInputRef}
          accept={AUDIO_ACCEPT}
          onFile={onAudioFile}
          onRemove={onRemoveAudio}
          onDraggingChange={(active) =>
            onDraggingChange(active ? 'audio' : null)
          }
        />

        <FileDropzone
          label="Subtitle file"
          description="SRT or WebVTT"
          icon={Captions}
          accent="amber"
          file={subtitleFile}
          dragging={dragging === 'subtitle'}
          disabled={disabled}
          inputRef={subtitleInputRef}
          accept={SUBTITLE_ACCEPT}
          onFile={onSubtitleFile}
          onRemove={onRemoveSubtitle}
          onDraggingChange={(active) =>
            onDraggingChange(active ? 'subtitle' : null)
          }
        />
      </div>
    </section>
  );
}
