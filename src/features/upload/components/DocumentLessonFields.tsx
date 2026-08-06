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
      <div className="mb-3">
        <h2 className="text-sm font-medium text-slate-800">Document</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Upload the PDF or EPUB you want to study.
        </p>
      </div>

      <FileDropzone
        label="PDF or EPUB"
        description="The original file is preserved"
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
