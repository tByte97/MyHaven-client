<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../stores/api';
import { useAuthStore } from '../stores/auth';
import { usePreferencesStore } from '../stores/preferences';
import { useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import {
  User,
  Shield,
  Palette,
  Globe,
  Bell,
  FileText,
  Save,
  Edit3,
  Mail,
  Lock,
  Download,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader,
} from 'lucide-vue-next';

const auth = useAuthStore();
const preferencesStore = usePreferencesStore();
const router = useRouter();

// ===== TAB MANAGEMENT =====
const activeTab = ref('profile');

const tabs = [
  { id: 'profile', label: 'Профіль', icon: User },
  { id: 'security', label: 'Безпека', icon: Shield },
  { id: 'appearance', label: 'Зовнішній вигляд', icon: Palette },
  { id: 'locale', label: 'Мова та Регіон', icon: Globe },
  { id: 'notifications', label: 'Повідомлення', icon: Bell },
];

// ===== PROFILE TAB =====
const profile = ref({ username: '', email: '', first_name: '', last_name: '', date_joined: '' });
const isEditing = ref(false);
const editForm = ref({});
const profileMsg = ref('');

async function fetchProfile() {
  try {
    const res = await api.getProfile();
    profile.value = res.data;
  } catch (e) {
    console.error(e);
  }
}

function startEdit() {
  editForm.value = { ...profile.value };
  isEditing.value = true;
  profileMsg.value = '';
}

async function saveProfile() {
  try {
    const res = await api.updateProfile({
      first_name: editForm.value.first_name,
      last_name: editForm.value.last_name,
      email: editForm.value.email,
    });
    profile.value = res.data;
    isEditing.value = false;
    profileMsg.value = 'Профіль оновлено!';
    setTimeout(() => { profileMsg.value = ''; }, 3000);
  } catch (e) {
    console.error(e);
    profileMsg.value = 'Помилка збереження';
  }
}

// ===== SECURITY TAB =====
const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '' });
const passwordMsg = ref('');
const passwordError = ref('');

const totpEnabled = ref(false);
const totpQrCode = ref('');
const totpSecret = ref('');
const totpCode = ref('');
const totpMsg = ref('');
const totpError = ref('');
const showTotpSetup = ref(false);

async function changePassword() {
  passwordError.value = '';
  passwordMsg.value = '';

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    passwordError.value = 'Паролі не збігаються';
    return;
  }

  try {
    await api.changePassword({
      old_password: passwordForm.value.old_password,
      new_password: passwordForm.value.new_password,
    });
    passwordMsg.value = 'Пароль змінено!';
    passwordForm.value = { old_password: '', new_password: '', confirm_password: '' };
    setTimeout(() => { passwordMsg.value = ''; }, 3000);
  } catch (e) {
    const data = e.response?.data;
    if (data?.old_password) {
      passwordError.value = data.old_password[0];
    } else if (data?.new_password) {
      passwordError.value = data.new_password[0];
    } else {
      passwordError.value = 'Помилка зміни пароля';
    }
  }
}

async function setupTOTP() {
  try {
    const res = await api.getTOTPSetup();
    totpQrCode.value = res.data.qr_code;
    totpSecret.value = res.data.secret;
    showTotpSetup.value = true;
  } catch (e) {
    console.error(e);
    totpError.value = 'Помилка налаштування 2FA';
  }
}

async function enableTOTP() {
  totpError.value = '';
  try {
    await api.enableTOTP({ code: totpCode.value, secret: totpSecret.value });
    totpEnabled.value = true;
    showTotpSetup.value = false;
    totpMsg.value = 'Двофакторну аутентифікацію увімкнено!';
    totpCode.value = '';
    setTimeout(() => { totpMsg.value = ''; }, 3000);
  } catch (e) {
    totpError.value = e.response?.data?.error || 'Невірний код';
  }
}

async function disableTOTP() {
  const password = prompt('Введіть пароль для вимкнення 2FA:');
  if (!password) return;

  try {
    await api.disableTOTP({ password });
    totpEnabled.value = false;
    totpMsg.value = 'Двофакторну аутентифікацію вимкнено';
    setTimeout(() => { totpMsg.value = ''; }, 3000);
  } catch (e) {
    totpError.value = e.response?.data?.error || 'Помилка вимкнення 2FA';
  }
}

// ===== APPEARANCE TAB =====
const appearanceMsg = ref('');
const appearanceError = ref('');
const selectedTheme = computed({
  get: () => preferencesStore.theme,
  set: (value) => preferencesStore.setTheme(value),
});

function updateTheme(newTheme) {
  selectedTheme.value = newTheme;
  appearanceMsg.value = '';
  appearanceError.value = '';
}

async function saveAppearance() {
  try {
    await preferencesStore.savePreferences();
    appearanceMsg.value = 'Тему збережено!';
    appearanceError.value = '';
    setTimeout(() => { appearanceMsg.value = ''; }, 3000);
  } catch (e) {
    console.error(e);
    appearanceError.value = 'Помилка збереження теми';
  }
}

// ===== LOCALE TAB =====
const preferencesMsg = ref('');

const languageModel = computed({
  get: () => preferencesStore.language,
  set: (value) => preferencesStore.setLanguage(value),
});

const currencyModel = computed({
  get: () => preferencesStore.currency,
  set: (value) => preferencesStore.setCurrency(value),
});

async function savePreferences() {
  try {
    await preferencesStore.savePreferences();
    preferencesMsg.value = 'Налаштування збережено!';
    setTimeout(() => { preferencesMsg.value = ''; }, 3000);
  } catch (e) {
    console.error(e);
    preferencesMsg.value = 'Помилка збереження';
  }
}

// ===== NOTIFICATIONS TAB =====
const notifications = ref({
  email_notifications: true,
  telegram_notifications: false,
  notify_large_expense: true,
  notify_budget_exceeded: true,
  notify_daily_summary: false,
});
const notificationsMsg = ref('');
const telegramStatus = ref({ connected: false, username: null });

async function fetchNotifications() {
  try {
    const res = await api.getProfile();
    notifications.value = {
      email_notifications: res.data.email_notifications ?? true,
      telegram_notifications: res.data.telegram_notifications ?? false,
      notify_large_expense: res.data.notify_large_expense ?? true,
      notify_budget_exceeded: res.data.notify_budget_exceeded ?? true,
      notify_daily_summary: res.data.notify_daily_summary ?? false,
    };
    telegramStatus.value = {
      connected: !!res.data.telegram_user_id,
      username: res.data.telegram_username,
    };
  } catch (e) {
    console.error(e);
  }
}

async function saveNotifications() {
  try {
    await api.updateNotificationSettings(notifications.value);
    notificationsMsg.value = 'Налаштування повідомлень збережено!';
    setTimeout(() => { notificationsMsg.value = ''; }, 3000);
  } catch (e) {
    console.error(e);
    notificationsMsg.value = 'Помилка збереження';
  }
}

const showTelegramLink = ref(false);
const telegramLinkToken = ref('');
const telegramLinkExpires = ref('');
const telegramLinkError = ref('');
const telegramLinkMsg = ref('');
const isLinkLoading = ref(false);
const isUnlinkLoading = ref(false);

async function connectTelegram() {
  telegramLinkError.value = '';
  telegramLinkMsg.value = '';
  isLinkLoading.value = true;
  try {
    const res = await api.createTelegramLinkCode();
    telegramLinkToken.value = res.data.secret;
    telegramLinkExpires.value = res.data.expires_at;
    showTelegramLink.value = true;
    telegramLinkMsg.value = 'Ключ створено. Надішліть його боту через кнопку прив’язки.';
  } catch (e) {
    console.error(e);
    telegramLinkError.value = 'Не вдалося створити секретний ключ';
  } finally {
    isLinkLoading.value = false;
  }
}

async function unlinkTelegram() {
  telegramLinkError.value = '';
  telegramLinkMsg.value = '';
  if (!confirm('Відв’язати Telegram від цього профілю? Бот втратить доступ до акаунта.')) return;

  isUnlinkLoading.value = true;
  try {
    await api.unlinkTelegram();
    telegramStatus.value = { connected: false, username: null };
    notifications.value.telegram_notifications = false;
    showTelegramLink.value = false;
    telegramLinkToken.value = '';
    telegramLinkExpires.value = '';
    telegramLinkMsg.value = 'Telegram відв’язано. Старий ключ і доступ бота видалені.';
    await fetchProfile();
  } catch (e) {
    console.error(e);
    telegramLinkError.value = 'Не вдалося відв’язати Telegram';
  } finally {
    isUnlinkLoading.value = false;
  }
}

async function copyTelegramLink() {
  if (!telegramLinkToken.value) return;
  try {
    await navigator.clipboard.writeText(telegramLinkToken.value);
  } catch (e) {
    console.error(e);
  }
}

// ===== FILES & DATA TAB =====
const uploads = ref([]);
const banks = ref([]);
const isLoadingFiles = ref(true);
const isUploading = ref(false);
const selectedBank = ref('');
const selectedFile = ref(null);
const deletePassword = ref('');
const deleteError = ref('');

const statusIcons = {
  COMPLETED: CheckCircle,
  FAILED: AlertCircle,
  PENDING: Clock,
  PROCESSING: Loader,
};

const statusColors = {
  COMPLETED: 'text-green-600 dark:text-green-400',
  FAILED: 'text-red-500 dark:text-red-400',
  PENDING: 'text-yellow-500 dark:text-yellow-400',
  PROCESSING: 'text-blue-500 dark:text-blue-400',
};

const statusLabels = {
  COMPLETED: 'Завершено',
  FAILED: 'Помилка',
  PENDING: 'Очікує',
  PROCESSING: 'В обробці',
};

async function fetchUploads() {
  isLoadingFiles.value = true;
  try {
    const res = await api.getUploads();
    uploads.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    isLoadingFiles.value = false;
  }
}

async function fetchBanks() {
  try {
    const res = await api.getBanks();
    banks.value = res.data;
  } catch (e) {
    console.error(e);
  }
}

function onFileSelect(e) {
  selectedFile.value = e.target.files[0];
}

async function uploadFile() {
  if (!selectedFile.value || !selectedBank.value) {
    alert('Оберіть банк та файл');
    return;
  }
  isUploading.value = true;
  try {
    const formData = new FormData();
    formData.append('bank', selectedBank.value);
    formData.append('file', selectedFile.value);
    await api.uploadFile(formData);
    selectedFile.value = null;
    selectedBank.value = '';
    fetchUploads();
  } catch (e) {
    console.error(e);
    alert('Помилка завантаження файлу');
  } finally {
    isUploading.value = false;
  }
}

async function deleteUpload(id) {
  if (!confirm('Видалити цю виписку та всі її транзакції?')) return;
  try {
    await api.deleteUpload(id);
    fetchUploads();
  } catch (e) {
    console.error(e);
  }
}

function formatDate(d) {
  return preferencesStore.formatDate(d, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(d) {
  return preferencesStore.formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' });
}

async function exportData() {
  try {
    const res = await api.exportData();
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myhaven_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert('Помилка експорту даних');
  }
}

async function deleteAccount() {
  deleteError.value = '';
  if (!confirm('Ви впевнені? Цю дію не можна скасувати!')) return;
  try {
    await api.deleteAccount({ password: deletePassword.value });
    auth.logout();
    router.push('/login');
  } catch (e) {
    const data = e.response?.data;
    deleteError.value = data?.password?.[0] || 'Помилка видалення';
  }
}

onMounted(() => {
  fetchProfile();
  preferencesStore.hydrateFromServer();
  fetchNotifications();

  // Check TOTP status from profile
  api.getProfile().then(res => {
    totpEnabled.value = res.data.totp_enabled || false;
  });
});
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Система"
      title="Налаштування"
      subtitle="Профіль, безпека, українська локалізація, гривня та повідомлення."
    />

    <!-- Tabs -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6 glass-strong p-2 rounded-xl">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex flex-col items-center gap-2 px-3 py-3 rounded-xl text-xs font-medium transition-all duration-300"
        :class="
          activeTab === tab.id
            ? 'bg-white/90 dark:bg-dark-card shadow-lg text-gray-900 dark:text-white backdrop-blur-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/10'
        "
      >
        <component :is="tab.icon" :size="20" />
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </button>
    </div>

    <!-- ===== PROFILE TAB ===== -->
    <div v-if="activeTab === 'profile'" class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold backdrop-blur-sm">
          {{ profile.username?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ profile.username }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Зареєстрований: {{ formatShortDate(profile.date_joined) }}</p>
        </div>
        <button
          v-if="!isEditing"
          @click="startEdit"
          class="ml-auto flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all backdrop-blur-sm"
        >
          <Edit3 :size="14" /> Редагувати
        </button>
      </div>

      <div v-if="profileMsg" class="mb-4 px-4 py-2 bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm backdrop-blur-sm">{{ profileMsg }}</div>

      <!-- Display mode -->
      <div v-if="!isEditing" class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
          <Mail :size="16" class="text-gray-400 dark:text-gray-500" />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Email</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ profile.email }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <p class="text-xs text-gray-500 dark:text-gray-400">Ім'я</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ profile.first_name || '—' }}</p>
          </div>
          <div class="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <p class="text-xs text-gray-500 dark:text-gray-400">Прізвище</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ profile.last_name || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Edit mode -->
      <form v-else @submit.prevent="saveProfile" class="space-y-4">
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Email</label>
          <input
            v-model="editForm.email"
            type="email"
            class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Ім'я</label>
            <input
              v-model="editForm.first_name"
              class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Прізвище</label>
            <input
              v-model="editForm.last_name"
              class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            @click="isEditing = false"
            class="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all backdrop-blur-sm"
          >
            Скасувати
          </button>
          <button
            type="submit"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all backdrop-blur-sm"
          >
            <Save :size="16" /> Зберегти
          </button>
        </div>
      </form>
    </div>

    <!-- ===== SECURITY TAB ===== -->
    <div v-if="activeTab === 'security'" class="space-y-6">
      <!-- Change Password -->
      <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock :size="20" /> Зміна пароля
        </h3>

        <div v-if="passwordMsg" class="mb-4 px-4 py-2 bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm backdrop-blur-sm">{{ passwordMsg }}</div>
        <div v-if="passwordError" class="mb-4 px-4 py-2 bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm backdrop-blur-sm">{{ passwordError }}</div>

        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Поточний пароль</label>
            <input
              v-model="passwordForm.old_password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Новий пароль</label>
            <input
              v-model="passwordForm.new_password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Підтвердити новий пароль</label>
            <input
              v-model="passwordForm.confirm_password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            class="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all backdrop-blur-sm"
          >
            Змінити пароль
          </button>
        </form>
      </div>

      <!-- TOTP 2FA -->
      <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield :size="20" /> Двофакторна аутентифікація (2FA)
        </h3>

        <div v-if="totpMsg" class="mb-4 px-4 py-2 bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm backdrop-blur-sm">{{ totpMsg }}</div>
        <div v-if="totpError" class="mb-4 px-4 py-2 bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm backdrop-blur-sm">{{ totpError }}</div>

        <div v-if="!totpEnabled && !showTotpSetup" class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Додайте додатковий рівень безпеки для вашого акаунту. Вам знадобиться додаток-автентифікатор (Google Authenticator, Authy, тощо).
          </p>
          <button
            @click="setupTOTP"
            class="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
          >
            Увімкнути 2FA
          </button>
        </div>

        <div v-if="showTotpSetup" class="space-y-4">
          <div class="bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Крок 1: Скануйте QR-код у вашому додатку-автентифікаторі</p>
            <img :src="totpQrCode" alt="QR Code" class="mx-auto w-48 h-48 bg-white p-2 rounded-xl" />
            <p class="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">Або введіть ключ вручну: {{ totpSecret }}</p>
          </div>

          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Крок 2: Введіть 6-значний код з додатку</label>
            <input
              v-model="totpCode"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="flex gap-3">
            <button
              @click="showTotpSetup = false"
              class="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all backdrop-blur-sm"
            >
              Скасувати
            </button>
            <button
              @click="enableTOTP"
              class="px-4 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-all"
            >
              Підтвердити та Увімкнути
            </button>
          </div>
        </div>

        <div v-if="totpEnabled" class="space-y-4">
          <div class="flex items-center gap-3 p-4 bg-green-50/80 dark:bg-green-900/30 rounded-xl backdrop-blur-sm">
            <CheckCircle :size="20" class="text-green-600 dark:text-green-400" />
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">2FA Увімкнено</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Ваш акаунт захищено двофакторною аутентифікацією</p>
            </div>
          </div>
          <button
            @click="disableTOTP"
            class="px-4 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-all backdrop-blur-sm"
          >
            Вимкнути 2FA
          </button>
        </div>
      </div>
    </div>

    <!-- ===== APPEARANCE TAB ===== -->
    <div v-if="activeTab === 'appearance'" class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Palette :size="20" /> Тема інтерфейсу
      </h3>

      <div v-if="appearanceMsg" class="mb-4 px-4 py-2 bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm backdrop-blur-sm">{{ appearanceMsg }}</div>
      <div v-if="appearanceError" class="mb-4 px-4 py-2 bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm backdrop-blur-sm">{{ appearanceError }}</div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Light Theme -->
        <button
          @click="updateTheme('light')"
          class="p-4 rounded-xl border-2 transition-all"
          :class="
            selectedTheme === 'light'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30'
              : 'border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700 bg-gray-50/50 dark:bg-gray-800/50'
          "
        >
          <div class="w-full h-20 bg-gradient-to-br from-white to-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
            ☀️
          </div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Світла</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Класична світла тема</p>
        </button>

        <!-- Dark Theme -->
        <button
          @click="updateTheme('dark')"
          class="p-4 rounded-xl border-2 transition-all"
          :class="
            selectedTheme === 'dark'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30'
              : 'border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700 bg-gray-50/50 dark:bg-gray-800/50'
          "
        >
          <div class="w-full h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg mb-3 flex items-center justify-center text-4xl">
            🌙
          </div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Темна</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Темна тема для очей</p>
        </button>

        <!-- Auto Theme -->
        <button
          @click="updateTheme('auto')"
          class="p-4 rounded-xl border-2 transition-all"
          :class="
            selectedTheme === 'auto'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30'
              : 'border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700 bg-gray-50/50 dark:bg-gray-800/50'
          "
        >
          <div class="w-full h-20 bg-gradient-to-r from-white via-gray-400 to-gray-900 rounded-lg mb-3 flex items-center justify-center text-4xl">
            🌗
          </div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Авто</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">За системою</p>
        </button>
      </div>

      <button
        @click="saveAppearance"
        :disabled="preferencesStore.isSyncing"
        class="mt-5 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-60"
      >
        {{ preferencesStore.isSyncing ? 'Збереження...' : 'Зберегти тему' }}
      </button>
    </div>

    <!-- ===== LOCALE TAB ===== -->
    <div v-if="activeTab === 'locale'" class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Globe :size="20" /> Мова та Регіон
      </h3>

      <div v-if="preferencesMsg" class="mb-4 px-4 py-2 bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm backdrop-blur-sm">{{ preferencesMsg }}</div>

      <div class="space-y-4">
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">Мова інтерфейсу</label>
          <select
            v-model="languageModel"
            class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="uk">🇺🇦 Українська</option>
            <option value="en">🇬🇧 English</option>
          </select>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Мова інтерфейсу застосунку</p>
        </div>

        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">Валюта</label>
          <select
            v-model="currencyModel"
            class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UAH">₴ Українська гривня (UAH)</option>
          </select>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Суми в інтерфейсі відображаються у гривні</p>
        </div>

        <button
          @click="savePreferences"
          class="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
        >
          Зберегти налаштування
        </button>
      </div>
    </div>

    <!-- ===== NOTIFICATIONS TAB ===== -->
    <div v-if="activeTab === 'notifications'" class="space-y-6">
      <!-- Notification Settings -->
      <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell :size="20" /> Налаштування повідомлень
        </h3>

        <div v-if="notificationsMsg" class="mb-4 px-4 py-2 bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm backdrop-blur-sm">{{ notificationsMsg }}</div>

        <div class="space-y-4">
          <!-- Email Notifications -->
          <div class="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Email повідомлення</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Отримувати повідомлення на email</p>
            </div>
            <input
              v-model="notifications.email_notifications"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Telegram Notifications -->
          <div class="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Telegram повідомлення</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Отримувати повідомлення в Telegram</p>
            </div>
            <input
              v-model="notifications.telegram_notifications"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <hr class="border-gray-200 dark:border-white/10" />

          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Типи повідомлень:</p>

          <!-- Large Expense -->
          <div class="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Великі витрати</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Сповіщення про витрати понад 1000 грн</p>
            </div>
            <input
              v-model="notifications.notify_large_expense"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Budget Exceeded -->
          <div class="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Перевищення бюджету</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Попередження про перевищення</p>
            </div>
            <input
              v-model="notifications.notify_budget_exceeded"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Daily Summary -->
          <div class="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Щоденні звіти</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Підсумок витрат кожного дня</p>
            </div>
            <input
              v-model="notifications.notify_daily_summary"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            @click="saveNotifications"
            class="w-full px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
          >
            Зберегти налаштування
          </button>
        </div>
      </div>

      <!-- Telegram Connection -->
      <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Підключення Telegram</h3>

        <div v-if="telegramLinkMsg" class="mb-4 px-4 py-2 bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm backdrop-blur-sm">{{ telegramLinkMsg }}</div>
        <div v-if="telegramLinkError" class="mb-4 px-4 py-2 bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm backdrop-blur-sm">{{ telegramLinkError }}</div>

        <div v-if="telegramStatus.connected" class="space-y-4">
          <div class="flex flex-wrap items-center gap-3 p-4 bg-green-50/80 dark:bg-green-900/30 rounded-xl backdrop-blur-sm">
            <CheckCircle :size="20" class="text-green-600 dark:text-green-400 shrink-0" />
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">Підключено</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">@{{ telegramStatus.username || 'невідомий' }}</p>
            </div>
            <button
              @click="unlinkTelegram"
              :disabled="isUnlinkLoading"
              class="px-4 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-all disabled:opacity-50"
            >
              {{ isUnlinkLoading ? 'Відв’язуємо...' : 'Відв’язати Telegram' }}
            </button>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Ви можете використовувати Telegram бота для швидкого перегляду балансу та додавання транзакцій.
          </p>
        </div>

        <div v-else class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Підв’яжіть Telegram для отримання повідомлень та швидкого керування фінансами через бота.
          </p>
          <button
            @click="connectTelegram"
            :disabled="isLinkLoading"
            class="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
          >
            {{ isLinkLoading ? 'Генеруємо ключ...' : 'Підв’язати Telegram' }}
          </button>

          <div v-if="showTelegramLink" class="space-y-3 p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <p class="text-xs text-gray-500 dark:text-gray-400">Секретний ключ для Telegram бота:</p>
            <div class="flex flex-wrap items-center gap-2">
              <code class="px-3 py-2 rounded-lg bg-white/80 dark:bg-dark-input/70 text-gray-900 dark:text-white text-sm break-all">{{ telegramLinkToken }}</code>
              <button
                @click="copyTelegramLink"
                class="px-3 py-2 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
              >
                Скопіювати
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              У Telegram-боті натисніть кнопку <span class="font-medium">Прив’язати акаунт</span> і надішліть цей ключ.
            </p>
            <p v-if="telegramLinkExpires" class="text-xs text-gray-500 dark:text-gray-400">
              Дійсний до: {{ formatShortDate(telegramLinkExpires) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== FILES & DATA TAB ===== -->
    <div v-if="activeTab === 'files'" class="space-y-6">
      <!-- Upload Section -->
      <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload :size="20" /> Нова виписка
        </h3>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="min-w-[200px]">
            <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Банк</label>
            <select
              v-model="selectedBank"
              class="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Оберіть банк</option>
              <option v-for="b in banks" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Файл (.csv, .xls, .xlsx, .pdf)</label>
            <input
              type="file"
              @change="onFileSelect"
              accept=".csv,.xls,.xlsx,.pdf"
              class="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
            />
          </div>
          <button
            @click="uploadFile"
            :disabled="isUploading"
            class="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Upload :size="16" />
            {{ isUploading ? 'Завантаження...' : 'Завантажити' }}
          </button>
        </div>
      </div>

      <!-- Uploads List -->
      <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Завантажені виписки</h3>

        <div v-if="isLoadingFiles" class="text-center py-12 text-gray-400">Завантаження...</div>

        <div v-else class="space-y-3">
          <div v-if="!uploads.length" class="text-center py-12 text-gray-400">
            <FileText :size="48" class="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>Виписок ще немає</p>
          </div>

          <div
            v-for="u in uploads"
            :key="u.id"
            class="bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4"
          >
            <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <FileText :size="20" class="text-gray-500 dark:text-gray-400" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-gray-900 dark:text-white text-sm">{{ u.bank_name || 'Невідомий банк' }}</span>
                <span class="flex items-center gap-1 text-xs" :class="statusColors[u.status]">
                  <component :is="statusIcons[u.status]" :size="12" />
                  {{ statusLabels[u.status] }}
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(u.uploaded_at) }} · {{ u.total_transactions }} транзакцій
              </p>
            </div>

            <button
              @click="deleteUpload(u.id)"
              class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all p-2"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Export & Delete -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Export Data -->
        <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Download :size="20" /> Експорт даних
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Завантажте всі ваші дані у форматі JSON</p>
          <button
            @click="exportData"
            class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
          >
            <Download :size="16" /> Завантажити JSON
          </button>
        </div>

        <!-- Delete Account -->
        <div class="bg-red-50/70 dark:bg-red-900/20 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-red-200/50 dark:border-red-800/50">
          <h3 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <Trash2 :size="20" /> Видалення акаунту
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Цю дію не можна скасувати</p>

          <div v-if="deleteError" class="mb-4 px-4 py-2 bg-red-100/80 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-xl text-sm backdrop-blur-sm">{{ deleteError }}</div>

          <div class="space-y-3">
            <input
              v-model="deletePassword"
              type="password"
              placeholder="Введіть пароль"
              class="w-full px-3 py-2 border border-red-200 dark:border-red-800 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              @click="deleteAccount"
              class="w-full px-4 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-all"
            >
              Видалити акаунт
            </button>
          </div>
        </div>
      </div>

      <button
        @click="saveNotifications"
        class="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
      >
        Зберегти налаштування повідомлень
      </button>
    </div>
  </div>
</template>
