import { useState, useRef, useCallback } from 'react';
import { supabase, type MediaFile } from '@/lib/supabase';
import { extractTextFromFile, normalizeAndSplitSentences } from '@/lib/textParser';
import {
  UploadCloud, FileAudio, FileText, X, CheckCircle2, Loader2,
  FileUp, PenLine, Headphones, BookOpen,
} from 'lucide-react';

interface UploadPageProps {
  onUploaded: (file: MediaFile) => void;
  onGoToPlayer: () => void;
}

type Tab = 'audio' | 'textfile' | 'textbox';

export default function UploadPage({ onUploaded, onGoToPlayer }: UploadPageProps) {
  const [tab, setTab] = useState<Tab>('audio');

  // Audio tab state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState<'audio' | 'srt' | 'textfile' | null>(null);

  // Text file tab state
  const [textFile, setTextFile] = useState<File | null>(null);

  // Text box tab state
  const [textBoxContent, setTextBoxContent] = useState('');
  const [textBoxTitle, setTextBoxTitle] = useState('');

  // Shared state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioFile = useCallback((file: File) => {
    setError(null);
    setSuccess(false);
    setAudioFile(file);
  }, []);

  const handleSrtFile = useCallback((file: File) => {
    setError(null);
    setSuccess(false);
    if (!file.name.toLowerCase().endsWith('.srt')) {
      setError('Please select an .srt subtitle file.');
      return;
    }
    setSrtFile(file);
  }, []);

  const handleTextFile = useCallback((file: File) => {
    setError(null);
    setSuccess(false);
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.epub') && !name.endsWith('.txt') && !name.endsWith('.md')) {
      setError('Please select a PDF, EPUB, TXT, or Markdown file.');
      return;
    }
    setTextFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, handler: (f: File) => void) => {
    e.preventDefault();
    setDragging(null);
    const file = e.dataTransfer.files?.[0];
    if (file) handler(file);
  }, []);

  const resetAll = () => {
    setAudioFile(null);
    setSrtFile(null);
    setTextFile(null);
    setTextBoxContent('');
    setTextBoxTitle('');
    setProgress(0);
  };

  const uploadAudio = async () => {
    if (!audioFile || !srtFile) {
      setError('Please select both an audio file and an SRT subtitle file.');
      return;
    }
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const audioExt = audioFile.name.split('.').pop() || 'audio';
      const audioPath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${audioExt}`;

      await new Promise<void>((resolve, reject) => {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/audio/${audioPath}`;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
        xhr.setRequestHeader('Content-Type', audioFile.type || 'application/octet-stream');
        xhr.setRequestHeader('x-upsert', 'false');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.send(audioFile);
      });

      const { data: urlData } = supabase.storage.from('audio').getPublicUrl(audioPath);
      const srtContent = await srtFile.text();
      const title = audioFile.name.replace(/\.[^/.]+$/, '');

      const { data, error: insertError } = await supabase
        .from('media_files')
        .insert({
          title,
          audio_url: urlData.publicUrl,
          audio_filename: audioFile.name,
          srt_content: srtContent,
          srt_filename: srtFile.name,
          media_type: 'audio',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      onUploaded(data as MediaFile);
      resetAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadTextFile = async () => {
    if (!textFile) {
      setError('Please select a text file.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const rawText = await extractTextFromFile(textFile);
      const sentences = normalizeAndSplitSentences(rawText);
      const content = sentences.join('\n');
      const title = textFile.name.replace(/\.[^/.]+$/, '');

      const { data, error: insertError } = await supabase
        .from('media_files')
        .insert({
          title,
          media_type: 'text',
          content,
          source_filename: textFile.name,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      onUploaded(data as MediaFile);
      resetAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text from file.');
    } finally {
      setUploading(false);
    }
  };

  const uploadTextBox = async () => {
    if (!textBoxContent.trim()) {
      setError('Please enter some text for your lesson.');
      return;
    }
    if (!textBoxTitle.trim()) {
      setError('Please enter a title for your lesson.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const sentences = normalizeAndSplitSentences(textBoxContent);
      const content = sentences.join('\n');

      const { data, error: insertError } = await supabase
        .from('media_files')
        .insert({
          title: textBoxTitle.trim(),
          media_type: 'text',
          content,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      onUploaded(data as MediaFile);
      resetAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lesson.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (tab === 'audio') uploadAudio();
    else if (tab === 'textfile') uploadTextFile();
    else uploadTextBox();
  };

  const canSubmit = () => {
    if (uploading) return false;
    if (tab === 'audio') return !!audioFile && !!srtFile;
    if (tab === 'textfile') return !!textFile;
    if (tab === 'textbox') return textBoxContent.trim().length > 0 && textBoxTitle.trim().length > 0;
    return false;
  };

  const tabs: { id: Tab; label: string; icon: typeof FileAudio }[] = [
    { id: 'audio', label: 'Audio + SRT', icon: Headphones },
    { id: 'textfile', label: 'Text File', icon: FileUp },
    { id: 'textbox', label: 'Text Box', icon: PenLine },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Add a Lesson</h1>
        <p className="mt-2 text-slate-500">Upload audio with subtitles, a text file, or paste text directly.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex justify-center gap-2 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(null); setSuccess(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Audio + SRT tab */}
      {tab === 'audio' && (
        <div className="grid sm:grid-cols-2 gap-5">
          <Dropzone
            label="Audio File"
            icon={FileAudio}
            accent="emerald"
            file={audioFile}
            dragging={dragging === 'audio'}
            onDragOver={(e) => { e.preventDefault(); setDragging('audio'); }}
            onDragLeave={() => setDragging(null)}
            onDrop={(e) => handleDrop(e, handleAudioFile)}
            onPick={() => audioInputRef.current?.click()}
            onRemove={() => setAudioFile(null)}
            inputRef={audioInputRef}
            accept="audio/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioFile(f); }}
          />
          <Dropzone
            label="Subtitle (.srt)"
            icon={FileText}
            accent="sky"
            file={srtFile}
            dragging={dragging === 'srt'}
            onDragOver={(e) => { e.preventDefault(); setDragging('srt'); }}
            onDragLeave={() => setDragging(null)}
            onDrop={(e) => handleDrop(e, handleSrtFile)}
            onPick={() => srtInputRef.current?.click()}
            onRemove={() => setSrtFile(null)}
            inputRef={srtInputRef}
            accept=".srt"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSrtFile(f); }}
          />
        </div>
      )}

      {/* Text file tab */}
      {tab === 'textfile' && (
        <Dropzone
          label="Text File (PDF, EPUB, TXT, MD)"
          icon={BookOpen}
          accent="amber"
          file={textFile}
          dragging={dragging === 'textfile'}
          onDragOver={(e) => { e.preventDefault(); setDragging('textfile'); }}
          onDragLeave={() => setDragging(null)}
          onDrop={(e) => handleDrop(e, handleTextFile)}
          onPick={() => textFileInputRef.current?.click()}
          onRemove={() => setTextFile(null)}
          inputRef={textFileInputRef}
          accept=".pdf,.epub,.txt,.md"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleTextFile(f); }}
        />
      )}

      {/* Text box tab */}
      {tab === 'textbox' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Lesson Title</label>
            <input
              type="text"
              value={textBoxTitle}
              onChange={(e) => setTextBoxTitle(e.target.value)}
              placeholder="e.g. Spanish Greetings Practice"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Lesson Text</label>
            <textarea
              value={textBoxContent}
              onChange={(e) => setTextBoxContent(e.target.value)}
              placeholder="Paste or type your lesson text here..."
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-y"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              {textBoxContent.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Progress */}
      {uploading && tab === 'audio' && (
        <div className="mt-6">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-slate-500 mt-2">Uploading audio... {progress}%</p>
        </div>
      )}

      {uploading && tab !== 'audio' && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            Lesson saved. Ready to view.
          </div>
          <button
            onClick={onGoToPlayer}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
          >
            Go to reader
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium text-sm shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {tab === 'audio' ? `Uploading... ${progress}%` : 'Processing...'}
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              Save Lesson
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface DropzoneProps {
  label: string;
  icon: typeof FileAudio;
  accent: 'emerald' | 'sky' | 'amber';
  file: File | null;
  dragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onPick: () => void;
  onRemove: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Dropzone({
  label, icon: Icon, accent, file, dragging,
  onDragOver, onDragLeave, onDrop, onPick, onRemove,
  inputRef, accept, onChange,
}: DropzoneProps) {
  const accentMap = {
    emerald: { ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-300' },
    sky: { ring: 'ring-sky-400', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-300' },
    amber: { ring: 'ring-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-300' },
  }[accent];

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={file ? undefined : onPick}
      className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? `${accentMap.border} ${accentMap.bg} scale-[1.02]`
          : 'border-slate-300 bg-white hover:border-slate-400'
      } ${file ? 'cursor-default' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />

      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg ${accentMap.bg} ${accentMap.text} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="py-6">
          <div className={`mx-auto w-12 h-12 rounded-xl ${accentMap.bg} ${accentMap.text} flex items-center justify-center mb-3`}>
            <Icon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-400 mt-1">Drop here or click to browse</p>
        </div>
      )}
    </div>
  );
}
