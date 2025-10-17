-- Create a function to grant admin access with a code
CREATE OR REPLACE FUNCTION public.grant_admin_with_code(admin_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the code is correct
  IF admin_code != 'MADARA' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already has admin role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;