
-- Reorganize homepage sections into logical narrative flow:
-- Hero → Search → Stats → Core Events → Community → Ad Break → Education/Content → Business → Social Proof → Partners → CTA

UPDATE homepage_sections SET sort_order = 1 WHERE section_key = 'hero';
UPDATE homepage_sections SET sort_order = 2 WHERE section_key = 'search';
UPDATE homepage_sections SET sort_order = 3 WHERE section_key = 'stats';

-- Core events content
UPDATE homepage_sections SET sort_order = 4 WHERE section_key = 'events_by_category';
UPDATE homepage_sections SET sort_order = 5 WHERE section_key = 'featured_chefs';

-- Ad break after high-engagement content
UPDATE homepage_sections SET sort_order = 6 WHERE section_key = 'ad_banner_top';

-- Education & content block
UPDATE homepage_sections SET sort_order = 7 WHERE section_key = 'masterclasses';
UPDATE homepage_sections SET sort_order = 8 WHERE section_key = 'articles';
UPDATE homepage_sections SET sort_order = 9 WHERE section_key = 'trending_content';

-- Secondary events
UPDATE homepage_sections SET sort_order = 10 WHERE section_key = 'regional_events';
UPDATE homepage_sections SET sort_order = 11 WHERE section_key = 'events_calendar';

-- Business & suppliers
UPDATE homepage_sections SET sort_order = 12 WHERE section_key = 'pro_suppliers';

-- Mid ad break
UPDATE homepage_sections SET sort_order = 13 WHERE section_key = 'ad_banner_mid';

-- Community & social proof
UPDATE homepage_sections SET sort_order = 14 WHERE section_key = 'newly_joined';
UPDATE homepage_sections SET sort_order = 15 WHERE section_key = 'testimonials';

-- Sponsorships & partners block
UPDATE homepage_sections SET sort_order = 16 WHERE section_key = 'sponsorships';
UPDATE homepage_sections SET sort_order = 17 WHERE section_key = 'sponsors';
UPDATE homepage_sections SET sort_order = 18 WHERE section_key = 'partners';

-- Bottom CTA
UPDATE homepage_sections SET sort_order = 19 WHERE section_key = 'features';
UPDATE homepage_sections SET sort_order = 20 WHERE section_key = 'newsletter';
