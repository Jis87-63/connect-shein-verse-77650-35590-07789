-- Drop existing storage policies
DROP POLICY IF EXISTS "Public can view post media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload post media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update post media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete post media" ON storage.objects;

-- Create new storage policies with proper admin checks
CREATE POLICY "Public can view post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

CREATE POLICY "Only admins can upload post media"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can update post media"
ON storage.objects FOR UPDATE
TO public
USING (
  bucket_id = 'post-media' 
  AND auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can delete post media"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'post-media' 
  AND auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);