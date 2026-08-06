interface LeitnerErrorMessageProps {
  message: string | null;
}

export default function LeitnerErrorAlert({
  message,
}: LeitnerErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </div>
  );
}
