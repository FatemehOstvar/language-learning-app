import { useState } from 'react';
import AppNavigation, { type Page } from '@/components/layout/AppNavigation';
import UploadPage from '@/pages/UploadPage';
import PlayerPage from '@/pages/PlayerPage';
import LibraryPage from '@/pages/LibraryPage';
import LeitnerPage from '@/pages/LeitnerPage';
import type { MediaFile } from '@/shared/api/supabase';

function App() {
  const [page, setPage] = useState<Page>('upload');
  const [activeMedia, setActiveMedia] = useState<MediaFile | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavigation
        current={page}
        onNavigate={setPage}
        hasActiveMedia={activeMedia !== null}
      />

      <main>
        {page === 'upload' && (
          <UploadPage
            onUploaded={(file) => setActiveMedia(file)}
            onGoToPlayer={() => setPage('player')}
          />
        )}
        {page === 'player' && <PlayerPage media={activeMedia} />}
        {page === 'library' && (
          <LibraryPage
            onSelect={(file) => {
              setActiveMedia(file);
              setPage('player');
            }}
            activeId={activeMedia?.id ?? null}
          />
        )}
        {page === 'leitner' && <LeitnerPage onNavigateToUpload={() => setPage('upload')} />}
      </main>
    </div>
  );
}

export default App;
