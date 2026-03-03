// src/pages/dashboard/Shared/Course/utils/index.js
export const BASE_URL = import.meta.env.VITE_BASE_URL || "";

export const joinUrl = (base, path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${String(base).replace(/\/+$/, "")}/${String(path).replace(
    /^\/+/,
    ""
  )}`;
};

export const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return v
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

export const ensureArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);

export const arDate = (iso) => {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(String(iso).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  const date = d.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("ar-SA", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { date, time };
};

export const nowHasPassed = (iso) => {
  if (!iso) return false;
  const d = new Date(String(iso).replace(" ", "T"));
  return Date.now() > d.getTime();
};

// map API entities to unified UI items
export const mapAssignment = (a) => {
  const { date, time } = arDate(a.date);
  let statusUi = "not-submitted";
  if (a.is_solved) statusUi = a.is_marked ? "graded-success" : "submitted";
  else if (nowHasPassed(a.date)) statusUi = "not-submitted-past";

  return {
    id: `A-${a.id}`,
    kind: "مهمة",
    programId: a.program_id,
    path: a.program?.title,
    title: a.title,
    description: a.description,
    dueDate: date,
    dueTime: time,
    status: statusUi,
    isSolved: !!a.is_solved,
    isMarked: !!a.is_marked,
    numericGrade: a.solutions_grade != null ? Number(a.solutions_grade) : null,
    grade: a.solutions_grade != null ? `${a.solutions_grade}%` : null,
  };
};

export const mapExam = (e) => {
  let statusUi = "ready-to-start";
  if (e.is_solved) statusUi = e.is_marked ? "marked" : "awaiting-mark";
  if (e.is_marked) {
    const last = e.last_grade != null ? Number(e.last_grade) : null;
    const pass = e.success_rate != null ? Number(e.success_rate) : null;
    if (last != null && pass != null)
      statusUi = last >= pass ? "passed" : "not-passed";
    else if (last != null) statusUi = "passed";
  }
  const isNumDuration = /^\d+$/.test(String(e.duration || ""));
  const durationLabel = isNumDuration
    ? `${e.duration} دقيقة`
    : e.duration || "—";

  return {
    id: `E-${e.id}`,
    kind: "اختبار",
    programId: e.program_id,
    path: e.program?.title,
    title: e.title,
    questions: e.questions_count ?? 0,
    duration: durationLabel,
    status: statusUi,
    isSolved: !!e.is_solved,
    isMarked: !!e.is_marked,
    numericGrade: e.last_grade != null ? Number(e.last_grade) : null,
    grade: e.last_grade != null ? `${e.last_grade}%` : null,
    remainingTries: e.remaining_tries ?? 0,
    successRate: e.success_rate != null ? Number(e.success_rate) : null,
  };
};

// Utility function to extract category name from translations
export const getCategoryName = (category, locale = 'ar') => {
  if (!category) return '';
  
  // If category has translations array
  if (category.translations && Array.isArray(category.translations)) {
    const translation = category.translations.find(t => t.locale === locale);
    return translation?.title || '';
  }
  
  // Fallback to direct title field
  return category.title || '';
};

// Utility function to get both Arabic and English category names
export const getCategoryNames = (category) => {
  if (!category) return { ar: '', en: '' };
  
  // If category has translations array
  if (category.translations && Array.isArray(category.translations)) {
    const arTranslation = category.translations.find(t => t.locale === 'ar');
    const enTranslation = category.translations.find(t => t.locale === 'en');
    
    return {
      ar: arTranslation?.title || '',
      en: enTranslation?.title || ''
    };
  }
  
  // Fallback to direct title field
  return {
    ar: category.title || '',
    en: ''
  };
};

// Utility function to get category image based on locale
export const getCategoryImage = (category, locale = 'ar') => {
  if (!category) return '';
  
  // Return the appropriate image based on locale
  if (locale === 'ar' && category.image_ar) {
    return category.image_ar;
  } else if (locale === 'en' && category.image_en) {
    return category.image_en;
  }
  
  // Fallback to the other locale's image if available
  if (locale === 'ar' && category.image_en) {
    return category.image_en;
  } else if (locale === 'en' && category.image_ar) {
    return category.image_ar;
  }
  
  // Fallback to legacy image field
  return category.image || '';
};

// Utility function to process categories list and extract names and images
export const processCategoriesList = (categories) => {
  if (!Array.isArray(categories)) return [];
  
  return categories.map(category => {
    const names = getCategoryNames(category);
    return {
      ...category,
      title: names.ar,
      title_ar: names.ar,
      title_en: names.en,
      image: getCategoryImage(category, 'ar'), // Default to Arabic image for backward compatibility
      image_ar: category.image_ar || category.image || '',
      image_en: category.image_en || category.image || ''
    };
  });
};