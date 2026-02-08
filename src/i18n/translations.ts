export const translations = {
  en: {
    // Navigation
    home: "Home",
    myProfile: "My Profile",
    competitions: "Competitions",
    community: "Community",
    shop: "Shop",
    signIn: "Sign In",
    signUp: "Join Now",
    signOut: "Sign Out",

    // Hero
    heroTitle: "The Culinary Community",
    heroSubtitle: "Connect, compete, and grow with chefs worldwide. Join the premier platform for culinary professionals.",
    joinNow: "Join Now",
    learnMore: "Learn More",

    // Features
    featuresTitle: "Everything for the Culinary World",
    communityTitle: "Community",
    communityDesc: "Connect with chefs, share recipes, and build your professional network in the culinary world.",
    competitionsTitle: "Competitions",
    competitionsDesc: "Participate in cooking competitions across all levels — from beginners to world-class professionals.",
    masterclassesTitle: "Masterclasses",
    masterclassesDesc: "Learn from the best with curated masterclasses, workshops, and culinary education programs.",
    shopTitle: "Culinary Shop",
    shopDesc: "Discover premium culinary tools, books, recipes, and professional services.",

    // Auth
    signInTitle: "Welcome Back",
    signUpTitle: "Join Altohaa",
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    confirmPassword: "Confirm Password",
    selectRole: "Select Your Role",
    noAccount: "Don't have an account?",
    hasAccount: "Already have a member?",
    signingIn: "Signing in...",
    signingUp: "Creating account...",

    // Roles
    chef: "Chef",
    judge: "Judge",
    student: "Student",
    organizer: "Organizer",
    volunteer: "Volunteer",
    sponsor: "Sponsor",
    assistant: "Assistant",
    supervisor: "Supervisor",

    // Profile
    editProfile: "Edit Profile",
    saveProfile: "Save Profile",
    saving: "Saving...",
    bio: "Bio",
    specialization: "Specialization",
    experienceLevel: "Experience Level",
    location: "Location",
    phone: "Phone",
    website: "Website",
    socialMedia: "Social Media",
    beginner: "Beginner",
    amateur: "Amateur",
    professional: "Professional",
    profileCompleted: "Profile Completed",
    completeProfile: "Complete Your Profile",
    completeProfileDesc: "Tell us more about yourself to get the most out of Altohaa.",

    // Footer
    footerTagline: "The premier culinary community platform connecting chefs worldwide.",
    quickLinks: "Quick Links",
    followUs: "Follow Us",
    allRightsReserved: "All rights reserved.",

    // Misc
    comingSoon: "Coming Soon",
    loading: "Loading...",
  },
  ar: {
    // Navigation
    home: "الرئيسية",
    myProfile: "ملفي الشخصي",
    competitions: "المسابقات",
    community: "المجتمع",
    shop: "المتجر",
    signIn: "تسجيل الدخول",
    signUp: "انضم الآن",
    signOut: "تسجيل الخروج",

    // Hero
    heroTitle: "مجتمع الطهي",
    heroSubtitle: "تواصل وتنافس وتطور مع الطهاة حول العالم. انضم إلى المنصة الرائدة للمحترفين في عالم الطهي.",
    joinNow: "انضم الآن",
    learnMore: "اعرف المزيد",

    // Features
    featuresTitle: "كل ما يخص عالم الطهي",
    communityTitle: "المجتمع",
    communityDesc: "تواصل مع الطهاة وشارك الوصفات وابنِ شبكتك المهنية في عالم الطهي.",
    competitionsTitle: "المسابقات",
    competitionsDesc: "شارك في مسابقات الطهي لجميع المستويات — من المبتدئين إلى المحترفين العالميين.",
    masterclassesTitle: "الدروس المتقدمة",
    masterclassesDesc: "تعلم من الأفضل مع دروس متقدمة وورش عمل وبرامج تعليم الطهي.",
    shopTitle: "متجر الطهي",
    shopDesc: "اكتشف أدوات الطهي الفاخرة والكتب والوصفات والخدمات المهنية.",

    // Auth
    signInTitle: "مرحباً بعودتك",
    signUpTitle: "انضم إلى ألتوها",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    confirmPassword: "تأكيد كلمة المرور",
    selectRole: "اختر دورك",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    signingIn: "جاري تسجيل الدخول...",
    signingUp: "جاري إنشاء الحساب...",

    // Roles
    chef: "طاهٍ",
    judge: "حكم",
    student: "طالب",
    organizer: "منظم",
    volunteer: "متطوع",
    sponsor: "راعٍ",
    assistant: "مساعد",
    supervisor: "مشرف",

    // Profile
    editProfile: "تعديل الملف الشخصي",
    saveProfile: "حفظ الملف الشخصي",
    saving: "جاري الحفظ...",
    bio: "نبذة عني",
    specialization: "التخصص",
    experienceLevel: "مستوى الخبرة",
    location: "الموقع",
    phone: "الهاتف",
    website: "الموقع الإلكتروني",
    socialMedia: "وسائل التواصل الاجتماعي",
    beginner: "مبتدئ",
    amateur: "هاوٍ",
    professional: "محترف",
    profileCompleted: "اكتمل الملف الشخصي",
    completeProfile: "أكمل ملفك الشخصي",
    completeProfileDesc: "أخبرنا المزيد عن نفسك للاستفادة القصوى من ألتوها.",

    // Footer
    footerTagline: "المنصة الرائدة لمجتمع الطهي تربط الطهاة حول العالم.",
    quickLinks: "روابط سريعة",
    followUs: "تابعنا",
    allRightsReserved: "جميع الحقوق محفوظة.",

    // Misc
    comingSoon: "قريباً",
    loading: "جاري التحميل...",
  },
} as const;

export type Language = "en" | "ar";
export type TranslationKey = keyof typeof translations.en;
