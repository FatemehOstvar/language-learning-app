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

export default function DocumentLessonFields(props: DocumentLessonFieldsProps) {
  return (
    <FileDropzone
      label="PDF or EPUB"
      description="PDF or EPUB"
      icon={BookOpen}
      accent="amber"
      file={props.file}
      dragging={props.dragging === 'document'}
      disabled={props.disabled}
      inputRef={props.inputRef}
      accept={DOCUMENT_ACCEPT}
      onFile={props.onFile}
      onRemove={props.onRemove}
      onDraggingChange={(active) => props.onDraggingChange(active ? 'document' : null)}
    />
  );
}
