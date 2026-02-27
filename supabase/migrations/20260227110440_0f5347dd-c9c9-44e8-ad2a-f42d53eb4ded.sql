
-- Add fan profile customization columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_cuisines text[] DEFAULT '{}';

-- Create fan leaderboard view for efficient querying
CREATE OR REPLACE VIEW public.fan_leaderboard AS
SELECT 
  p.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.account_type,
  COALESCE((SELECT COUNT(*) FROM user_follows uf WHERE uf.follower_id = p.user_id), 0) AS following_count,
  COALESCE((SELECT COUNT(*) FROM fan_favorites ff WHERE ff.user_id = p.user_id), 0) AS favorites_count,
  COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.author_id = p.user_id), 0) AS comments_count,
  COALESCE((SELECT COUNT(*) FROM recipe_reviews rr WHERE rr.user_id = p.user_id), 0) AS reviews_count,
  (
    COALESCE((SELECT COUNT(*) FROM user_follows uf WHERE uf.follower_id = p.user_id), 0) * 2 +
    COALESCE((SELECT COUNT(*) FROM fan_favorites ff WHERE ff.user_id = p.user_id), 0) * 3 +
    COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.author_id = p.user_id), 0) * 5 +
    COALESCE((SELECT COUNT(*) FROM recipe_reviews rr WHERE rr.user_id = p.user_id), 0) * 10
  ) AS engagement_score
FROM profiles p
WHERE p.account_type = 'fan'
ORDER BY engagement_score DESC;
