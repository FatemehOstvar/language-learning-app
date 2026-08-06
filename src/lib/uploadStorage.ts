import { supabase } from '@/lib/supabase';
import { createStoragePath } from '@/lib/uploadFileUtils';
import type { UploadedStorageFile } from '@/lib/uploadTypes';

interface UploadStorageFileOptions {
  bucket: string;
  file: File;
  onProgress: (progress: number) => void;
}

export async function uploadStorageFile({
  bucket,
  file,
  onProgress,
}: UploadStorageFileOptions): Promise<UploadedStorageFile> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  const path = createStoragePath(file);
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`;

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open('POST', uploadUrl);
    request.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
    request.setRequestHeader('apikey', supabaseAnonKey);
    request.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream',
    );
    request.setRequestHeader('x-upsert', 'false');

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      let message = `Upload failed (${request.status}).`;

      try {
        const response = JSON.parse(request.responseText) as {
          message?: string;
        };
        if (response.message) message = response.message;
      } catch {
        // Keep the default error message.
      }

      reject(new Error(message));
    };

    request.onerror = () =>
      reject(new Error('A network error occurred during the upload.'));
    request.onabort = () =>
      reject(new Error('The upload was cancelled.'));

    request.send(file);
  });

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function removeUploadedFiles(
  items: Array<{ bucket: string; path: string } | undefined>,
): Promise<void> {
  const validItems = items.filter(
    (item): item is { bucket: string; path: string } => Boolean(item),
  );

  await Promise.allSettled(
    validItems.map(({ bucket, path }) =>
      supabase.storage.from(bucket).remove([path]),
    ),
  );
}
