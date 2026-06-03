/**
 * @file js/global-language.js
 * @description Global language state and translation helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.resolveInitialAppLanguage = function () {
  const fallbackLanguage = LocalDBStorage.getItem('app_language') || 'ar';

  try {
    const nativeLanguage = window.Localization &&
      typeof window.Localization.getCurrentLanguage === 'function'
      ? window.Localization.getCurrentLanguage()
      : null;

    const resolvedLanguage = nativeLanguage === 'en' || nativeLanguage === 'ar'
      ? nativeLanguage
      : fallbackLanguage;

    if (LocalDBStorage.getItem('app_language') !== resolvedLanguage) {
      LocalDBStorage.setItem('app_language', resolvedLanguage);
    }

    return resolvedLanguage;
  } catch (error) {
    console.warn('[Language] Failed to read native language preference:', error);
    return fallbackLanguage;
  }
};

window.app_language = typeof window.resolveInitialAppLanguage === 'function'
  ? window.resolveInitialAppLanguage()
  : (LocalDBStorage.getItem('app_language') || 'ar');
window.appTranslations = {};

window.translationLegacySuffixAliases = {
  '_confirm_btn': '.confirm_btn',
  '_cancel_btn': '.cancel_btn',
  '_title': '.title',
  '_text': '.text'
};

window.getTranslationKeyCandidates = function (key) {
  if (!key || typeof key !== 'string') return [];

  const candidates = [key];
  const suffixAliases = window.translationLegacySuffixAliases || {};
  const orderedSuffixes = Object.keys(suffixAliases).sort((a, b) => b.length - a.length);

  for (const suffix of orderedSuffixes) {
    if (!key.endsWith(suffix)) continue;
    const baseKey = key.slice(0, -suffix.length);
    if (!baseKey) continue;

    const nestedKey = `${baseKey}${suffixAliases[suffix]}`;
    if (!candidates.includes(nestedKey)) {
      candidates.push(nestedKey);
    }
  }

  return candidates;
};

window.getTranslationEntry = function (keyPath) {
  if (!keyPath || !window.appTranslations) return null;

  const parts = keyPath.split('.');
  let result = window.appTranslations;

  for (const part of parts) {
    if (result && Object.prototype.hasOwnProperty.call(result, part)) {
      result = result[part];
    } else {
      return null;
    }
  }

  return result;
};

window.langu = function (key, replacements) {
  const lang = window.app_language || 'ar';

  if (!window.appTranslations) return key;

  const candidates = typeof window.getTranslationKeyCandidates === 'function'
    ? window.getTranslationKeyCandidates(key)
    : [key];

  let result = null;
  for (const candidate of candidates) {
    const entry = typeof window.getTranslationEntry === 'function'
      ? window.getTranslationEntry(candidate)
      : null;

    if (entry != null) {
      result = entry;
      break;
    }
  }

  let text = key;
  if (result) {
    if (typeof result[lang] !== 'undefined') {
      text = result[lang];
    } else if (typeof result['ar'] !== 'undefined') {
      text = result['ar'];
    } else if (typeof result === 'string') {
      text = result;
    } else if (typeof result === 'object') {
      if (typeof result[lang] !== 'undefined') return result[lang];
      if (typeof result['ar'] !== 'undefined') return result['ar'];
      return result;
    }
  }

  if (typeof text === 'string' && replacements && typeof replacements === 'object') {
    Object.keys(replacements).forEach((replaceKey) => {
      const regex = new RegExp(`{${replaceKey}}`, 'g');
      text = text.replace(regex, replacements[replaceKey]);
    });
  }

  return text;
};
