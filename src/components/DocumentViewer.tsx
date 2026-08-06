import { FileText } from 'lucide-react';
import type { MediaFile } from '@/lib/supabase';
import { EpubViewer } from '@/components/EpubViewer';
import { PdfViewer } from '@/components/PdfViewer';

interface DocumentViewerProps {
  media: MediaFile;
  className?: string;
}

function inferDocumentType(filename: string | null) {
  const extension = filename?.toLowerCase().split('.').pop();
  return extension === 'pdf' || extension === 'epub' ? extension : null;
}

function DocumentMessage({
  title,
  message,
  className,
}: {
  title: string;
  message: string;
  className: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-3xl border border-slate-200 bg-white ${className}`}
    >
      <div className="max-w-sm px-6 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-700">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{message}</p>
      </div>
    </div>
  );
}

export function DocumentViewer({
  media,
  className = '',
}: DocumentViewerProps) {
  const url = media.document_url;
  const type =
    media.document_type ?? inferDocumentType(media.document_filename);

  if (!url) {
    return (
      <DocumentMessage
        title="Document unavailable"
        message="This lesson does not contain a document URL."
        className={className}
      />
    );
  }

  if (type === 'pdf') {
    return <PdfViewer url={url} title={media.title} className={className} />;
  }

  if (type === 'epub') {
    return <EpubViewer url={url} title={media.title} className={className} />;
  }

  return (
    <DocumentMessage
      title="Unsupported document"
      message="This lesson must contain a PDF or EPUB document."
      className={className}
    />
  );
}
