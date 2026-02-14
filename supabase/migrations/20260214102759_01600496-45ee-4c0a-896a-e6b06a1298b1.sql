
-- Delete old milestone data and insert 8 chef-themed levels
DELETE FROM referral_milestones;

INSERT INTO referral_milestones (name, name_ar, description, description_ar, required_referrals, reward_type, reward_value, reward_description, reward_description_ar, badge_icon, is_active, sort_order) VALUES
('Kitchen Helper', 'مساعد مطبخ', 'Every journey starts with a first step. Invite your first friend!', 'كل رحلة تبدأ بخطوة. ادعُ أول صديق لك!', 1, 'points', 50, '50 bonus points', '50 نقطة إضافية', '🔪', true, 1),
('Commis Chef', 'شيف مبتدئ', 'You''re building your kitchen brigade. Keep the momentum going!', 'أنت تبني فريق مطبخك. استمر بالزخم!', 3, 'points', 100, '100 bonus points', '100 نقطة إضافية', '🥄', true, 2),
('Demi Chef', 'شيف مساعد', 'Your skills are shining. You''re becoming a trusted voice in the community.', 'مهاراتك تتألق. أنت تصبح صوتاً موثوقاً في المجتمع.', 5, 'points', 200, '200 bonus points + badge', '200 نقطة إضافية + شارة', '🍳', true, 3),
('Chef de Partie', 'شيف دي بارتي', 'You''re leading your own station now. Impressive dedication!', 'أنت تقود محطتك الخاصة الآن. تفانٍ مثير للإعجاب!', 10, 'points', 500, '500 points + shop discount', '500 نقطة + خصم في المتجر', '👨‍🍳', true, 4),
('Sous Chef', 'سو شيف', 'Second in command. Your network is a force to be reckoned with.', 'الثاني في القيادة. شبكتك قوة لا يُستهان بها.', 25, 'membership_upgrade', 1, 'Professional membership 1 month', 'عضوية احترافية شهر واحد', '⭐', true, 5),
('Executive Chef', 'شيف تنفيذي', 'You run the show. A true leader building an empire of taste.', 'أنت تدير العرض. قائد حقيقي يبني إمبراطورية الذوق.', 50, 'membership_upgrade', 3, 'Professional membership 3 months', 'عضوية احترافية 3 أشهر', '🏅', true, 6),
('Master Chef', 'ماستر شيف', 'Elite status achieved. Your influence shapes the culinary world.', 'حققت المستوى النخبوي. تأثيرك يشكّل عالم الطهي.', 75, 'membership_upgrade', 6, 'Enterprise membership 6 months', 'عضوية مؤسسية 6 أشهر', '🏆', true, 7),
('Grand Chef', 'غراند شيف', 'Legendary. The pinnacle of culinary leadership and community building.', 'أسطوري. قمة القيادة الطهوية وبناء المجتمع.', 100, 'membership_upgrade', 12, 'Enterprise membership 1 year', 'عضوية مؤسسية سنة كاملة', '👑', true, 8);
