-- Fix security definer view warning by setting security_invoker
ALTER VIEW public.profiles_safe SET (security_invoker = on);