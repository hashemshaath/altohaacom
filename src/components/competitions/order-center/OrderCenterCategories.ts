import {
  MapPin, Package, ShieldCheck, UtensilsCrossed, Flame, Lightbulb,
  Droplets, ClipboardList, Refrigerator, Shirt, GlassWater, Beef,
  Leaf, Wrench, Sparkles, Wind, Cable, Plug, Truck,
} from "lucide-react";

export const ORDER_CATEGORIES = [
  { value: "venue_setup", label: "Venue & Location", labelAr: "الموقع والمكان", icon: MapPin, description: "Size, layout, platforms", descriptionAr: "المساحة، التصميم، المنصات" },
  { value: "cooking_stations", label: "Cooking Stations", labelAr: "محطات الطهي", icon: Flame, description: "Stoves, ovens, grills", descriptionAr: "المواقد، الأفران، الشوايات" },
  { value: "refrigeration", label: "Refrigeration & Storage", labelAr: "التبريد والتخزين", icon: Refrigerator, description: "Fridges, freezers, storage", descriptionAr: "الثلاجات، المجمدات، التخزين" },
  { value: "equipment", label: "Heavy Equipment", labelAr: "المعدات الثقيلة", icon: Package, description: "Mixers, processors, machines", descriptionAr: "الخلاطات، المحضرات، الماكينات" },
  { value: "light_equipment", label: "Light Equipment & Tools", labelAr: "الأدوات والمعدات الخفيفة", icon: Wrench, description: "Knives, pans, pots, utensils", descriptionAr: "السكاكين، المقالي، القدور" },
  { value: "grilling", label: "Grilling Equipment", labelAr: "معدات الشوي", icon: Flame, description: "Open/closed grills, charcoal, gas", descriptionAr: "الشوايات المفتوحة والمغلقة" },
  { value: "beverage", label: "Beverage Equipment", labelAr: "معدات المشروبات", icon: GlassWater, description: "Blenders, espresso machines", descriptionAr: "الخلاطات، ماكينات الإسبريسو" },
  { value: "meat_seafood", label: "Meat & Seafood", labelAr: "اللحوم والمأكولات البحرية", icon: Beef, description: "Beef, chicken, fish, shellfish", descriptionAr: "لحم بقر، دجاج، أسماك" },
  { value: "food_ingredients", label: "Food Ingredients", labelAr: "المكونات الغذائية", icon: UtensilsCrossed, description: "Vegetables, dairy, grains", descriptionAr: "الخضروات، الألبان، الحبوب" },
  { value: "herbs_spices", label: "Herbs & Spices", labelAr: "الأعشاب والتوابل", icon: Leaf, description: "Fresh herbs, dry spices, oils", descriptionAr: "أعشاب طازجة، بهارات، زيوت" },
  { value: "decoration", label: "Decoration & Serving", labelAr: "الديكور والتقديم", icon: Sparkles, description: "Plates, garnishes, displays", descriptionAr: "أطباق، تزيينات، عرض" },
  { value: "uniforms", label: "Uniforms & Apparel", labelAr: "الزي الرسمي والملابس", icon: Shirt, description: "Chef coats, aprons, hats", descriptionAr: "جاكيت الشيف، المرايل، القبعات" },
  { value: "safety_hygiene", label: "Safety & Hygiene", labelAr: "السلامة والنظافة", icon: ShieldCheck, description: "Fire extinguishers, gloves, sanitizers", descriptionAr: "طفايات، قفازات، معقمات" },
  { value: "cleaning", label: "Cleaning Supplies", labelAr: "مستلزمات التنظيف", icon: Droplets, description: "Detergents, mops, trash bags", descriptionAr: "منظفات، ممسحات، أكياس" },
  { value: "utilities", label: "Utilities & Infrastructure", labelAr: "المرافق والبنية التحتية", icon: Plug, description: "Gas, water, electricity, drainage", descriptionAr: "الغاز، المياه، الكهرباء، الصرف" },
  { value: "ventilation", label: "Ventilation & Exhaust", labelAr: "التهوية والشفط", icon: Wind, description: "Hoods, fans, air filters", descriptionAr: "الشفاطات، المراوح، الفلاتر" },
  { value: "electrical", label: "Electrical & Cables", labelAr: "الكهرباء والكوابل", icon: Cable, description: "Extensions, panels, sockets", descriptionAr: "توصيلات، لوحات، مقابس" },
  { value: "logistics", label: "Logistics & Transport", labelAr: "اللوجستيات والنقل", icon: Truck, description: "Delivery, setup, teardown", descriptionAr: "التوصيل، التركيب، الإزالة" },
  { value: "other", label: "Other", labelAr: "أخرى", icon: ClipboardList, description: "Miscellaneous items", descriptionAr: "عناصر متنوعة" },
] as const;

export const ITEM_UNITS = [
  { value: "piece", label: "Piece", labelAr: "قطعة" },
  { value: "kg", label: "Kilogram", labelAr: "كيلوغرام" },
  { value: "g", label: "Gram", labelAr: "غرام" },
  { value: "liter", label: "Liter", labelAr: "لتر" },
  { value: "ml", label: "Milliliter", labelAr: "ملليلتر" },
  { value: "meter", label: "Meter", labelAr: "متر" },
  { value: "set", label: "Set", labelAr: "طقم" },
  { value: "box", label: "Box", labelAr: "صندوق" },
  { value: "roll", label: "Roll", labelAr: "لفة" },
  { value: "pack", label: "Pack", labelAr: "عبوة" },
  { value: "pair", label: "Pair", labelAr: "زوج" },
  { value: "bottle", label: "Bottle", labelAr: "زجاجة" },
  { value: "can", label: "Can", labelAr: "علبة" },
  { value: "bag", label: "Bag", labelAr: "كيس" },
  { value: "tray", label: "Tray", labelAr: "صينية" },
  { value: "bunch", label: "Bunch", labelAr: "حزمة" },
];

export type OrderCategory = typeof ORDER_CATEGORIES[number]["value"];
