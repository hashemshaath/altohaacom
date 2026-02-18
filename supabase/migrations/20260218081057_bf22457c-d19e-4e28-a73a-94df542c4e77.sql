
-- ═══ Beverage Evaluation Criteria (ISO 3972 / SCA / ACF aligned) ═══

-- Categories for Beverage domain
INSERT INTO evaluation_criteria_categories (domain_id, name, name_ar, description, description_ar, sort_order, product_category) VALUES
('27c0b3fa-8a28-4406-91a3-28dfc9533d06', 'Visual & Appearance', 'المظهر البصري', 'Color clarity, foam, effervescence', 'صفاء اللون والرغوة والفوران', 1, NULL),
('27c0b3fa-8a28-4406-91a3-28dfc9533d06', 'Aroma & Bouquet', 'الرائحة والباقة', 'Olfactory assessment of the beverage', 'التقييم الشمي للمشروب', 2, NULL),
('27c0b3fa-8a28-4406-91a3-28dfc9533d06', 'Taste & Flavor Profile', 'المذاق والنكهة', 'Palate evaluation including balance, body, finish', 'تقييم الحنك بما في ذلك التوازن والجسم واللمسة الأخيرة', 3, NULL),
('27c0b3fa-8a28-4406-91a3-28dfc9533d06', 'Professional Standards', 'المعايير المهنية', 'Consistency, serving temp, shelf stability', 'الاتساق ودرجة حرارة التقديم واستقرار الرف', 4, NULL);

-- Visual & Appearance criteria
INSERT INTO evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
SELECT c.id, v.name, v.name_ar, v.description, v.description_ar, v.max_score, v.weight, v.is_required, v.sort_order
FROM evaluation_criteria_categories c
CROSS JOIN (VALUES
  ('Color Intensity & Clarity', 'شدة اللون والصفاء', 'Evaluate the visual appeal, color consistency and clarity', 'تقييم الجاذبية البصرية واتساق اللون والصفاء', 10, 8, true, 1),
  ('Foam & Effervescence', 'الرغوة والفوران', 'Quality and persistence of foam or carbonation', 'جودة واستمرار الرغوة أو الكربنة', 10, 5, false, 2),
  ('Viscosity & Body Visual', 'اللزوجة والقوام البصري', 'Visual assessment of body and texture', 'التقييم البصري للجسم والقوام', 10, 5, false, 3)
) AS v(name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
WHERE c.name = 'Visual & Appearance' AND c.domain_id = '27c0b3fa-8a28-4406-91a3-28dfc9533d06';

-- Aroma & Bouquet criteria
INSERT INTO evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
SELECT c.id, v.name, v.name_ar, v.description, v.description_ar, v.max_score, v.weight, v.is_required, v.sort_order
FROM evaluation_criteria_categories c
CROSS JOIN (VALUES
  ('Aroma Intensity', 'شدة الرائحة', 'Strength and projection of the aroma', 'قوة وانتشار الرائحة', 10, 10, true, 1),
  ('Aroma Complexity', 'تعقيد الرائحة', 'Range and layers of aromatic notes', 'نطاق وطبقات النوتات العطرية', 10, 8, true, 2),
  ('Off-Notes Detection', 'كشف الروائح الدخيلة', 'Absence of undesirable or foreign aromas', 'غياب الروائح غير المرغوبة أو الدخيلة', 10, 7, true, 3)
) AS v(name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
WHERE c.name = 'Aroma & Bouquet' AND c.domain_id = '27c0b3fa-8a28-4406-91a3-28dfc9533d06';

-- Taste & Flavor Profile criteria
INSERT INTO evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
SELECT c.id, v.name, v.name_ar, v.description, v.description_ar, v.max_score, v.weight, v.is_required, v.sort_order
FROM evaluation_criteria_categories c
CROSS JOIN (VALUES
  ('Flavor Balance', 'توازن النكهة', 'Harmony between sweet, sour, bitter, salty, umami', 'التناغم بين الحلو والحامض والمر والمالح والأومامي', 10, 12, true, 1),
  ('Body & Mouthfeel', 'الجسم والإحساس بالفم', 'Weight, texture, and tactile sensations', 'الوزن والقوام والأحاسيس اللمسية', 10, 10, true, 2),
  ('Finish & Aftertaste', 'النهاية والمذاق المتبقي', 'Length and quality of the aftertaste', 'طول وجودة المذاق المتبقي', 10, 10, true, 3),
  ('Sweetness Calibration', 'معايرة الحلاوة', 'Appropriate sweetness level for the category', 'مستوى الحلاوة المناسب للفئة', 10, 8, true, 4),
  ('Acidity & Brightness', 'الحموضة والإشراق', 'Refreshing quality and acidity balance', 'جودة الانتعاش وتوازن الحموضة', 10, 7, false, 5)
) AS v(name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
WHERE c.name = 'Taste & Flavor Profile' AND c.domain_id = '27c0b3fa-8a28-4406-91a3-28dfc9533d06';

-- Professional Standards criteria
INSERT INTO evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
SELECT c.id, v.name, v.name_ar, v.description, v.description_ar, v.max_score, v.weight, v.is_required, v.sort_order
FROM evaluation_criteria_categories c
CROSS JOIN (VALUES
  ('Batch Consistency', 'اتساق الدفعات', 'Consistency across different batches', 'الاتساق عبر الدفعات المختلفة', 10, 8, true, 1),
  ('Serving Temperature Compliance', 'الامتثال لدرجة حرارة التقديم', 'Performance at recommended serving temperature', 'الأداء عند درجة الحرارة الموصى بها للتقديم', 10, 5, false, 2),
  ('Mixability & Versatility', 'القابلية للمزج والتنوع', 'Suitability for cocktails, mocktails, or culinary use', 'الملاءمة للكوكتيلات أو الاستخدام في الطهي', 10, 5, false, 3)
) AS v(name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
WHERE c.name = 'Professional Standards' AND c.domain_id = '27c0b3fa-8a28-4406-91a3-28dfc9533d06';

-- ═══ Additional Equipment Categories & Criteria ═══

INSERT INTO evaluation_criteria_categories (domain_id, name, name_ar, description, description_ar, sort_order, product_category) VALUES
('f88e5853-6f25-4734-86d2-f8c4d6b6cc2f', 'Safety & Compliance', 'السلامة والامتثال', 'Safety certifications, guards, compliance with standards', 'شهادات السلامة والحماية والامتثال للمعايير', 2, NULL),
('f88e5853-6f25-4734-86d2-f8c4d6b6cc2f', 'Ease of Use & Maintenance', 'سهولة الاستخدام والصيانة', 'Ergonomics, cleaning, parts availability', 'بيئة العمل والتنظيف وتوفر القطع', 3, NULL),
('f88e5853-6f25-4734-86d2-f8c4d6b6cc2f', 'Value & ROI', 'القيمة والعائد على الاستثمار', 'Cost-effectiveness and return on investment', 'الفعالية من حيث التكلفة والعائد على الاستثمار', 4, NULL);

-- Safety & Compliance criteria
INSERT INTO evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
SELECT c.id, v.name, v.name_ar, v.description, v.description_ar, v.max_score, v.weight, v.is_required, v.sort_order
FROM evaluation_criteria_categories c
CROSS JOIN (VALUES
  ('Safety Certifications', 'شهادات السلامة', 'CE, UL, NSF or equivalent certifications', 'شهادات CE، UL، NSF أو ما يعادلها', 10, 12, true, 1),
  ('Protective Guards & Features', 'الحماية والمميزات الوقائية', 'Built-in safety features and guards', 'ميزات السلامة المدمجة والحواجز الواقية', 10, 10, true, 2),
  ('Material Food Safety', 'سلامة المواد الغذائية', 'Food-grade materials, BPA-free, non-reactive surfaces', 'مواد غذائية، خالية من BPA، أسطح غير تفاعلية', 10, 8, true, 3)
) AS v(name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
WHERE c.name = 'Safety & Compliance' AND c.domain_id = 'f88e5853-6f25-4734-86d2-f8c4d6b6cc2f';

-- Ease of Use & Maintenance criteria
INSERT INTO evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
SELECT c.id, v.name, v.name_ar, v.description, v.description_ar, v.max_score, v.weight, v.is_required, v.sort_order
FROM evaluation_criteria_categories c
CROSS JOIN (VALUES
  ('Ergonomic Design', 'تصميم مريح', 'User-friendly controls, comfortable operation', 'أدوات تحكم سهلة الاستخدام، تشغيل مريح', 10, 8, true, 1),
  ('Cleaning & Sanitation', 'التنظيف والتعقيم', 'Ease of disassembly, dishwasher-safe parts', 'سهولة الفك، أجزاء آمنة لغسالة الأطباق', 10, 8, true, 2),
  ('Spare Parts Availability', 'توفر قطع الغيار', 'Access to replacement parts and service', 'إمكانية الوصول إلى قطع الغيار والخدمة', 10, 5, false, 3)
) AS v(name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
WHERE c.name = 'Ease of Use & Maintenance' AND c.domain_id = 'f88e5853-6f25-4734-86d2-f8c4d6b6cc2f';

-- Value & ROI criteria
INSERT INTO evaluation_criteria (category_id, name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
SELECT c.id, v.name, v.name_ar, v.description, v.description_ar, v.max_score, v.weight, v.is_required, v.sort_order
FROM evaluation_criteria_categories c
CROSS JOIN (VALUES
  ('Price-Performance Ratio', 'نسبة السعر إلى الأداء', 'Value delivered relative to cost', 'القيمة المقدمة مقارنة بالتكلفة', 10, 10, true, 1),
  ('Energy Efficiency', 'كفاءة الطاقة', 'Power consumption and efficiency ratings', 'استهلاك الطاقة وتصنيفات الكفاءة', 10, 7, false, 2),
  ('Warranty & Support', 'الضمان والدعم', 'Warranty coverage and after-sales support', 'تغطية الضمان ودعم ما بعد البيع', 10, 5, false, 3)
) AS v(name, name_ar, description, description_ar, max_score, weight, is_required, sort_order)
WHERE c.name = 'Value & ROI' AND c.domain_id = 'f88e5853-6f25-4734-86d2-f8c4d6b6cc2f';
