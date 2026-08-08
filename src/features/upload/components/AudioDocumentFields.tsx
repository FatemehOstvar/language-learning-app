import type { RefObject } from 'react';
import { FileAudio, FileText } from 'lucide-react';
import FileDropzone from '@/features/upload/components/FileDropzone';
import { AUDIO_ACCEPT, DOCUMENT_ACCEPT } from '@/features/upload/config/uploadConfig';
import type { DragTarget } from '@/features/upload/model/types';

interface AudioDocumentFieldsProps {
  audioFile: File | null;
  companionFile: File | null;
  dragging: DragTarget;
  disabled: boolean;
  audioInputRef: RefObject<HTMLInputElement>;
  companionInputRef: RefObject<HTMLInputElement>;
  onAudioFile: (file: File) => void;
  onCompanionFile: (file: File) => void;
  onRemoveAudio: () => void;
  onRemoveCompanion: () => void;
  onDraggingChange: (target: DragTarget) => void;
}

export default function AudioDocumentFields(props: AudioDocumentFieldsProps) {
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
        label="Document"
        description="PDF or EPUB"
        icon={FileText}
        accent="violet"
        file={props.companionFile}
        dragging={props.dragging === 'companion'}
        disabled={props.disabled}
        inputRef={props.companionInputRef}
        accept={DOCUMENT_ACCEPT}
        onFile={props.onCompanionFile}
        onRemove={props.onRemoveCompanion}
        onDraggingChange={(active) => props.onDraggingChange(active ? 'companion' : null)}
      />
    </div>
  );
}
