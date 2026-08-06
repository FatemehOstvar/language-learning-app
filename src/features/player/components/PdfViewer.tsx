interface PdfViewerProps {
  url: string;
  title: string;
  className: string;
}

export function PdfViewer({ url, title, className }: PdfViewerProps) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <iframe
        src={`${url}#view=FitH`}
        title={`${title} PDF`}
        className="h-full w-full border-0"
      />
    </div>
  );
}
