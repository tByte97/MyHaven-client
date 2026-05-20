<script setup>
import { ref, onMounted } from 'vue';
import api from '../stores/api';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { User, Lock, Download, Trash2, Save, Shield, Mail, Edit3 } from 'lucide-vue-next';

const auth = useAuthStore();
const router = useRouter();

const profile = ref({ username: '', email: '', first_name: '', last_name: '', date_joined: '' });
const isEditing = ref(false);
const editForm = ref({});
const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '' });
const deletePassword = ref('');

const profileMsg = ref('');
const passwordMsg = ref('');
const passwordError = ref('');
const deleteError = ref('');

const activeTab = ref('profile');

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

onMounted(fetchProfile);
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Профіль</h1>
      <p class="text-gray-500 text-sm">Налаштування профілю та безпеки</p>
    </header>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
      <button
        v-for="tab in [
          { id: 'profile', label: 'Профіль', icon: User },
          { id: 'security', label: 'Безпека', icon: Shield },
          { id: 'data', label: 'Дані', icon: Download },
        ]"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition"
        :class="activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'"
      >
        <component :is="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Profile Tab -->
    <div v-if="activeTab === 'profile'" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
          {{ profile.username?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ profile.username }}</h2>
          <p class="text-sm text-gray-500">Зареєстрований: {{ new Date(profile.date_joined).toLocaleDateString('uk-UA') }}</p>
        </div>
        <button v-if="!isEditing" @click="startEdit" class="ml-auto flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
          <Edit3 :size="14" /> Редагувати
        </button>
      </div>

      <div v-if="profileMsg" class="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm">{{ profileMsg }}</div>

      <!-- Display mode -->
      <div v-if="!isEditing" class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <Mail :size="16" class="text-gray-400" />
          <div>
            <p class="text-xs text-gray-500">Email</p>
            <p class="text-sm font-medium text-gray-900">{{ profile.email }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 bg-gray-50 rounded-xl">
            <p class="text-xs text-gray-500">Ім'я</p>
            <p class="text-sm font-medium text-gray-900">{{ profile.first_name || '—' }}</p>
          </div>
          <div class="p-3 bg-gray-50 rounded-xl">
            <p class="text-xs text-gray-500">Прізвище</p>
            <p class="text-sm font-medium text-gray-900">{{ profile.last_name || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Edit mode -->
      <form v-else @submit.prevent="saveProfile" class="space-y-4">
        <div>
          <label class="text-sm text-gray-600 mb-1 block">Email</label>
          <input v-model="editForm.email" type="email" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Ім'я</label>
            <input v-model="editForm.first_name" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Прізвище</label>
            <input v-model="editForm.last_name" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" @click="isEditing = false" class="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition">Скасувати</button>
          <button type="submit" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            <Save :size="16" /> Зберегти
          </button>
        </div>
      </form>
    </div>

    <!-- Security Tab -->
    <div v-if="activeTab === 'security'" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Lock :size="20" /> Зміна пароля
      </h3>

      <div v-if="passwordMsg" class="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm">{{ passwordMsg }}</div>
      <div v-if="passwordError" class="mb-4 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm">{{ passwordError }}</div>

      <form @submit.prevent="changePassword" class="space-y-4">
        <div>
          <label class="text-sm text-gray-600 mb-1 block">Поточний пароль</label>
          <input v-model="passwordForm.old_password" type="password" required
            class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-sm text-gray-600 mb-1 block">Новий пароль</label>
          <input v-model="passwordForm.new_password" type="password" required
            class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="text-sm text-gray-600 mb-1 block">Підтвердити новий пароль</label>
          <input v-model="passwordForm.confirm_password" type="password" required
            class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" class="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
          Змінити пароль
        </button>
      </form>
    </div>

    <!-- Data Tab -->
    <div v-if="activeTab === 'data'" class="space-y-6">
      <!-- Export -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Download :size="20" /> Експорт даних
        </h3>
        <p class="text-sm text-gray-500 mb-4">Завантажте всі ваші дані у форматі JSON (транзакції, бюджети, виписки).</p>
        <button @click="exportData" class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
          <Download :size="16" /> Завантажити JSON
        </button>
      </div>

      <!-- Delete account -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-red-200">
        <h3 class="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
          <Trash2 :size="20" /> Видалення акаунту
        </h3>
        <p class="text-sm text-gray-500 mb-4">Цю дію не можна скасувати. Всі ваші дані будуть видалені назавжди.</p>

        <div v-if="deleteError" class="mb-4 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm">{{ deleteError }}</div>

        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label class="text-sm text-gray-600 mb-1 block">Введіть пароль для підтвердження</label>
            <input v-model="deletePassword" type="password"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <button @click="deleteAccount" class="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition whitespace-nowrap">
            Видалити акаунт
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
