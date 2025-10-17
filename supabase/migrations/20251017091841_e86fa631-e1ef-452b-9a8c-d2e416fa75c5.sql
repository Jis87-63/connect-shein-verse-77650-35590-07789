-- Drop existing policies for post_likes
DROP POLICY IF EXISTS "Authenticated users can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.post_likes;

-- Create new policies that allow anyone to like/unlike
CREATE POLICY "Anyone can like posts"
ON public.post_likes
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can unlike posts"
ON public.post_likes
FOR DELETE
TO public
USING (true);

-- Create a unique constraint to prevent duplicate likes from same session
-- We'll use a combination of post_id and a generated identifier
ALTER TABLE public.post_likes
DROP CONSTRAINT IF EXISTS post_likes_user_id_post_id_key;

-- Add a session_id column for anonymous users
ALTER TABLE public.post_likes
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Make user_id nullable to support anonymous likes
ALTER TABLE public.post_likes
ALTER COLUMN user_id DROP NOT NULL;

-- Create unique constraint that considers both user_id and session_id
CREATE UNIQUE INDEX IF NOT EXISTS post_likes_unique_idx 
ON public.post_likes (post_id, COALESCE(user_id::text, session_id));