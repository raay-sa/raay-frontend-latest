// src/utils/translations.js

/**
 * Extract translated content from API response
 * @param {Object} item - The item containing translations
 * @param {string} field - The field to extract
 * @param {string} locale - The locale to extract (default: 'ar')
 * @returns {string|Array} The translated content
 */
export const extractTranslation = (item, field, locale = 'ar') => {
  if (!item) return '';
  
  // If no translations array, return the direct field value
  if (!item.translations || !Array.isArray(item.translations)) {
    return item[field] || '';
  }
  
  // Find translation for the specified locale
  const translation = item.translations.find(t => t.locale === locale);
  
  // Return translated field or fallback to direct field value
  return translation?.[field] || item[field] || '';
};

/**
 * Extract multiple translated fields from an item
 * @param {Object} item - The item containing translations
 * @param {Array} fields - Array of field names to extract
 * @param {string} locale - The locale to extract (default: 'ar')
 * @returns {Object} Object with extracted fields
 */
export const extractTranslations = (item, fields, locale = 'ar') => {
  if (!item) return {};
  const result = {};
  fields.forEach(field => {
    result[field] = extractTranslation(item, field, locale);
  });
  return result;
};

/**
 * Process program list with translations
 * @param {Array} programs - Array of programs
 * @param {string} locale - The locale to extract (default: 'ar')
 * @returns {Array} Processed programs with translations
 */
export const processProgramsList = (programs, locale = 'ar') => {
  if (!Array.isArray(programs)) return [];
  return programs.map(program => {
    const learningArray = extractTranslation(program, 'learning', locale) || [];
    const requirementArray = extractTranslation(program, 'requirement', locale) || [];
    
    return {
      ...program,
      title: extractTranslation(program, 'title', locale),
      description: extractTranslation(program, 'description', locale),
      learning: formatLearningArray(learningArray),
      requirement: formatLearningArray(requirementArray),
      category: program.category ? {
        ...program.category,
        title: extractTranslation(program.category, 'title', locale)
      } : null
    };
  });
};

/**
 * Process single program with translations
 * @param {Object} program - The program object
 * @param {string} locale - The locale to extract (default: 'ar')
 * @returns {Object} Processed program with translations
 */
export const processProgram = (program, locale = 'ar') => {
  if (!program) return null;
  
  const learningArray = extractTranslation(program, 'learning', locale) || [];
  const requirementArray = extractTranslation(program, 'requirement', locale) || [];
  
  return {
    ...program,
    title: extractTranslation(program, 'title', locale),
    description: extractTranslation(program, 'description', locale),
    learning: formatLearningArray(learningArray),
    requirement: formatLearningArray(requirementArray),
    sections: Array.isArray(program.sections) ? program.sections.map(section => ({
      ...section,
      title: extractTranslation(section, 'title', locale)
    })) : []
  };
};

/**
 * Process sections list with translations
 * @param {Array} sections - Array of sections
 * @param {string} locale - The locale to extract (default: 'ar')
 * @returns {Array} Processed sections with translations
 */
export const processSectionsList = (sections, locale = 'ar') => {
  if (!Array.isArray(sections)) return [];
  return sections.map(section => ({
    ...section,
    title: extractTranslation(section, 'title', locale)
  }));
};

/**
 * Process sessions list with translations
 * @param {Array} sessions - Array of sessions
 * @param {string} locale - The locale to extract (default: 'ar')
 * @returns {Array} Processed sessions with translations
 */
export const processSessionsList = (sessions, locale = 'ar') => {
  if (!Array.isArray(sessions)) return [];
  return sessions.map(session => ({
    ...session,
    title: extractTranslation(session, 'title', locale)
  }));
};

/**
 * Create translation object for form submission
 * @param {string} ar - Arabic text
 * @param {string} en - English text
 * @returns {Object} Translation object
 */
export const createTranslation = (ar = '', en = '') => ({
  ar: ar.trim(),
  en: en.trim()
});

/**
 * Create array of translations for form submission
 * @param {Array} items - Array of items with ar/en properties
 * @returns {Array} Array of translation objects
 */
export const createTranslationsArray = (items = []) => {
  return items.map(item => ({
    ar: item.ar?.trim() || '',
    en: item.en?.trim() || ''
  }));
};

/**
 * Format learning or requirement array for display
 * @param {Array} items - Array of learning/requirement items
 * @returns {Array} Formatted array with proper strings
 */
export const formatLearningArray = (items = []) => {
  if (!Array.isArray(items)) return [];
  
  return items
    .map(item => {
      // Handle string items
      if (typeof item === 'string') return item.trim();
      
      // Handle object items with translations
      if (typeof item === 'object' && item !== null) {
        // If it has ar/en properties, return the Arabic version
        if (item.ar) return item.ar.trim();
        if (item.en) return item.en.trim();
        
        // If it's a simple object, try to get the first string value
        const values = Object.values(item).filter(v => typeof v === 'string' && v.trim());
        return values[0] || '';
      }
      
      return '';
    })
    .filter(item => item.length > 0);
};

/**
 * Get current locale from browser or default to 'ar'
 * @returns {string} Current locale
 */
export const getCurrentLocale = () => {
  // You can implement more sophisticated locale detection here
  return 'ar'; // Default to Arabic for now
};
