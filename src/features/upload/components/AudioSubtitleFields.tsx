import type { RefObject } from 'react';
import { Captions, FileAudio } from 'lucide-react';
import FileDropzone from '@/features/upload/components/FileDropzone';
import { AUDIO_ACCEPT, SUBTITLE_ACCEPT } from '@/features/upload/config/uploadConfig';
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

export default function AudioSubtitleFields(props: AudioSubtitleFieldsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <FileDropzone
        label="Audio"
        description="MP3, M4A, WAV, OGG, AAC, FLAC or WebM"
        icon={FileAudio}
        accent="emerald"
        file={props.audioFile}
        dragging={props.dragging === 'audio'}
        disabled={props.disabled}
        inputRef={props.audioInputRef}
        accept={AUDIO_ACCEPT}
        onFile={props.onAudioFile}
        onRemove={props.onRemoveAudio}
        onDraggingChange={(active) => props.onDraggingChange(active ? 'audio' : null)}
      />
      <FileDropzone
        label="Subtitles"
        description="SRT or WebVTT"
        icon={Captions}
        accent="amber"
        file={props.subtitleFile}
        dragging={props.dragging === 'subtitle'}
        disabled={props.disabled}
        inputRef={props.subtitleInputRef}
        accept={SUBTITLE_ACCEPT}
        onFile={props.onSubtitleFile}
        onRemove={props.onRemoveSubtitle}
        onDraggingChange={(active) => props.onDraggingChange(active ? 'subtitle' : null)}
      />
    </div>
  );
}
