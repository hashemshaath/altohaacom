
-- Backfill existing records with unique numbers
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM points_ledger WHERE ledger_number IS NULL) UPDATE points_ledger t SET ledger_number = 'PNT' || LPAD(n.rn::TEXT, 8, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM recipes WHERE recipe_number IS NULL) UPDATE recipes t SET recipe_number = 'RCP' || LPAD(n.rn::TEXT, 6, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM posts WHERE post_number IS NULL) UPDATE posts t SET post_number = 'PST' || LPAD(n.rn::TEXT, 8, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM establishments WHERE establishment_number IS NULL) UPDATE establishments t SET establishment_number = 'EST' || LPAD(n.rn::TEXT, 6, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM global_events WHERE event_number IS NULL) UPDATE global_events t SET event_number = 'EVT' || LPAD(n.rn::TEXT, 6, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY enrolled_at) rn FROM masterclass_enrollments WHERE enrollment_number IS NULL) UPDATE masterclass_enrollments t SET enrollment_number = 'ENR' || LPAD(n.rn::TEXT, 8, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM live_sessions WHERE session_number IS NULL) UPDATE live_sessions t SET session_number = 'LSN' || LPAD(n.rn::TEXT, 6, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM bookings WHERE booking_number IS NULL) UPDATE bookings t SET booking_number = 'BKG' || LPAD(n.rn::TEXT, 8, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM exhibition_reviews WHERE review_number IS NULL) UPDATE exhibition_reviews t SET review_number = 'ERV' || LPAD(n.rn::TEXT, 8, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM recipe_reviews WHERE review_number IS NULL) UPDATE recipe_reviews t SET review_number = 'RRV' || LPAD(n.rn::TEXT, 8, '0') FROM n WHERE t.id = n.id;
WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn FROM supplier_reviews WHERE review_number IS NULL) UPDATE supplier_reviews t SET review_number = 'SRV' || LPAD(n.rn::TEXT, 8, '0') FROM n WHERE t.id = n.id;

-- Sync sequences
SELECT setval('ledger_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM points_ledger), 0), 1));
SELECT setval('recipe_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM recipes), 0), 1));
SELECT setval('post_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM posts), 0), 1));
SELECT setval('establishment_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM establishments), 0), 1));
SELECT setval('event_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM global_events), 0), 1));
SELECT setval('enrollment_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM masterclass_enrollments), 0), 1));
SELECT setval('live_session_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM live_sessions), 0), 1));
SELECT setval('booking_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM bookings), 0), 1));
SELECT setval('exh_review_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM exhibition_reviews), 0), 1));
SELECT setval('recipe_review_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM recipe_reviews), 0), 1));
SELECT setval('supplier_review_number_seq', GREATEST(COALESCE((SELECT COUNT(*) FROM supplier_reviews), 0), 1));
