-- Fix security issue: Restrict profile visibility to own profile only
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Optionally, if we need admin access later, we can add a role-based policy
-- But for now, keeping it simple and secure