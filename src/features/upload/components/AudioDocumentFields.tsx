import type { RefObject } from 'react';
import { FileAudio, FileText } from 'lucide-react';
import FileDropzone from '@/features/upload/components/FileDropzone';
import {
  AUDIO_ACCEPT,
  DOCUMENT_ACCEPT,
} from '@/features/upload/config/uploadConfig';
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

export default function AudioDocumentFields({
  audioFile,
  companionFile,
  dragging,
  disabled,
  audioInputRef,
  companionInputRef,
  onAudioFile,
  onCompanionFile,
  onRemoveAudio,
  onRemoveCompanion,
  onDraggingChange,
}: AudioDocumentFieldsProps) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-800">Lesson files</p>
        <p className="mt-1 text-sm text-slate-500">
          Add one audio file and one companion PDF or EPUB.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
          label="Companion document"
          description="PDF or EPUB"
          icon={FileText}
          accent="violet"
          file={companionFile}
          dragging={dragging === 'companion'}
          disabled={disabled}
          inputRef={companionInputRef}
          accept={DOCUMENT_ACCEPT}
          onFile={onCompanionFile}
          onRemove={onRemoveCompanion}
          onDraggingChange={(active) =>
            onDraggingChange(active ? 'companion' : null)
          }
        />
      </div>
    </section>
  );
}
