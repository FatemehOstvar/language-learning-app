/*
# Storage policies for audio bucket

Allow public (anon) read and upload for the audio bucket.
*/

DROP POLICY IF EXISTS "Public can read audio" ON storage.objects;
CREATE POLICY "Public can read audio"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'audio');

DROP POLICY IF EXISTS "Public can upload audio" ON storage.objects;
CREATE POLICY "Public can upload audio"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'audio');

DROP POLICY IF EXISTS "Public can delete audio" ON storage.objects;
CREATE POLICY "Public can delete audio"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'audio');
