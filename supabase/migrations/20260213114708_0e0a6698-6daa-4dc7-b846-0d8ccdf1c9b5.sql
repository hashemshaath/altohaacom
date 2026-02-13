
INSERT INTO requirement_items (name, name_ar, category, subcategory, unit, default_quantity, description, description_ar, is_active) VALUES
-- Ventilation
('Kitchen Hood (Commercial)', 'شفاط مطبخ (تجاري)', 'ventilation', 'hoods', 'piece', 1, 'Commercial kitchen exhaust hood', 'شفاط عادم مطبخ تجاري', true),
('Portable Exhaust Fan', 'مروحة شفط متنقلة', 'ventilation', 'fans', 'piece', 2, 'Portable ventilation fan', 'مروحة تهوية متنقلة', true),
('Air Filter (Replacement)', 'فلتر هواء (بديل)', 'ventilation', 'filters', 'piece', 4, 'Replacement air filter for hood', 'فلتر هواء بديل للشفاط', true),
('Ducting Kit', 'طقم مجاري هواء', 'ventilation', 'ducting', 'set', 1, 'Flexible ducting for exhaust', 'مجاري هواء مرنة للشفط', true),
-- Other
('Competition Signage', 'لافتات المسابقة', 'other', 'signage', 'set', 1, 'Directional and identification signs', 'لافتات إرشادية وتعريفية', true),
('Participant Badges/Lanyards', 'شارات/أحبال المشاركين', 'other', 'badges', 'pack', 1, 'ID badges and lanyards for participants', 'شارات تعريف وأحبال للمشاركين', true),
('Scoreboard / Display Screen', 'لوحة النتائج / شاشة عرض', 'other', 'display', 'piece', 1, 'Digital scoreboard or display', 'لوحة نتائج رقمية أو شاشة عرض', true),
('Timer / Stopwatch (Digital)', 'مؤقت / ساعة إيقاف (رقمية)', 'other', 'timing', 'piece', 4, 'Digital competition timer', 'مؤقت مسابقة رقمي', true),
('Clipboard & Judging Sheets', 'حافظة أوراق وأوراق تحكيم', 'other', 'judging', 'set', 10, 'For judges to score contestants', 'للحكام لتقييم المتسابقين', true),
('Pens (Box)', 'أقلام (علبة)', 'other', 'stationery', 'box', 2, 'Box of pens for judging', 'علبة أقلام للتحكيم', true),
-- More Equipment
('Sous Vide Machine', 'جهاز سو فيد', 'equipment', 'precision', 'piece', 1, 'Precision cooking device', 'جهاز طهي بالدقة', true),
('Vacuum Sealer', 'جهاز تغليف بالتفريغ', 'equipment', 'sealing', 'piece', 1, 'Vacuum packing machine', 'ماكينة تعبئة بالتفريغ', true),
('Meat Slicer', 'قطاعة لحم', 'equipment', 'slicing', 'piece', 1, 'Electric meat slicer', 'قطاعة لحم كهربائية', true),
('Dough Sheeter', 'فرادة عجين', 'equipment', 'baking', 'piece', 1, 'Dough rolling machine', 'ماكينة فرد العجين', true),
('Ice Machine', 'ماكينة ثلج', 'equipment', 'ice', 'piece', 1, 'Commercial ice maker', 'ماكينة ثلج تجارية', true),
-- More Cooking Stations
('Deep Fryer (Commercial)', 'قلاية عميقة (تجارية)', 'cooking_stations', 'fryers', 'piece', 1, 'Commercial deep fryer', 'قلاية عميقة تجارية', true),
('Flat Top Griddle', 'صاج مسطح', 'cooking_stations', 'griddles', 'piece', 1, 'Commercial flat griddle', 'صاج تجاري مسطح', true),
('Salamander / Broiler', 'سلامندر / شواية علوية', 'cooking_stations', 'broilers', 'piece', 1, 'Overhead broiler for finishing', 'شواية علوية للتحمير', true),
('Steamer (Commercial)', 'جهاز بخار (تجاري)', 'cooking_stations', 'steamers', 'piece', 1, 'Commercial food steamer', 'جهاز بخار طعام تجاري', true),
('Wok Burner', 'موقد ووك', 'cooking_stations', 'wok', 'piece', 1, 'High-BTU wok burner', 'موقد ووك عالي الحرارة', true),
-- More Venue Setup
('Prep Table (Stainless Steel)', 'طاولة تحضير (ستانلس ستيل)', 'venue_setup', 'tables', 'piece', 4, 'Stainless steel work table', 'طاولة عمل ستانلس ستيل', true),
('Shelving Unit (4-Tier)', 'وحدة رفوف (4 طوابق)', 'venue_setup', 'storage', 'piece', 2, 'Metal shelving for storage', 'رفوف معدنية للتخزين', true),
('Anti-Fatigue Floor Mat', 'سجادة مانعة للتعب', 'venue_setup', 'flooring', 'piece', 4, 'Rubber floor mat for standing', 'سجادة مطاطية للوقوف', true),
('Portable Hand Wash Station', 'محطة غسل أيدي متنقلة', 'venue_setup', 'hygiene', 'piece', 2, 'Mobile hand washing unit', 'وحدة غسل أيدي متنقلة', true),
('Waste Bin (Pedal, 60L)', 'سلة نفايات (دعاسة، 60 لتر)', 'venue_setup', 'waste', 'piece', 4, 'Pedal-operated waste bin', 'سلة نفايات بدعاسة', true),
-- More Uniforms (without duplicate Chef Hat)
('Disposable Gloves (Box)', 'قفازات استعمال مرة واحدة (علبة)', 'uniforms', 'gloves', 'box', 5, 'Nitrile disposable gloves', 'قفازات نيتريل للاستعمال مرة واحدة', true),
('Non-slip Kitchen Shoes', 'حذاء مطبخ مانع للانزلاق', 'uniforms', 'footwear', 'pair', 1, 'Safety kitchen footwear', 'حذاء أمان للمطبخ', true),
('Kitchen Towel (Set)', 'مناشف مطبخ (طقم)', 'uniforms', 'towels', 'set', 5, 'Cotton kitchen towels', 'مناشف مطبخ قطنية', true),
-- More Refrigeration
('Ice Chest / Cooler Box', 'صندوق تبريد / آيس بوكس', 'refrigeration', 'portable', 'piece', 2, 'Portable cooler for transport', 'صندوق تبريد متنقل للنقل', true),
('Chiller Display Cabinet', 'ثلاجة عرض', 'refrigeration', 'display', 'piece', 1, 'Glass door display fridge', 'ثلاجة عرض بباب زجاجي', true),
('Blast Chiller', 'جهاز تبريد سريع', 'refrigeration', 'blast', 'piece', 1, 'Rapid cooling unit', 'وحدة تبريد سريع', true),
-- More Electrical
('Power Strip (6-Way)', 'مشترك كهربائي (6 مخارج)', 'electrical', 'strips', 'piece', 6, 'Multi-outlet power strip', 'مشترك كهربائي متعدد المخارج', true),
('LED Work Light', 'إضاءة عمل LED', 'electrical', 'lighting', 'piece', 4, 'Portable LED light for workstation', 'إضاءة LED متنقلة لمحطة العمل', true),
('Electrical Panel (Portable)', 'لوحة كهرباء (متنقلة)', 'electrical', 'panels', 'piece', 1, 'Temporary power distribution', 'توزيع كهرباء مؤقت', true),
-- More Logistics
('Delivery Trolley', 'عربة توصيل', 'logistics', 'transport', 'piece', 2, 'Heavy-duty delivery cart', 'عربة توصيل شديدة التحمل', true),
('Storage Containers (Stackable)', 'حاويات تخزين (قابلة للتكديس)', 'logistics', 'storage', 'set', 5, 'Stackable plastic containers', 'حاويات بلاستيكية قابلة للتكديس', true),
('Labeling Machine', 'ماكينة تسمية', 'logistics', 'labeling', 'piece', 1, 'For labeling containers and items', 'لتسمية الحاويات والعناصر', true),
-- More Utilities
('Gas Regulator (Commercial)', 'منظم غاز (تجاري)', 'utilities', 'gas', 'piece', 2, 'Commercial gas pressure regulator', 'منظم ضغط غاز تجاري', true),
('Water Hose (Food Grade)', 'خرطوم مياه (آمن للغذاء)', 'utilities', 'water', 'piece', 2, 'Food-safe water supply hose', 'خرطوم إمداد مياه آمن للغذاء', true),
('Drainage Mat', 'سجادة تصريف', 'utilities', 'drainage', 'piece', 4, 'Floor drainage mat', 'سجادة تصريف أرضية', true),
-- More Safety & Hygiene
('Fire Extinguisher (CO2)', 'طفاية حريق (ثاني أكسيد الكربون)', 'safety_hygiene', 'fire', 'piece', 2, 'CO2 fire extinguisher', 'طفاية حريق ثاني أكسيد الكربون', true),
('Fire Blanket', 'بطانية إطفاء', 'safety_hygiene', 'fire', 'piece', 2, 'Emergency fire suppression blanket', 'بطانية إطفاء طوارئ', true),
('First Aid Kit (Professional)', 'حقيبة إسعافات أولية (مهنية)', 'safety_hygiene', 'first_aid', 'piece', 1, 'Professional first aid kit', 'حقيبة إسعافات أولية مهنية', true),
('Temperature Probe (Digital)', 'مسبار حرارة (رقمي)', 'safety_hygiene', 'monitoring', 'piece', 4, 'Digital food temperature probe', 'مسبار حرارة طعام رقمي', true),
('Disposable Hair Nets (Box)', 'شبكات شعر للاستعمال مرة واحدة (علبة)', 'safety_hygiene', 'hygiene', 'box', 2, 'Disposable hair nets', 'شبكات شعر للاستعمال مرة واحدة', true),
('Latex/Nitrile Gloves (Box)', 'قفازات لاتكس/نيتريل (علبة)', 'safety_hygiene', 'hygiene', 'box', 5, 'Food-safe disposable gloves', 'قفازات آمنة للطعام للاستعمال مرة واحدة', true),
-- More Grilling
('BBQ Tongs (Long)', 'ملقط شواء (طويل)', 'grilling', 'tools', 'piece', 4, 'Long-handled BBQ tongs', 'ملقط شواء بمقبض طويل', true),
('Grill Brush', 'فرشاة شواية', 'grilling', 'tools', 'piece', 2, 'Wire grill cleaning brush', 'فرشاة سلك لتنظيف الشواية', true),
('Smoking Wood Chips', 'رقائق خشب للتدخين', 'grilling', 'fuel', 'bag', 2, 'Wood chips for smoking', 'رقائق خشب للتدخين', true),
-- More Light Equipment
('Mandoline Slicer', 'قطاعة ماندولين', 'light_equipment', 'slicers', 'piece', 1, 'Adjustable mandoline slicer', 'قطاعة ماندولين قابلة للتعديل', true),
('Peeler (Y-Shape)', 'مقشرة (شكل Y)', 'light_equipment', 'peelers', 'piece', 4, 'Y-shaped vegetable peeler', 'مقشرة خضروات شكل Y', true),
('Silicone Spatula Set', 'طقم ملاعق سيليكون', 'light_equipment', 'spatulas', 'set', 1, 'Heat-resistant silicone spatulas', 'ملاعق سيليكون مقاومة للحرارة', true),
('Pastry Brush Set', 'طقم فرش معجنات', 'light_equipment', 'brushes', 'set', 1, 'Silicone pastry brushes', 'فرش معجنات سيليكون', true),
('Rolling Pin', 'فرادة عجين يدوية', 'light_equipment', 'rolling', 'piece', 2, 'Wooden or stainless rolling pin', 'فرادة عجين خشبية أو ستانلس', true),
('Piping Bag Set', 'طقم أكياس تزيين', 'light_equipment', 'pastry', 'set', 2, 'Piping bags with nozzles', 'أكياس تزيين مع رؤوس', true),
('Kitchen Scale (Digital)', 'ميزان مطبخ (رقمي)', 'light_equipment', 'measuring', 'piece', 2, 'Precision digital kitchen scale', 'ميزان مطبخ رقمي دقيق', true),
('Thermometer (Oven)', 'ميزان حرارة (فرن)', 'light_equipment', 'measuring', 'piece', 2, 'Oven temperature thermometer', 'ميزان حرارة للفرن', true),
-- More Decoration
('Dessert Plates (Round)', 'أطباق حلوى (دائرية)', 'decoration', 'plates', 'piece', 20, 'Round dessert plates', 'أطباق حلوى دائرية', true),
('Sauce Bottles (Squeeze)', 'زجاجات صوص (ضغط)', 'decoration', 'serving', 'piece', 6, 'Squeeze bottles for sauces', 'زجاجات ضغط للصوصات', true),
('Chopsticks (Set)', 'عيدان أكل (طقم)', 'decoration', 'cutlery', 'set', 10, 'Wooden or bamboo chopsticks', 'عيدان أكل خشبية أو بامبو', true),
('Ramekins (Set)', 'رامكينز (طقم)', 'decoration', 'serving', 'set', 10, 'Small ceramic dishes', 'أطباق سيراميك صغيرة', true),
-- More Beverage
('Juicer (Citrus)', 'عصارة (حمضيات)', 'beverage', 'juicers', 'piece', 1, 'Electric citrus juicer', 'عصارة حمضيات كهربائية', true),
('Ice Bucket', 'سطل ثلج', 'beverage', 'ice', 'piece', 4, 'Stainless steel ice bucket', 'سطل ثلج ستانلس ستيل', true),
-- More Meat & Seafood
('Whole Lamb', 'خروف كامل', 'meat_seafood', 'lamb', 'piece', 1, 'Whole lamb carcass', 'ذبيحة خروف كاملة', true),
('Duck Breast', 'صدر بط', 'meat_seafood', 'poultry', 'kg', 2, 'Boneless duck breast', 'صدر بط بدون عظم', true),
('Lobster (Live)', 'لوبستر (حي)', 'meat_seafood', 'shellfish', 'piece', 4, 'Live lobster', 'لوبستر حي', true),
('Squid / Calamari', 'حبار / كالاماري', 'meat_seafood', 'seafood', 'kg', 2, 'Fresh squid for cooking', 'حبار طازج للطبخ', true),
('Veal Tenderloin', 'فيليه عجل', 'meat_seafood', 'beef', 'kg', 2, 'Premium veal tenderloin', 'فيليه عجل ممتاز', true)
ON CONFLICT (name, category) DO NOTHING;
