import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from './api';
import { useUserConfigStore } from './userConfig';

const LOCALES = {
  uk: 'uk-UA',
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  pl: 'pl-PL',
};

export const usePreferencesStore = defineStore('preferences', () => {
  const userConfig = useUserConfigStore();
  const language = ref(userConfig.config.preferences.language || 'uk');
  const currency = ref(userConfig.config.preferences.currency || 'UAH');
  const displayCurrency = ref(
    userConfig.config.preferences.display_currency || userConfig.config.preferences.currency || 'UAH'
  );
  const theme = ref(userConfig.config.preferences.theme || 'dark');
  const isSyncing = ref(false);
  const systemScheme = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  const locale = computed(() => LOCALES[language.value] || LOCALES.uk);

  function applyTheme() {
    const prefersDark = systemScheme ? systemScheme.matches : false;
    const isDark = theme.value === 'dark' || (theme.value === 'auto' && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function applyLanguage() {
    document.documentElement.lang = language.value || 'uk';
  }

  function setTheme(nextTheme, persist = true) {
    theme.value = nextTheme;
    applyTheme();
    if (persist) {
      userConfig.setPreferences({ theme: nextTheme });
    }
  }

  function setLanguage(nextLanguage, persist = true) {
    language.value = nextLanguage;
    applyLanguage();
    if (persist) {
      userConfig.setPreferences({ language: nextLanguage });
    }
  }

  function setCurrency(nextCurrency, persist = true) {
    currency.value = nextCurrency;
    if (persist) {
      userConfig.setPreferences({ currency: nextCurrency });
    }
  }

  function setDisplayCurrency(nextCurrency, persist = true) {
    displayCurrency.value = nextCurrency;
    if (persist) {
      userConfig.setPreferences({ display_currency: nextCurrency });
    }
  }

  async function hydrateFromServer() {
    try {
      isSyncing.value = true;
      const res = await api.getProfile();
      if (res?.data) {
        if (res.data.language) {
          setLanguage(res.data.language, true);
        }
        if (res.data.currency) {
          setCurrency(res.data.currency, true);
        }
        if (res.data.display_currency) {
          setDisplayCurrency(res.data.display_currency, true);
        }
        if (res.data.theme) {
          setTheme(res.data.theme, true);
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences from server.', error);
    } finally {
      isSyncing.value = false;
    }
  }

  async function savePreferences() {
    try {
      isSyncing.value = true;
      await api.updatePreferences({
        language: language.value,
        currency: currency.value,
        display_currency: displayCurrency.value,
        theme: theme.value,
      });
    } catch (error) {
      console.error('Failed to save preferences.', error);
      throw error;
    } finally {
      isSyncing.value = false;
    }
  }

  function formatCurrency(value, options = {}) {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: displayCurrency.value,
      maximumFractionDigits: 0,
      ...options,
    }).format(value);
  }

  function formatDate(value, options = {}) {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString(locale.value, options);
  }

  applyTheme();
  applyLanguage();

  if (systemScheme) {
    systemScheme.addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme();
      }
    });
  }

  return {
    language,
    currency,
    displayCurrency,
    theme,
    locale,
    isSyncing,
    setTheme,
    setLanguage,
    setCurrency,
    setDisplayCurrency,
    hydrateFromServer,
    savePreferences,
    formatCurrency,
    formatDate,
  };
});
