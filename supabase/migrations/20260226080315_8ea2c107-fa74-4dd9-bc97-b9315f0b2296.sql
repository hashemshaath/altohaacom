-- Enable realtime for posts table to support live feed updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;