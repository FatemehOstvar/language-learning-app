import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MediaFile } from '@/shared/api/supabase';
import {
  clearFileInput,
  getFileTitle,
  isAudioFile,
  isDocumentFile,
  isSubtitleFile,
} from '@/features/upload/utils/fileUtils';
import {
  createAudioDocumentLesson,
  createAudioSubtitleLesson,
  createDocumentLesson,
  createTextLesson,
} from '@/features/upload/services/lessonUploadService';
import type {
  DragTarget,
  UploadTab,
} from '@/features/upload/model/types';

interface UseUploadFormOptions {
  onUploaded: (file: MediaFile) => void;
}

export function useUploadForm({ onUploaded }: UseUploadFormOptions) {
  const [tab, setTab] = useState<UploadTab>('audio-document');
  const [lessonTitle, setLessonTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [companionFile, setCompanionFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [textBoxContent, setTextBoxContent] = useState('');
  const [dragging, setDragging] = useState<DragTarget>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const companionInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(
    () => textBoxContent.trim().split(/\s+/).filter(Boolean).length,
    [textBoxContent],
  );

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const handleTabChange = useCallback(
    (nextTab: UploadTab) => {
      setTab(nextTab);
      resetMessages();
      setProgress(0);
      setProgressMessage('');
    },
    [resetMessages],
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      setLessonTitle(value);
      resetMessages();
    },
    [resetMessages],
  );

  const handleTextChange = useCallback(
    (value: string) => {
      setTextBoxContent(value);
      resetMessages();
    },
    [resetMessages],
  );

  const handleAudioFile = useCallback(
    (file: File) => {
      resetMessages();
      if (!isAudioFile(file)) {
        setError(
          'Please select a supported audio file such as MP3, M4A, WAV, OGG, AAC, FLAC, or WebM.',
        );
        return;
      }

      setAudioFile(file);
      setLessonTitle((title) => title.trim() || getFileTitle(file.name));
    },
    [resetMessages],
  );

  const handleCompanionFile = useCallback(
    (file: File) => {
      resetMessages();
      if (!isDocumentFile(file)) {
        setError('The companion document must be a PDF or EPUB file.');
        return;
      }
      setCompanionFile(file);
    },
    [resetMessages],
  );

  const handleSubtitleFile = useCallback(
    (file: File) => {
      resetMessages();
      if (!isSubtitleFile(file)) {
        setError('Please select an SRT or WebVTT subtitle file.');
        return;
      }
      setSubtitleFile(file);
    },
    [resetMessages],
  );

  const handleDocumentFile = useCallback(
    (file: File) => {
      resetMessages();
      if (!isDocumentFile(file)) {
        setError('Please select a PDF or EPUB file.');
        return;
      }

      setDocumentFile(file);
      setLessonTitle((title) => title.trim() || getFileTitle(file.name));
    },
    [resetMessages],
  );

  const removeAudioFile = useCallback(() => {
    setAudioFile(null);
    clearFileInput(audioInputRef);
    resetMessages();
  }, [resetMessages]);

  const removeCompanionFile = useCallback(() => {
    setCompanionFile(null);
    clearFileInput(companionInputRef);
    resetMessages();
  }, [resetMessages]);

  const removeSubtitleFile = useCallback(() => {
    setSubtitleFile(null);
    clearFileInput(subtitleInputRef);
    resetMessages();
  }, [resetMessages]);

  const removeDocumentFile = useCallback(() => {
    setDocumentFile(null);
    clearFileInput(documentInputRef);
    resetMessages();
  }, [resetMessages]);

  const resetForm = useCallback(() => {
    setLessonTitle('');
    setAudioFile(null);
    setCompanionFile(null);
    setSubtitleFile(null);
    setDocumentFile(null);
    setTextBoxContent('');
    setProgress(0);
    setProgressMessage('');
    clearFileInput(audioInputRef);
    clearFileInput(companionInputRef);
    clearFileInput(subtitleInputRef);
    clearFileInput(documentInputRef);
  }, []);

  const canSubmit = useMemo(() => {
    if (uploading || !lessonTitle.trim()) return false;
    if (tab === 'audio-document') return Boolean(audioFile && companionFile);
    if (tab === 'audio-subtitle') return Boolean(audioFile && subtitleFile);
    if (tab === 'document') return Boolean(documentFile);
    return Boolean(textBoxContent.trim());
  }, [
    uploading,
    lessonTitle,
    tab,
    audioFile,
    companionFile,
    subtitleFile,
    documentFile,
    textBoxContent,
  ]);

  const handleSubmit = useCallback(async () => {
    const title = lessonTitle.trim();

    if (!title) {
      setError('Please enter a lesson title.');
      return;
    }

    setUploading(true);
    setSuccess(false);
    setError(null);
    setProgress(0);

    try {
      let lesson: MediaFile;

      if (tab === 'audio-document') {
        if (!audioFile || !companionFile) {
          throw new Error(
            'Please select both an audio file and a PDF or EPUB document.',
          );
        }

        lesson = await createAudioDocumentLesson({
          title,
          audioFile,
          companionFile,
          onProgress: setProgress,
          onMessage: setProgressMessage,
        });
      } else if (tab === 'audio-subtitle') {
        if (!audioFile || !subtitleFile) {
          throw new Error(
            'Please select both an audio file and an SRT or WebVTT subtitle file.',
          );
        }

        lesson = await createAudioSubtitleLesson({
          title,
          audioFile,
          subtitleFile,
          onProgress: setProgress,
          onMessage: setProgressMessage,
        });
      } else if (tab === 'document') {
        if (!documentFile) {
          throw new Error('Please select a PDF or EPUB file.');
        }

        lesson = await createDocumentLesson({
          title,
          documentFile,
          onProgress: setProgress,
          onMessage: setProgressMessage,
        });
      } else {
        if (!textBoxContent.trim()) {
          throw new Error('Please enter some lesson text.');
        }

        lesson = await createTextLesson({
          title,
          text: textBoxContent,
          onMessage: setProgressMessage,
        });
      }

      onUploaded(lesson);
      resetForm();
      setSuccess(true);
    } catch (uploadError) {
      console.error('Lesson creation failed:', uploadError);

      if (uploadError instanceof Error) {
        setError(uploadError.message);
      } else if (typeof uploadError === 'object' && uploadError !== null) {
        const errorRecord = uploadError as Record<string, unknown>;
        const parts = [
          errorRecord.message,
          errorRecord.details,
          errorRecord.hint,
        ].filter(
          (value): value is string =>
            typeof value === 'string' && value.trim().length > 0,
        );

        const code =
          typeof errorRecord.code === 'string'
            ? errorRecord.code.trim()
            : '';

        setError(
          `${code ? `[${code}] ` : ''}${
            parts.join(' — ') || 'The lesson could not be created.'
          }`,
        );
      } else {
        setError(
          typeof uploadError === 'string' && uploadError.trim()
            ? uploadError
            : 'The lesson could not be created.',
        );
      }
    } finally {
      setUploading(false);
      setProgressMessage('');
    }
  }, [
    lessonTitle,
    tab,
    audioFile,
    companionFile,
    subtitleFile,
    documentFile,
    textBoxContent,
    onUploaded,
    resetForm,
  ]);

  return {
    tab,
    lessonTitle,
    audioFile,
    companionFile,
    subtitleFile,
    documentFile,
    textBoxContent,
    dragging,
    uploading,
    progress,
    progressMessage,
    error,
    success,
    wordCount,
    canSubmit,
    audioInputRef,
    companionInputRef,
    subtitleInputRef,
    documentInputRef,
    setDragging,
    handleTabChange,
    handleTitleChange,
    handleTextChange,
    handleAudioFile,
    handleCompanionFile,
    handleSubtitleFile,
    handleDocumentFile,
    removeAudioFile,
    removeCompanionFile,
    removeSubtitleFile,
    removeDocumentFile,
    handleSubmit,
  };
}
