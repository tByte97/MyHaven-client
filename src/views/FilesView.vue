<script setup>
import { ref, onMounted } from 'vue';
import api from '../stores/api';
import { Upload, Trash2, FileText, CheckCircle, AlertCircle, Clock, Loader } from 'lucide-vue-next';

const uploads = ref([]);
const banks = ref([]);
const isLoading = ref(true);
const isUploading = ref(false);

const selectedBank = ref('');
const selectedFile = ref(null);

const statusIcons = {
  COMPLETED: CheckCircle,
  FAILED: AlertCircle,
  PENDING: Clock,
  PROCESSING: Loader,
};

const statusColors = {
  COMPLETED: 'text-green-600',
  FAILED: 'text-red-500',
  PENDING: 'text-yellow-500',
  PROCESSING: 'text-blue-500',
};

const statusLabels = {
  COMPLETED: 'Завершено',
  FAILED: 'Помилка',
  PENDING: 'Очікує',
  PROCESSING: 'В обробці',
};

async function fetchUploads() {
  isLoading.value = true;
  try {
    const res = await api.getUploads();
    uploads.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

async function fetchBanks() {
  try {
    const res = await api.getBanks();
    banks.value = res.data;
  } catch (e) { console.error(e); }
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
  } catch (e) { console.error(e); }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  fetchUploads();
  fetchBanks();
});
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Керування виписками</h1>
      <p class="text-gray-500 text-sm">Завантаження та управління банківськими виписками</p>
    </header>

    <!-- Upload form -->
    <div class="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Upload :size="20" /> Нова виписка
      </h3>
      <div class="flex flex-wrap gap-4 items-end">
        <div class="min-w-[200px]">
          <label class="text-sm text-gray-600 mb-1 block">Банк</label>
          <select v-model="selectedBank" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="" disabled>Оберіть банк</option>
            <option v-for="b in banks" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="text-sm text-gray-600 mb-1 block">Файл (.csv, .xls, .xlsx, .pdf)</label>
          <input type="file" @change="onFileSelect" accept=".csv,.xls,.xlsx,.pdf"
            class="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        <button
          @click="uploadFile"
          :disabled="isUploading"
          class="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Upload :size="16" />
          {{ isUploading ? 'Завантаження...' : 'Завантажити' }}
        </button>
      </div>
    </div>

    <!-- Uploads list -->
    <div v-if="isLoading" class="text-center py-12 text-gray-400">Завантаження...</div>

    <div v-else class="space-y-3">
      <div v-if="!uploads.length" class="text-center py-12 text-gray-400">
        <FileText :size="48" class="mx-auto mb-3 text-gray-300" />
        <p>Виписок ще немає</p>
      </div>

      <div
        v-for="u in uploads"
        :key="u.id"
        class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
      >
        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <FileText :size="20" class="text-gray-500" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-gray-900 text-sm">{{ u.bank_name || 'Невідомий банк' }}</span>
            <span class="flex items-center gap-1 text-xs" :class="statusColors[u.status]">
              <component :is="statusIcons[u.status]" :size="12" />
              {{ statusLabels[u.status] }}
            </span>
          </div>
          <p class="text-xs text-gray-500">
            {{ formatDate(u.uploaded_at) }} · {{ u.total_transactions }} транзакцій
          </p>
        </div>

        <button @click="deleteUpload(u.id)" class="text-gray-400 hover:text-red-500 transition p-2">
          <Trash2 :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>
