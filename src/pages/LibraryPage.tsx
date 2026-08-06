import LibraryWorkspace from '@/features/library/components/LibraryWorkspace';
import type {
  MediaFile,
} from '@/shared/api/supabase';

interface LibraryPageProps {
  onSelect: (file: MediaFile) => void;
  activeId: string | null;
}

export default function LibraryPage({
  onSelect,
  activeId,
}: LibraryPageProps) {
  return (
    <LibraryWorkspace
      onSelect={onSelect}
      activeId={activeId}
    />
  );
}
