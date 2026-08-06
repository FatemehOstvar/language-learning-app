import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileAudio,
  FileText,
  Headphones,
  Layers3,
  Loader2,
  PenLine,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  supabase,
  type MediaFile,
} from '@/lib/supabase';
import {
  normalizeAndSplitSentences,
} from '@/lib/textParser';

interface UploadPageProps {
  onUploaded: (file: MediaFile) => void;
  onGoToPlayer: () => void;
}

type Tab =
  | 'audio-document'
  | 'document'
  | 'textbox';

type DragTarget =
  | 'audio'
  | 'companion'
  | 'document'
  | null;

type Accent =
  | 'emerald'
  | 'violet'
  | 'amber';

type DocumentType = 'pdf' | 'epub';

interface UploadedStorageFile {
  path: string;
  publicUrl: string;
}

const AUDIO_BUCKET = 'audio';
const DOCUMENT_BUCKET = 'documents';

const AUDIO_EXTENSIONS = new Set([
  'mp3',
  'm4a',
  'wav',
  'ogg',
  'aac',
  'flac',
  'webm',
]);

const DOCUMENT_EXTENSIONS = new Set([
  'pdf',
  'epub',
]);

export default function UploadPage({
  onUploaded,
  onGoToPlayer,
}: UploadPageProps) {
  const [tab, setTab] =
    useState<Tab>('audio-document');

  const [lessonTitle, setLessonTitle] =
    useState('');

  const [audioFile, setAudioFile] =
    useState<File | null>(null);

  const [companionFile, setCompanionFile] =
    useState<File | null>(null);

  const [documentFile, setDocumentFile] =
    useState<File | null>(null);

  const [textBoxContent, setTextBoxContent] =
    useState('');

  const [dragging, setDragging] =
    useState<DragTarget>(null);

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [progressMessage, setProgressMessage] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  const audioInputRef =
    useRef<HTMLInputElement>(null);

  const companionInputRef =
    useRef<HTMLInputElement>(null);

  const documentInputRef =
    useRef<HTMLInputElement>(null);

  const wordCount = useMemo(() => {
    return textBoxContent
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;
  }, [textBoxContent]);

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const handleTabChange = (
    nextTab: Tab,
  ) => {
    setTab(nextTab);
    resetMessages();
    setProgress(0);
    setProgressMessage('');
  };

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

      setLessonTitle((currentTitle) => {
        return currentTitle.trim()
          ? currentTitle
          : getFileTitle(file.name);
      });
    },
    [resetMessages],
  );

  const handleCompanionFile = useCallback(
    (file: File) => {
      resetMessages();

      if (!isDocumentFile(file)) {
        setError(
          'The companion document must be a PDF or EPUB file.',
        );
        return;
      }

      setCompanionFile(file);
    },
    [resetMessages],
  );

  const handleDocumentFile = useCallback(
    (file: File) => {
      resetMessages();

      if (!isDocumentFile(file)) {
        setError(
          'Please select a PDF or EPUB file.',
        );
        return;
      }

      setDocumentFile(file);

      setLessonTitle((currentTitle) => {
        return currentTitle.trim()
          ? currentTitle
          : getFileTitle(file.name);
      });
    },
    [resetMessages],
  );

  const handleDrop = useCallback(
    (
      event: DragEvent<HTMLDivElement>,
      handler: (file: File) => void,
    ) => {
      event.preventDefault();
      setDragging(null);

      const file =
        event.dataTransfer.files?.[0];

      if (file) {
        handler(file);
      }
    },
    [],
  );

  const resetForm = () => {
    setLessonTitle('');
    setAudioFile(null);
    setCompanionFile(null);
    setDocumentFile(null);
    setTextBoxContent('');
    setProgress(0);
    setProgressMessage('');

    clearInput(audioInputRef);
    clearInput(companionInputRef);
    clearInput(documentInputRef);
  };

  const uploadAudioDocumentLesson =
    async () => {
      if (!lessonTitle.trim()) {
        setError(
          'Please enter a lesson title.',
        );
        return;
      }

      if (!audioFile || !companionFile) {
        setError(
          'Please select both an audio file and a PDF or EPUB document.',
        );
        return;
      }

      setUploading(true);
      setSuccess(false);
      setError(null);
      setProgress(0);

      let uploadedAudio:
        | UploadedStorageFile
        | undefined;

      let uploadedDocument:
        | UploadedStorageFile
        | undefined;

      try {
        setProgressMessage(
          'Uploading audio…',
        );

        uploadedAudio =
          await uploadStorageFile({
            bucket: AUDIO_BUCKET,
            file: audioFile,
            onProgress: (
              fileProgress,
            ) => {
              setProgress(
                Math.round(
                  fileProgress * 0.55,
                ),
              );
            },
          });

        setProgressMessage(
          'Uploading companion document…',
        );

        uploadedDocument =
          await uploadStorageFile({
            bucket: DOCUMENT_BUCKET,
            file: companionFile,
            onProgress: (
              fileProgress,
            ) => {
              setProgress(
                55 +
                  Math.round(
                    fileProgress * 0.45,
                  ),
              );
            },
          });

        setProgressMessage(
          'Creating lesson…',
        );

        const documentType =
          getDocumentType(companionFile);

        const {
          data,
          error: insertError,
        } = await supabase
          .from('media_files')
          .insert({
            title:
              lessonTitle.trim(),

            media_type:
              'audio_document',

            audio_url:
              uploadedAudio.publicUrl,

            audio_filename:
              audioFile.name,

            document_url:
              uploadedDocument.publicUrl,

            document_filename:
              companionFile.name,

            document_type:
              documentType,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setProgress(100);
        setProgressMessage(
          'Lesson created successfully.',
        );
        setSuccess(true);

        onUploaded(
          data as MediaFile,
        );

        resetForm();
      } catch (uploadError) {
        await removeUploadedFiles([
          uploadedAudio && {
            bucket: AUDIO_BUCKET,
            path: uploadedAudio.path,
          },
          uploadedDocument && {
            bucket:
              DOCUMENT_BUCKET,
            path:
              uploadedDocument.path,
          },
        ]);

        setError(
          uploadError instanceof Error
            ? uploadError.message
            : 'The lesson could not be created.',
        );
      } finally {
        setUploading(false);
        setProgressMessage('');
      }
    };

  const uploadDocumentLesson =
    async () => {
      if (!lessonTitle.trim()) {
        setError(
          'Please enter a lesson title.',
        );
        return;
      }

      if (!documentFile) {
        setError(
          'Please select a PDF or EPUB file.',
        );
        return;
      }

      setUploading(true);
      setSuccess(false);
      setError(null);
      setProgress(0);
      setProgressMessage(
        'Uploading document…',
      );

      let uploadedDocument:
        | UploadedStorageFile
        | undefined;

      try {
        uploadedDocument =
          await uploadStorageFile({
            bucket: DOCUMENT_BUCKET,
            file: documentFile,
            onProgress:
              setProgress,
          });

        setProgressMessage(
          'Creating lesson…',
        );

        const {
          data,
          error: insertError,
        } = await supabase
          .from('media_files')
          .insert({
            title:
              lessonTitle.trim(),

            media_type:
              'document',

            document_url:
              uploadedDocument.publicUrl,

            document_filename:
              documentFile.name,

            document_type:
              getDocumentType(
                documentFile,
              ),
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setProgress(100);
        setSuccess(true);

        onUploaded(
          data as MediaFile,
        );

        resetForm();
      } catch (uploadError) {
        await removeUploadedFiles([
          uploadedDocument && {
            bucket:
              DOCUMENT_BUCKET,
            path:
              uploadedDocument.path,
          },
        ]);

        setError(
          uploadError instanceof Error
            ? uploadError.message
            : 'The document lesson could not be created.',
        );
      } finally {
        setUploading(false);
        setProgressMessage('');
      }
    };

  const uploadTextLesson =
    async () => {
      if (!lessonTitle.trim()) {
        setError(
          'Please enter a lesson title.',
        );
        return;
      }

      if (!textBoxContent.trim()) {
        setError(
          'Please enter some lesson text.',
        );
        return;
      }

      setUploading(true);
      setSuccess(false);
      setError(null);
      setProgressMessage(
        'Creating lesson…',
      );

      try {
        const sentences =
          normalizeAndSplitSentences(
            textBoxContent,
          );

        const content =
          sentences.join('\n');

        const {
          data,
          error: insertError,
        } = await supabase
          .from('media_files')
          .insert({
            title:
              lessonTitle.trim(),

            media_type:
              'text',

            content,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setSuccess(true);

        onUploaded(
          data as MediaFile,
        );

        resetForm();
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : 'The text lesson could not be created.',
        );
      } finally {
        setUploading(false);
        setProgressMessage('');
      }
    };

  const handleSubmit = () => {
    if (tab === 'audio-document') {
      void uploadAudioDocumentLesson();
      return;
    }

    if (tab === 'document') {
      void uploadDocumentLesson();
      return;
    }

    void uploadTextLesson();
  };

  const canSubmit = useMemo(() => {
    if (
      uploading ||
      !lessonTitle.trim()
    ) {
      return false;
    }

    if (
      tab === 'audio-document'
    ) {
      return Boolean(
        audioFile &&
          companionFile,
      );
    }

    if (tab === 'document') {
      return Boolean(documentFile);
    }

    return Boolean(
      textBoxContent.trim(),
    );
  }, [
    uploading,
    lessonTitle,
    tab,
    audioFile,
    companionFile,
    documentFile,
    textBoxContent,
  ]);

  const tabs: {
    id: Tab;
    label: string;
    description: string;
    icon: typeof Headphones;
  }[] = [
    {
      id: 'audio-document',
      label: 'Audio lesson',
      description:
        'Audio with a PDF or EPUB',
      icon: Headphones,
    },
    {
      id: 'document',
      label: 'Document lesson',
      description:
        'PDF or EPUB without audio',
      icon: BookOpen,
    },
    {
      id: 'textbox',
      label: 'Text lesson',
      description:
        'Write or paste lesson text',
      icon: PenLine,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-10 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <Layers3 className="h-3.5 w-3.5" />
          Lesson builder
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Create a new lesson
        </h1>

        <p className="mt-3 text-base leading-7 text-slate-500">
          Combine audio with a PDF or EPUB,
          upload a standalone document, or
          create a lesson from pasted text.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Lesson type navigation */}
        <aside>
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Lesson type
          </p>

          <div className="space-y-2">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active =
                tab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleTabChange(
                      item.id,
                    )
                  }
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                      : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          active
                            ? 'text-emerald-950'
                            : 'text-slate-800'
                        }`}
                      >
                        {item.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Original files preserved
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  PDF and EPUB files are uploaded
                  directly without converting or
                  flattening their contents.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main form */}
        <main className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <p className="text-sm font-semibold text-slate-900">
              Lesson details
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add a clear title and choose the
              lesson files.
            </p>
          </div>

          <div className="space-y-7 px-6 py-7 sm:px-8">
            <div>
              <label
                htmlFor="lesson-title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Lesson title
              </label>

              <input
                id="lesson-title"
                type="text"
                value={lessonTitle}
                disabled={uploading}
                onChange={(event) => {
                  setLessonTitle(
                    event.target.value,
                  );
                  resetMessages();
                }}
                placeholder="For example: French listening practice"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
              />
            </div>

            {tab ===
              'audio-document' && (
              <div>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Lesson files
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Add one audio file and one
                    companion PDF or EPUB.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Dropzone
                    label="Audio file"
                    description="MP3, M4A, WAV, OGG, AAC, FLAC or WebM"
                    icon={FileAudio}
                    accent="emerald"
                    file={audioFile}
                    dragging={
                      dragging ===
                      'audio'
                    }
                    disabled={uploading}
                    inputRef={
                      audioInputRef
                    }
                    accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.webm"
                    onPick={() =>
                      audioInputRef.current?.click()
                    }
                    onDragOver={(
                      event,
                    ) => {
                      event.preventDefault();
                      setDragging(
                        'audio',
                      );
                    }}
                    onDragLeave={() =>
                      setDragging(null)
                    }
                    onDrop={(event) =>
                      handleDrop(
                        event,
                        handleAudioFile,
                      )
                    }
                    onChange={(event) => {
                      const file =
                        event.target
                          .files?.[0];

                      if (file) {
                        handleAudioFile(
                          file,
                        );
                      }
                    }}
                    onRemove={() => {
                      setAudioFile(null);
                      clearInput(
                        audioInputRef,
                      );
                      resetMessages();
                    }}
                  />

                  <Dropzone
                    label="Companion document"
                    description="PDF or EPUB"
                    icon={FileText}
                    accent="violet"
                    file={
                      companionFile
                    }
                    dragging={
                      dragging ===
                      'companion'
                    }
                    disabled={uploading}
                    inputRef={
                      companionInputRef
                    }
                    accept=".pdf,.epub,application/pdf,application/epub+zip"
                    onPick={() =>
                      companionInputRef.current?.click()
                    }
                    onDragOver={(
                      event,
                    ) => {
                      event.preventDefault();
                      setDragging(
                        'companion',
                      );
                    }}
                    onDragLeave={() =>
                      setDragging(null)
                    }
                    onDrop={(event) =>
                      handleDrop(
                        event,
                        handleCompanionFile,
                      )
                    }
                    onChange={(event) => {
                      const file =
                        event.target
                          .files?.[0];

                      if (file) {
                        handleCompanionFile(
                          file,
                        );
                      }
                    }}
                    onRemove={() => {
                      setCompanionFile(
                        null,
                      );
                      clearInput(
                        companionInputRef,
                      );
                      resetMessages();
                    }}
                  />
                </div>
              </div>
            )}

            {tab === 'document' && (
              <div>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Lesson document
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Upload the PDF or EPUB that
                    students will read.
                  </p>
                </div>

                <Dropzone
                  label="PDF or EPUB"
                  description="The original document will be preserved"
                  icon={BookOpen}
                  accent="amber"
                  file={documentFile}
                  dragging={
                    dragging ===
                    'document'
                  }
                  disabled={uploading}
                  inputRef={
                    documentInputRef
                  }
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  onPick={() =>
                    documentInputRef.current?.click()
                  }
                  onDragOver={(
                    event,
                  ) => {
                    event.preventDefault();
                    setDragging(
                      'document',
                    );
                  }}
                  onDragLeave={() =>
                    setDragging(null)
                  }
                  onDrop={(event) =>
                    handleDrop(
                      event,
                      handleDocumentFile,
                    )
                  }
                  onChange={(event) => {
                    const file =
                      event.target
                        .files?.[0];

                    if (file) {
                      handleDocumentFile(
                        file,
                      );
                    }
                  }}
                  onRemove={() => {
                    setDocumentFile(null);
                    clearInput(
                      documentInputRef,
                    );
                    resetMessages();
                  }}
                />
              </div>
            )}

            {tab === 'textbox' && (
              <div>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Lesson text
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Paste or write the text
                      students will read.
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    {wordCount}{' '}
                    {wordCount === 1
                      ? 'word'
                      : 'words'}
                  </span>
                </div>

                <textarea
                  value={textBoxContent}
                  disabled={uploading}
                  onChange={(event) => {
                    setTextBoxContent(
                      event.target.value,
                    );
                    resetMessages();
                  }}
                  placeholder="Write or paste your lesson here…"
                  rows={14}
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {uploading &&
              tab !== 'textbox' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      {progressMessage ||
                        'Uploading…'}
                    </div>

                    <span className="font-mono text-xs text-slate-500">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-[width] duration-200"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>
              )}

            {uploading &&
              tab === 'textbox' && (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  {progressMessage ||
                    'Creating lesson…'}
                </div>
              )}

            {success && (
              <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Lesson created
                    </p>

                    <p className="mt-1 text-sm text-emerald-700">
                      Your lesson is ready
                      to open.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGoToPlayer}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Open lesson
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-xs leading-5 text-slate-400">
              Files are uploaded securely to
              your Supabase storage.
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Create lesson
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

interface DropzoneProps {
  label: string;
  description: string;
  icon: typeof FileAudio;
  accent: Accent;
  file: File | null;
  dragging: boolean;
  disabled: boolean;
  inputRef:
    RefObject<HTMLInputElement>;
  accept: string;
  onPick: () => void;
  onRemove: () => void;
  onDragOver: (
    event: DragEvent<HTMLDivElement>,
  ) => void;
  onDragLeave: () => void;
  onDrop: (
    event: DragEvent<HTMLDivElement>,
  ) => void;
  onChange: (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => void;
}

function Dropzone({
  label,
  description,
  icon: Icon,
  accent,
  file,
  dragging,
  disabled,
  inputRef,
  accept,
  onPick,
  onRemove,
  onDragOver,
  onDragLeave,
  onDrop,
  onChange,
}: DropzoneProps) {
  const accentStyle = {
    emerald: {
      icon: 'bg-emerald-100 text-emerald-700',
      active:
        'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100',
    },
    violet: {
      icon: 'bg-violet-100 text-violet-700',
      active:
        'border-violet-400 bg-violet-50 ring-4 ring-violet-100',
    },
    amber: {
      icon: 'bg-amber-100 text-amber-700',
      active:
        'border-amber-400 bg-amber-50 ring-4 ring-amber-100',
    },
  }[accent];

  return (
    <div
      onDragOver={
        disabled
          ? undefined
          : onDragOver
      }
      onDragLeave={
        disabled
          ? undefined
          : onDragLeave
      }
      onDrop={
        disabled ? undefined : onDrop
      }
      onClick={
        file || disabled
          ? undefined
          : onPick
      }
      className={`relative min-h-44 rounded-2xl border-2 border-dashed p-5 transition-all ${
        dragging
          ? accentStyle.active
          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
      } ${
        file || disabled
          ? 'cursor-default'
          : 'cursor-pointer'
      } ${
        disabled
          ? 'opacity-60'
          : ''
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={onChange}
        className="hidden"
      />

      {file ? (
        <div className="flex h-full min-h-32 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentStyle.icon}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {formatFileSize(
                  file.size,
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${file.name}`}
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-500 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex min-h-32 flex-col items-center justify-center text-center">
          <div
            className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${accentStyle.icon}`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <p className="text-sm font-semibold text-slate-800">
            {label}
          </p>

          <p className="mt-1 max-w-56 text-xs leading-5 text-slate-500">
            {description}
          </p>

          <p className="mt-3 text-xs font-medium text-slate-400">
            Drop a file here or click to browse
          </p>
        </div>
      )}
    </div>
  );
}

/* ── File helpers ───────────────────────────────────────────── */

function getFileExtension(
  filename: string,
): string {
  return (
    filename
      .toLowerCase()
      .split('.')
      .pop() ?? ''
  );
}

function getFileTitle(
  filename: string,
): string {
  return filename.replace(
    /\.[^/.]+$/,
    '',
  );
}

function isAudioFile(
  file: File,
): boolean {
  return (
    file.type.startsWith('audio/') ||
    AUDIO_EXTENSIONS.has(
      getFileExtension(file.name),
    )
  );
}

function isDocumentFile(
  file: File,
): boolean {
  return DOCUMENT_EXTENSIONS.has(
    getFileExtension(file.name),
  );
}

function getDocumentType(
  file: File,
): DocumentType {
  const extension =
    getFileExtension(file.name);

  if (
    extension !== 'pdf' &&
    extension !== 'epub'
  ) {
    throw new Error(
      'Unsupported document type.',
    );
  }

  return extension;
}

function formatFileSize(
  bytes: number,
): string {
  if (bytes === 0) {
    return '0 bytes';
  }

  const units = [
    'bytes',
    'KB',
    'MB',
    'GB',
  ];

  const unitIndex = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024),
    ),
    units.length - 1,
  );

  const size =
    bytes /
    1024 ** unitIndex;

  return `${size.toFixed(
    unitIndex === 0 ? 0 : 1,
  )} ${units[unitIndex]}`;
}

function createStoragePath(
  file: File,
): string {
  const extension =
    getFileExtension(file.name);

  const identifier =
    typeof crypto !== 'undefined' &&
    'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return extension
    ? `${identifier}.${extension}`
    : identifier;
}

function clearInput(
  inputRef:
    RefObject<HTMLInputElement>,
) {
  if (inputRef.current) {
    inputRef.current.value = '';
  }
}

/* ── Supabase upload helpers ────────────────────────────────── */

async function uploadStorageFile({
  bucket,
  file,
  onProgress,
}: {
  bucket: string;
  file: File;
  onProgress: (
    progress: number,
  ) => void;
}): Promise<UploadedStorageFile> {
  const supabaseUrl =
    import.meta.env
      .VITE_SUPABASE_URL;

  const supabaseAnonKey =
    import.meta.env
      .VITE_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      'Supabase environment variables are missing.',
    );
  }

  const path =
    createStoragePath(file);

  const uploadUrl =
    `${supabaseUrl}` +
    `/storage/v1/object/` +
    `${bucket}/` +
    `${encodeURIComponent(path)}`;

  await new Promise<void>(
    (resolve, reject) => {
      const request =
        new XMLHttpRequest();

      request.open(
        'POST',
        uploadUrl,
      );

      request.setRequestHeader(
        'Authorization',
        `Bearer ${supabaseAnonKey}`,
      );

      request.setRequestHeader(
        'apikey',
        supabaseAnonKey,
      );

      request.setRequestHeader(
        'Content-Type',
        file.type ||
          'application/octet-stream',
      );

      request.setRequestHeader(
        'x-upsert',
        'false',
      );

      request.upload.onprogress = (
        event,
      ) => {
        if (
          event.lengthComputable
        ) {
          onProgress(
            Math.round(
              (event.loaded /
                event.total) *
                100,
            ),
          );
        }
      };

      request.onload = () => {
        if (
          request.status >= 200 &&
          request.status < 300
        ) {
          onProgress(100);
          resolve();
          return;
        }

        let message =
          `Upload failed (${request.status}).`;

        try {
          const response =
            JSON.parse(
              request.responseText,
            );

          if (response.message) {
            message =
              response.message;
          }
        } catch {
          // Keep default error.
        }

        reject(
          new Error(message),
        );
      };

      request.onerror = () => {
        reject(
          new Error(
            'A network error occurred during the upload.',
          ),
        );
      };

      request.onabort = () => {
        reject(
          new Error(
            'The upload was cancelled.',
          ),
        );
      };

      request.send(file);
    },
  );

  const { data } =
    supabase.storage
      .from(bucket)
      .getPublicUrl(path);

  return {
    path,
    publicUrl:
      data.publicUrl,
  };
}

async function removeUploadedFiles(
  items: Array<
    | {
        bucket: string;
        path: string;
      }
    | undefined
  >,
) {
  const validItems = items.filter(
    (
      item,
    ): item is {
      bucket: string;
      path: string;
    } => Boolean(item),
  );

  await Promise.allSettled(
    validItems.map((item) => {
      return supabase.storage
        .from(item.bucket)
        .remove([item.path]);
    }),
  );
}