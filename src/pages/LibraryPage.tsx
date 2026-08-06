import { useState, useEffect } from 'react';
import { supabase, type MediaFile } from '@/shared/api/supabase';
import { formatTime } from '@/shared/utils/formatTime';
import { parseSrt } from '@/shared/utils/srtParser';
import { Library, Headphones, Trash2, Loader2, FileText, BookOpen } from 'lucide-react';

interface LibraryPageProps {
  onSelect: (file: MediaFile) => void;
  activeId: string | null;
}

export default function LibraryPage({ onSelect, activeId }: LibraryPageProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setFiles(data as MediaFile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async (id: string, audioFilename: string | null) => {
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    if (audioFilename) {
      await supabase.storage.from('audio').remove([audioFilename]);
    }

    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Library</h1>
        <p className="text-sm text-slate-400 mt-1">All your lessons — audio and text.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Library className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-slate-400">No lessons yet. Upload one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => {
            const isAudio = file.media_type === 'audio';
            const cueCount = isAudio ? parseSrt(file.srt_content || '').length : 0;
            const wordCount = !isAudio && file.content
              ? file.content.trim().split(/\s+/).filter(Boolean).length
              : 0;
            const isActive = file.id === activeId;
            return (
              <div
                key={file.id}
                className={`group rounded-2xl border p-4 transition-all duration-200 ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => onSelect(file)}
                    className="flex items-center gap-4 min-w-0 text-left flex-1"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-600'
                        : isAudio
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {isAudio ? <Headphones className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${isActive ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {file.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        {isAudio ? (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {cueCount} cues
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {wordCount} words
                          </span>
                        )}
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDelete(file.id, file.audio_filename)}
                    className="p-2 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
