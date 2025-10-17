-- Add new fields to posts table
ALTER TABLE public.posts
ADD COLUMN image_url TEXT,
ADD COLUMN document_url TEXT,
ADD COLUMN external_url TEXT;

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true);

-- RLS policies for storage - allow public read, admin write
CREATE POLICY "Public can view post media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Admins can upload post media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can update post media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'post-media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can delete post media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post-media' AND
  auth.uid() IS NOT NULL
);