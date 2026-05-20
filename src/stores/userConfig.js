import { defineStore } from 'pinia';
import { ref } from 'vue';
import defaultConfig from '../user_configs.json';

const STORAGE_KEY = 'myhaven_user_config_v1';

function cloneDefault() {
  return JSON.parse(JSON.stringify(defaultConfig));
}

function mergeConfig(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }
  if (!base || typeof base !== 'object') {
    return override ?? base;
  }
  const result = {};
  Object.keys(base).forEach((key) => {
    result[key] = mergeConfig(base[key], override ? override[key] : undefined);
  });
  if (override && typeof override === 'object') {
    Object.keys(override).forEach((key) => {
      if (result[key] === undefined) {
        result[key] = override[key];
      }
    });
  }
  return result;
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeConfig(cloneDefault(), parsed);
    }
  } catch (error) {
    console.warn('Failed to load user config, using defaults.', error);
  }
  return cloneDefault();
}

export const useUserConfigStore = defineStore('userConfig', () => {
  const config = ref(loadConfig());

  function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value));
  }

  function setNavOrder(order) {
    config.value.navOrder = order;
    saveConfig();
  }

  function setDashboardWidgets(widgets) {
    config.value.dashboardWidgets = widgets;
    saveConfig();
  }

  function setPreferences(nextPreferences) {
    config.value.preferences = {
      ...config.value.preferences,
      ...nextPreferences,
    };
    saveConfig();
  }

  function resetConfig() {
    config.value = cloneDefault();
    saveConfig();
  }

  return {
    config,
    setNavOrder,
    setDashboardWidgets,
    setPreferences,
    resetConfig,
  };
});
