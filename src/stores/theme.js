import { defineStore } from 'pinia';
import { computed } from 'vue';
import { usePreferencesStore } from './preferences';

export const useThemeStore = defineStore('theme', () => {
  const preferences = usePreferencesStore();
  const theme = computed(() => preferences.theme);

  function setTheme(newTheme) {
    preferences.setTheme(newTheme);
  }

  function toggleTheme() {
    preferences.setTheme(preferences.theme === 'light' ? 'dark' : 'light');
  }

  return { theme, setTheme, toggleTheme };
});
