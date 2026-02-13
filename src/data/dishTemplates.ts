import {
  GlassWater, Flame, Pizza, Salad, Sandwich, CookingPot, Wheat, Beef,
  Leaf, Droplets, UtensilsCrossed, Refrigerator, Plug, Package,
  Snowflake, Cherry, Carrot, Egg, Fish, Milk, Apple, Citrus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface IngredientItem {
  name: string;
  nameAr: string;
  quantity: number;
  unit: string;
  category: string;
  icon: LucideIcon;
}

export interface DishTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: LucideIcon;
  color: string;
  ingredients: IngredientItem[];
}

export const DISH_TEMPLATES: DishTemplate[] = [
  {
    id: "mocktail",
    name: "Mocktail",
    nameAr: "موكتيل",
    description: "Non-alcoholic cocktail preparation",
    descriptionAr: "تحضير كوكتيلات غير كحولية",
    icon: GlassWater,
    color: "chart-3",
    ingredients: [
      { name: "Fresh Fruits (Assorted)", nameAr: "فواكه طازجة متنوعة", quantity: 5, unit: "kg", category: "food_ingredients", icon: Apple },
      { name: "Fresh Mint Leaves", nameAr: "أوراق نعناع طازجة", quantity: 10, unit: "bunch", category: "herbs_spices", icon: Leaf },
      { name: "Citrus (Lemon, Orange, Lime)", nameAr: "حمضيات (ليمون، برتقال، لايم)", quantity: 3, unit: "kg", category: "food_ingredients", icon: Citrus },
      { name: "Syrups (Grenadine, Vanilla, Rose)", nameAr: "شراب (رمان، فانيلا، ورد)", quantity: 6, unit: "bottle", category: "food_ingredients", icon: Droplets },
      { name: "Sparkling Water", nameAr: "مياه غازية", quantity: 24, unit: "bottle", category: "beverage", icon: GlassWater },
      { name: "Ice Machine", nameAr: "ماكينة ثلج", quantity: 1, unit: "piece", category: "equipment", icon: Snowflake },
      { name: "Blender (Commercial)", nameAr: "خلاط تجاري", quantity: 2, unit: "piece", category: "beverage", icon: Package },
      { name: "Cocktail Shaker Set", nameAr: "طقم شيكر كوكتيل", quantity: 4, unit: "set", category: "light_equipment", icon: UtensilsCrossed },
      { name: "Serving Glasses (Various)", nameAr: "كؤوس تقديم متنوعة", quantity: 50, unit: "piece", category: "decoration", icon: GlassWater },
      { name: "Garnish Tools", nameAr: "أدوات تزيين", quantity: 2, unit: "set", category: "light_equipment", icon: UtensilsCrossed },
    ],
  },
  {
    id: "grilling",
    name: "Grilling",
    nameAr: "شوي",
    description: "Grilled meats and vegetables preparation",
    descriptionAr: "تحضير اللحوم والخضروات المشوية",
    icon: Flame,
    color: "destructive",
    ingredients: [
      { name: "Gas Grill (Top Burner)", nameAr: "شواية غاز (حارق علوي)", quantity: 2, unit: "piece", category: "grilling", icon: Flame },
      { name: "Charcoal Grill", nameAr: "شواية فحم", quantity: 1, unit: "piece", category: "grilling", icon: Flame },
      { name: "Beef Cuts (Assorted)", nameAr: "قطع لحم بقري متنوعة", quantity: 10, unit: "kg", category: "meat_seafood", icon: Beef },
      { name: "Chicken (Whole & Parts)", nameAr: "دجاج (كامل وأجزاء)", quantity: 8, unit: "kg", category: "meat_seafood", icon: Beef },
      { name: "Fresh Vegetables for Grilling", nameAr: "خضروات طازجة للشوي", quantity: 5, unit: "kg", category: "food_ingredients", icon: Carrot },
      { name: "Marinades & Spice Rubs", nameAr: "تتبيلات وبهارات", quantity: 2, unit: "kg", category: "herbs_spices", icon: Leaf },
      { name: "Charcoal", nameAr: "فحم", quantity: 20, unit: "kg", category: "grilling", icon: Flame },
      { name: "Grilling Tongs & Spatulas", nameAr: "ملاقط ومقالب شوي", quantity: 4, unit: "set", category: "light_equipment", icon: UtensilsCrossed },
      { name: "Meat Thermometer", nameAr: "مقياس حرارة اللحم", quantity: 2, unit: "piece", category: "light_equipment", icon: UtensilsCrossed },
      { name: "Refrigerator (Upright)", nameAr: "ثلاجة عمودية", quantity: 1, unit: "piece", category: "refrigeration", icon: Refrigerator },
      { name: "Olive Oil", nameAr: "زيت زيتون", quantity: 5, unit: "liter", category: "herbs_spices", icon: Droplets },
      { name: "Fresh Parsley & Cilantro", nameAr: "بقدونس وكزبرة طازجة", quantity: 5, unit: "bunch", category: "herbs_spices", icon: Leaf },
    ],
  },
  {
    id: "pizza",
    name: "Pizza",
    nameAr: "بيتزا",
    description: "Pizza preparation and baking",
    descriptionAr: "تحضير وخبز البيتزا",
    icon: Pizza,
    color: "chart-4",
    ingredients: [
      { name: "Pizza Oven (Wood/Gas)", nameAr: "فرن بيتزا (حطب/غاز)", quantity: 1, unit: "piece", category: "cooking_stations", icon: Flame },
      { name: "Pizza Flour (00 Grade)", nameAr: "طحين بيتزا (درجة 00)", quantity: 10, unit: "kg", category: "food_ingredients", icon: Wheat },
      { name: "Dry Yeast", nameAr: "خميرة جافة", quantity: 500, unit: "g", category: "food_ingredients", icon: Package },
      { name: "Mozzarella Cheese", nameAr: "جبنة موتزاريلا", quantity: 5, unit: "kg", category: "food_ingredients", icon: Milk },
      { name: "San Marzano Tomatoes", nameAr: "طماطم سان مارزانو", quantity: 10, unit: "can", category: "food_ingredients", icon: Cherry },
      { name: "Fresh Basil", nameAr: "ريحان طازج", quantity: 5, unit: "bunch", category: "herbs_spices", icon: Leaf },
      { name: "Olive Oil (Extra Virgin)", nameAr: "زيت زيتون بكر", quantity: 3, unit: "liter", category: "herbs_spices", icon: Droplets },
      { name: "Pizza Peel (Wooden)", nameAr: "مجرفة بيتزا (خشبية)", quantity: 3, unit: "piece", category: "light_equipment", icon: UtensilsCrossed },
      { name: "Pizza Cutter", nameAr: "قطاعة بيتزا", quantity: 4, unit: "piece", category: "light_equipment", icon: UtensilsCrossed },
      { name: "Dough Mixer", nameAr: "عجانة عجين", quantity: 1, unit: "piece", category: "equipment", icon: Package },
      { name: "Assorted Toppings", nameAr: "إضافات متنوعة", quantity: 3, unit: "kg", category: "food_ingredients", icon: UtensilsCrossed },
    ],
  },
  {
    id: "couscous",
    name: "Couscous",
    nameAr: "كسكس",
    description: "Traditional couscous preparation",
    descriptionAr: "تحضير الكسكس التقليدي",
    icon: CookingPot,
    color: "chart-1",
    ingredients: [
      { name: "Couscous (Fine/Medium)", nameAr: "كسكس (ناعم/متوسط)", quantity: 5, unit: "kg", category: "food_ingredients", icon: Wheat },
      { name: "Lamb Shoulder", nameAr: "كتف خروف", quantity: 8, unit: "kg", category: "meat_seafood", icon: Beef },
      { name: "Chickpeas (Dried)", nameAr: "حمص مجفف", quantity: 2, unit: "kg", category: "food_ingredients", icon: Package },
      { name: "Turnips", nameAr: "لفت", quantity: 3, unit: "kg", category: "food_ingredients", icon: Carrot },
      { name: "Zucchini", nameAr: "كوسة", quantity: 3, unit: "kg", category: "food_ingredients", icon: Carrot },
      { name: "Carrots", nameAr: "جزر", quantity: 2, unit: "kg", category: "food_ingredients", icon: Carrot },
      { name: "Onions", nameAr: "بصل", quantity: 3, unit: "kg", category: "food_ingredients", icon: Carrot },
      { name: "Harissa Paste", nameAr: "معجون هريسة", quantity: 1, unit: "kg", category: "herbs_spices", icon: Leaf },
      { name: "Couscousier (Steamer Pot)", nameAr: "كسكاس (قدر بخار)", quantity: 2, unit: "piece", category: "cooking_stations", icon: CookingPot },
      { name: "Gas Burner (High BTU)", nameAr: "حارق غاز (قوة عالية)", quantity: 2, unit: "piece", category: "cooking_stations", icon: Flame },
      { name: "Ras el Hanout Spice", nameAr: "بهارات رأس الحانوت", quantity: 500, unit: "g", category: "herbs_spices", icon: Leaf },
    ],
  },
  {
    id: "sandwiches",
    name: "Sandwiches",
    nameAr: "سندويشات",
    description: "Gourmet sandwich preparation",
    descriptionAr: "تحضير سندويشات فاخرة",
    icon: Sandwich,
    color: "chart-2",
    ingredients: [
      { name: "Artisan Bread (Assorted)", nameAr: "خبز حرفي متنوع", quantity: 30, unit: "piece", category: "food_ingredients", icon: Wheat },
      { name: "Deli Meats (Assorted)", nameAr: "لحوم باردة متنوعة", quantity: 5, unit: "kg", category: "meat_seafood", icon: Beef },
      { name: "Cheese Slices (Assorted)", nameAr: "شرائح جبن متنوعة", quantity: 3, unit: "kg", category: "food_ingredients", icon: Milk },
      { name: "Fresh Lettuce & Greens", nameAr: "خس وورقيات طازجة", quantity: 3, unit: "kg", category: "food_ingredients", icon: Salad },
      { name: "Tomatoes", nameAr: "طماطم", quantity: 3, unit: "kg", category: "food_ingredients", icon: Cherry },
      { name: "Condiments & Sauces", nameAr: "صلصات وتوابل", quantity: 2, unit: "kg", category: "herbs_spices", icon: Droplets },
      { name: "Eggs", nameAr: "بيض", quantity: 60, unit: "piece", category: "food_ingredients", icon: Egg },
      { name: "Panini Press / Flat Grill", nameAr: "مكبس بانيني / شواية مسطحة", quantity: 2, unit: "piece", category: "cooking_stations", icon: Flame },
      { name: "Cutting Board (Large)", nameAr: "لوح تقطيع (كبير)", quantity: 4, unit: "piece", category: "light_equipment", icon: UtensilsCrossed },
      { name: "Sandwich Wrapping Paper", nameAr: "ورق تغليف سندويشات", quantity: 200, unit: "piece", category: "decoration", icon: Package },
    ],
  },
  {
    id: "kabsa",
    name: "Kabsa",
    nameAr: "كبسة",
    description: "Traditional Saudi rice dish",
    descriptionAr: "طبق الأرز السعودي التقليدي",
    icon: CookingPot,
    color: "chart-5",
    ingredients: [
      { name: "Basmati Rice (Long Grain)", nameAr: "أرز بسمتي (حبة طويلة)", quantity: 10, unit: "kg", category: "food_ingredients", icon: Wheat },
      { name: "Whole Lamb", nameAr: "خروف كامل", quantity: 2, unit: "piece", category: "meat_seafood", icon: Beef },
      { name: "Chicken (Whole)", nameAr: "دجاج كامل", quantity: 10, unit: "piece", category: "meat_seafood", icon: Beef },
      { name: "Onions", nameAr: "بصل", quantity: 5, unit: "kg", category: "food_ingredients", icon: Carrot },
      { name: "Tomatoes", nameAr: "طماطم", quantity: 3, unit: "kg", category: "food_ingredients", icon: Cherry },
      { name: "Kabsa Spice Mix", nameAr: "بهارات كبسة", quantity: 1, unit: "kg", category: "herbs_spices", icon: Leaf },
      { name: "Dried Limes (Loomi)", nameAr: "ليمون مجفف (لومي)", quantity: 500, unit: "g", category: "herbs_spices", icon: Citrus },
      { name: "Saffron", nameAr: "زعفران", quantity: 50, unit: "g", category: "herbs_spices", icon: Leaf },
      { name: "Large Cooking Pot (50L+)", nameAr: "قدر طبخ كبير (50 لتر+)", quantity: 2, unit: "piece", category: "cooking_stations", icon: CookingPot },
      { name: "Gas Burner (Heavy Duty)", nameAr: "حارق غاز (تحمل عالي)", quantity: 2, unit: "piece", category: "cooking_stations", icon: Flame },
      { name: "Ghee (Clarified Butter)", nameAr: "سمن بلدي", quantity: 2, unit: "kg", category: "food_ingredients", icon: Droplets },
      { name: "Almonds & Raisins", nameAr: "لوز وزبيب", quantity: 1, unit: "kg", category: "food_ingredients", icon: Package },
      { name: "Fresh Parsley", nameAr: "بقدونس طازج", quantity: 5, unit: "bunch", category: "herbs_spices", icon: Leaf },
    ],
  },
  {
    id: "harees",
    name: "Harees",
    nameAr: "هريس",
    description: "Traditional wheat and meat porridge",
    descriptionAr: "عصيدة القمح واللحم التقليدية",
    icon: CookingPot,
    color: "primary",
    ingredients: [
      { name: "Crushed Wheat (Jareesh)", nameAr: "قمح مجروش (جريش)", quantity: 5, unit: "kg", category: "food_ingredients", icon: Wheat },
      { name: "Lamb Meat (Boneless)", nameAr: "لحم خروف (بدون عظم)", quantity: 5, unit: "kg", category: "meat_seafood", icon: Beef },
      { name: "Ghee", nameAr: "سمن", quantity: 2, unit: "kg", category: "food_ingredients", icon: Droplets },
      { name: "Salt", nameAr: "ملح", quantity: 1, unit: "kg", category: "herbs_spices", icon: Package },
      { name: "Cinnamon Sticks", nameAr: "أعواد قرفة", quantity: 200, unit: "g", category: "herbs_spices", icon: Leaf },
      { name: "Cardamom Pods", nameAr: "حبات هيل", quantity: 200, unit: "g", category: "herbs_spices", icon: Leaf },
      { name: "Large Heavy Pot (50L)", nameAr: "قدر ثقيل كبير (50 لتر)", quantity: 2, unit: "piece", category: "cooking_stations", icon: CookingPot },
      { name: "Gas Burner (Low-Slow)", nameAr: "حارق غاز (نار هادئة)", quantity: 2, unit: "piece", category: "cooking_stations", icon: Flame },
      { name: "Wooden Stirring Paddle", nameAr: "مضرب خشبي للتحريك", quantity: 2, unit: "piece", category: "light_equipment", icon: UtensilsCrossed },
      { name: "Electric Hand Mixer", nameAr: "خلاط يدوي كهربائي", quantity: 1, unit: "piece", category: "equipment", icon: Package },
    ],
  },
];
