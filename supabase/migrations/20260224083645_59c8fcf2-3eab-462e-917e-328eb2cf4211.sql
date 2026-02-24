-- Enable realtime for exhibition_tickets to power live dashboard stats
ALTER PUBLICATION supabase_realtime ADD TABLE public.exhibition_tickets;