import type { RefObject } from 'react';
import { BookOpen } from 'lucide-react';
import FileDropzone from '@/features/upload/components/FileDropzone';
import { DOCUMENT_ACCEPT } from '@/features/upload/config/uploadConfig';
import type { DragTarget } from '@/features/upload/model/types';

interface DocumentLessonFieldsProps {
  file: File | null;
  dragging: DragTarget;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement>;
  onFile: (file: File) => void;
  onRemove: () => void;
  onDraggingChange: (target: DragTarget) => void;
}

export default function DocumentLessonFields({
  file,
  dragging,
  disabled,
  inputRef,
  onFile,
  onRemove,
  onDraggingChange,
}: DocumentLessonFieldsProps) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-800">Lesson document</p>
        <p className="mt-1 text-sm text-slate-500">
          Upload the PDF or EPUB that students will read.
        </p>
      </div>

      <FileDropzone
        label="PDF or EPUB"
        description="The original document will be preserved"
        icon={BookOpen}
        accent="amber"
        file={file}
        dragging={dragging === 'document'}
        disabled={disabled}
        inputRef={inputRef}
        accept={DOCUMENT_ACCEPT}
        onFile={onFile}
        onRemove={onRemove}
        onDraggingChange={(active) =>
          onDraggingChange(active ? 'document' : null)
        }
      />
    </section>
  );
}
